import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';

export const trackExerciseComplete = async (exerciseId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid, "stats", "relaxStats");
  
  try {
    await setDoc(userRef, {
      totalCompleted: increment(1),
      [exerciseId]: increment(1),
      lastCompleted: new Date().toISOString()
    }, { merge: true });
    console.log("Progressie opgeslagen!");
  } catch (e) {
    console.error("Fout bij opslaan progressie:", e);
  }
};