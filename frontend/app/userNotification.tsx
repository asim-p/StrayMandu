import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../src/config/firebase';
import { notificationService, Notification } from '../src/services/notificationService';

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  unread: '#FEF3C7',
  read: '#F3F4F6',
  border: '#E5E7EB',
};

export default function UserNotification() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to view notifications');
      router.back();
      return;
    }

    setLoading(true);

    // Subscribe to real-time notifications
    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid,
      (notis) => {
        setNotifications(notis);
        setUnreadCount(notis.filter(n => !n.isRead).length);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(notifications);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }

    // Navigate to the report detail page
    if (notification.reportId) {
      router.push({
        pathname: '/detailReports',
        params: { id: notification.reportId }
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_turned_in':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'check_circle':
        return 'verified';
      default:
        return 'notifications';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'acknowledged':
        return '#3B82F6';
      case 'ongoing':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return COLORS.textSub;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSub }}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <MaterialIcons name="done-all" size={20} color={COLORS.primary} />
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={64} color={COLORS.textSub} />
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptyDesc}>
            You'll get updates here when organizations make changes to your reported dogs.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.notificationCard,
                !item.isRead && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              {/* Left Icon */}
              <View
                style={[
                  styles.iconContainer,
                  !item.isRead && { backgroundColor: 'rgba(55, 236, 19, 0.2)' }
                ]}
              >
                <MaterialIcons
                  name={getNotificationIcon(item.type)}
                  size={24}
                  color={!item.isRead ? COLORS.primary : COLORS.textSub}
                />
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notificationTitle, !item.isRead && styles.unreadTitle]}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationDesc} numberOfLines={2}>
                  {item.desc}
                </Text>

                {/* Dog Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailTag}>
                    <MaterialIcons name="pets" size={14} color={COLORS.primary} />
                    <Text style={styles.detailText}>{item.dogName}</Text>
                  </View>
                  <View style={styles.detailTag}>
                    <Text style={styles.detailText}>{item.breed}</Text>
                  </View>
                  {item.newStatus && (
                    <View
                      style={[
                        styles.statusTag,
                        { backgroundColor: getStatusColor(item.newStatus) + '20' }
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(item.newStatus) }]}>
                        {item.newStatus}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Timestamp */}
                <Text style={styles.timestamp}>
                  {item.createdAt && getTimeAgo((item.createdAt as any).seconds)}
                </Text>
              </View>

              {/* Right Arrow */}
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textSub} />
            </Pressable>
          )}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// Helper function to format time
const getTimeAgo = (seconds: number): string => {
  if (!seconds) return 'Just now';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '800',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    backgroundColor: COLORS.unread,
    borderColor: '#FCD34D',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  notificationDesc: {
    fontSize: 13,
    color: COLORS.textSub,
    marginBottom: 8,
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
