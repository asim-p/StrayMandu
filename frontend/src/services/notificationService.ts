import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  writeBatch,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// --- 1. EXPORT THE INTERFACE ---
// This fixes: Module '...' has no exported member 'Notification'
export interface Notification {
  id: string;
  userId: string;
  title: string;
  desc: string;
  type: 'pets' | 'campaign' | 'chat_bubble' | 'check_circle' | 'assignment_turned_in' | 'warning' | 'assignment_ind' | 'bar_chart';
  category: 'Reports' | 'Adoptions' | 'Announcements' | 'Urgent' | 'System';
  isRead: boolean;
  createdAt: Timestamp; 
}

export const notificationService = {
  // Create a new notification
  sendNotification: async (userId: string, data: Partial<Omit<Notification, 'id' | 'createdAt' | 'isRead'>>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        userId,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  },

  // Listen to notifications (Renamed to 'subscribe' to match your Screen call)
  subscribe: (userId: string, callback: (notis: Notification[]) => void) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notis = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      callback(notis);
    });
  },

  // Mark all as read
  markAllAsRead: async (notifications: Notification[]) => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    return await batch.commit();
  },

  // Mark single as read
  markAsRead: async (notificationId: string) => {
    const ref = doc(db, 'notifications', notificationId);
    return await updateDoc(ref, { isRead: true });
  }
};