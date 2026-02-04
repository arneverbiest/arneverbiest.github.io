import { db, auth } from '../../firebaseConfig';
import { 
  doc, 
  updateDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  increment 
} from 'firebase/firestore';

/**
 * Voedt een specifieke waarde in de boom.
 */
export const feedValue = async (valueId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  // We zorgen dat de ID altijd consistent is (kleine letters, geen spaties)
  const formattedId = valueId.toLowerCase().replace(/\s/g, '_');
  const valueRef = doc(db, "users", user.uid, "tree", formattedId);

  try {
    const docSnap = await getDoc(valueRef);
    if (docSnap.exists()) {
      const currentLevel = docSnap.data().level || 3;
      const newLevel = Math.min(currentLevel + 1, 5);

      await updateDoc(valueRef, {
        level: newLevel,
        lastFed: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Fout bij voeden waarde:", error);
  }
};

/**
 * Verwijdert alle huidige waarden van de gebruiker (Reset)
 */
export const resetTree = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const treeRef = collection(db, "users", user.uid, "tree");
  
  try {
    const snap = await getDocs(treeRef);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.delete(d.ref);
    });

    await batch.commit();
    console.log("Oude boom verwijderd.");
  } catch (error) {
    console.error("Fout bij resetten boom:", error);
    throw error;
  }
};