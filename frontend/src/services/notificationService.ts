import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  title: string;
  desc: string;
  type: 'assignment_turned_in' | 'warning' | 'check_circle' | 'info';
  isRead: boolean;
  createdAt: any;
  
  // Context Data
  reportId: string;
  dogName: string;
  breed: string;
  newStatus?: string;
  orgName?: string;
}

export const notificationService = {
  
  // 1. Send a Notification (Used by OrgDetailViews)
  async sendNotification(
    recipientId: string, 
    title: string, 
    desc: string, 
    type: Notification['type'],
    contextData: { reportId: string, dogName: string, breed: string, newStatus?: string, orgName?: string }
  ) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: recipientId,
        title,
        desc,
        type,
        isRead: false,
        createdAt: serverTimestamp(),
        ...contextData
      });
      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  },

  // 2. Subscribe to Notifications (Used by UserNotification.tsx)
  subscribeToNotifications(userId: string, callback: (notis: Notification[]) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      callback(notifications);
    });
  },

  // 3. Mark Single as Read
  async markAsRead(notificationId: string) {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { isRead: true });
  },

  // 4. Mark All as Read
  async markAllAsRead(notifications: Notification[]) {
    const batch = writeBatch(db);
    notifications.forEach(notif => {
      if (!notif.isRead) {
        const ref = doc(db, 'notifications', notif.id);
        batch.update(ref, { isRead: true });
      }
    });
    await batch.commit();
  }
};