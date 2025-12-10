import { db } from './firebaseConfig';
import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Baby, Log } from '../types';

// Bolani saqlash (UserId ni qo'shish juda muhim)
export const saveBabyToFirebase = async (baby: Baby, userId: string) => {
  try {
    const babyRef = doc(db, "babies", baby.id);
    await setDoc(babyRef, {
      ...baby,
      userId: userId, // Bu qator bolani ota-onaga bog'laydi
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Bolani saqlashda xatolik:", error);
    throw error; // Xatoni Auth komponentiga qaytaramiz
  }
};

// Loglarni saqlash (Logika uchun)
export const saveLogToFirebase = async (log: Log) => {
    try {
        await setDoc(doc(db, "logs", log.id), log);
    } catch (error) {
        console.error("Logni saqlashda xatolik:", error);
    }
};

// Bolalar ro'yxatini real vaqtda olish
export const subscribeToBabies = (userId: string, callback: (babies: Baby[]) => void) => {
  const q = query(collection(db, "babies"), where("userId", "==", userId));
  
  return onSnapshot(q, (snapshot) => {
    const babies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Baby));
    callback(babies);
  }, (error) => {
      console.error("Babies subscription error:", error);
  });
};

// Loglarni real vaqtda olish
export const subscribeToLogs = (babyId: string, callback: (logs: Log[]) => void) => {
    const q = query(collection(db, "logs"), where("babyId", "==", babyId));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
        logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        callback(logs);
    });
};