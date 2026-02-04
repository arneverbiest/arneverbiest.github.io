import { db } from '../../firebaseConfig';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

export const fetchAllLogs = async (userId: string) => {
  const q5G = query(collection(db, "users", userId, "logbookEntries"), orderBy("createdAt", "desc"), limit(20));
  const qReflect = query(collection(db, "users", userId, "reflections"), orderBy("createdAt", "desc"), limit(20));

  const [snap5G, snapReflect] = await Promise.all([getDocs(q5G), getDocs(qReflect)]);

  const logs5G = snap5G.docs.map(doc => ({ id: doc.id, type: '5G', ...doc.data() }));
  const logsReflect = snapReflect.docs.map(doc => ({ id: doc.id, type: 'REFLECT', ...doc.data() }));

  return [...logs5G, ...logsReflect].sort((a: any, b: any) => 
    (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)
  );
};