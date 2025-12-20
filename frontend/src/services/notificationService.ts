// frontend/src/services/notificationService.ts
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
  // Changed name to subscribeToNotifications to match your UI component
  subscribeToNotifications: (userId: string, callback: (notis: Notification[]) => void) => {
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

  markAsRead: async (notificationId: string) => {
    const ref = doc(db, 'notifications', notificationId);
    return await updateDoc(ref, { isRead: true });
  }
};