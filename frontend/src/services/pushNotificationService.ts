// src/services/pushNotificationService.ts
// NOTE: Push notifications are disabled for Expo Go
// To enable push notifications, you'll need to create a development build
// See: https://docs.expo.dev/develop/development-builds/introduction/

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const pushNotificationService = {
  // Request notification permissions and get push token (disabled for Expo Go)
  requestPermissionsAndGetToken: async (userId: string) => {
    try {
      console.log('Push notifications are disabled in Expo Go. Use a development build to enable them.');
      // Placeholder for when development build is used
      return null;
    } catch (error) {
      console.error('Error with push notifications:', error);
      return null;
    }
  },

  // Send a push notification to a user (disabled for Expo Go)
  sendPushNotification: async (
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    try {
      console.log('Push notifications disabled. In-app notification sent instead.');
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  },

  // Set up notification listeners (no-op for Expo Go)
  setupNotificationListeners: () => {
    return () => {
      // Cleanup
    };
  },
};
