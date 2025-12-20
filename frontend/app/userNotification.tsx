import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
// Import both the service and the interface
import { notificationService, Notification } from '../src/services/notificationService';
import BottomNav from '../src/components/BottomNav';

const { width } = Dimensions.get('window');

const DESIGN = {
  primary: '#37ec13',
  background: '#f6f8f6',
  white: '#ffffff',
  textMain: '#121811',
  textSub: '#64748b',
  border: '#f1f5f9',
};

const CATEGORIES = ['All', 'Reports', 'Adoptions', 'Announcements'];

export default function UserNotification() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Use the Notification interface instead of any[]
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  // --- FETCH REAL-TIME DATA ---
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // This matches the subscribeToNotifications name in your service
    const unsubscribe = notificationService.subscribeToNotifications(
      user.uid, 
      (data) => {
        setNotifications(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS ---
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead(notifications);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleItemPress = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await notificationService.markAsRead(id);
    }
    // Optionally navigate to specific report/detail here
  };

  // --- FILTERING ---
  const filteredNotis = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    return n.category === activeTab;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* --- TOP BAR --- */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={DESIGN.textMain} />
          </Pressable>
          <Pressable onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
        <Text style={styles.pageTitle}>Notifications</Text>
      </View>

      {/* --- FILTER TABS --- */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveTab(cat)}
              style={[styles.chip, activeTab === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeTab === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* --- NOTIFICATION LIST --- */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DESIGN.primary} />
          </View>
        ) : filteredNotis.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="notifications-off" size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No new notifications</Text>
            <Text style={styles.emptySub}>We'll let you know when there are updates.</Text>
          </View>
        ) : (
          filteredNotis.map((item) => (
            <Pressable 
              key={item.id} 
              onPress={() => handleItemPress(item.id, item.isRead)}
              style={[styles.notiItem, !item.isRead && styles.notiUnread]}
            >
              {/* Green vertical bar for unread */}
              {!item.isRead && <View style={styles.unreadIndicator} />}

              <View style={styles.notiMainRow}>
                {/* Icon/Avatar logic */}
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(item.type)}15` }]}>
                    <MaterialCommunityIcons 
                      name={getIconName(item.type)} 
                      size={24} 
                      color={getIconColor(item.type)} 
                    />
                </View>

                {/* Text Content */}
                <View style={styles.textWrapper}>
                  <View style={styles.textTopRow}>
                    <Text style={[styles.notiTitle, item.isRead && styles.textDimmed]}>{item.title}</Text>
                    <Text style={styles.notiTime}>
                      {item.createdAt?.seconds ? formatTime(item.createdAt.seconds) : 'Just now'}
                    </Text>
                  </View>
                  <Text style={[styles.notiDesc, item.isRead && styles.textDimmed]} numberOfLines={2}>
                    {item.desc}
                  </Text>
                </View>

                {/* Right side status */}
                <div style={styles.rightStatus as any}>
                  {!item.isRead ? (
                    <View style={styles.greenDot} />
                  ) : (
                    <MaterialIcons name="chevron-right" size={20} color="#cbd5e1" />
                  )}
                </div>
              </View>
            </Pressable>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* --- NAVIGATION --- */}
      <BottomNav activePage="alerts" />
    </SafeAreaView>
  );
}

// --- HELPERS ---
const getIconName = (type: string): any => {
  switch (type) {
    case 'check_circle': return 'check-circle';
    case 'chat_bubble': return 'message-text';
    case 'pets': return 'paw';
    case 'campaign': return 'bullhorn';
    case 'warning': return 'alert-circle';
    case 'assignment_turned_in': return 'clipboard-check';
    default: return 'bell';
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'check_circle': return '#059669';
    case 'chat_bubble': return '#3b82f6';
    case 'pets': return '#f97316';
    case 'campaign': return '#3b82f6';
    case 'warning': return '#ef4444';
    default: return '#37ec13';
  }
};

const formatTime = (seconds: number) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DESIGN.white },
  headerContainer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: DESIGN.white },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  markAllText: { color: '#047857', fontWeight: '800', fontSize: 14 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: DESIGN.textMain, marginTop: 8 },
  
  filterBar: { borderBottomWidth: 1, borderBottomColor: DESIGN.border, paddingBottom: 16, marginTop: 15 },
  filterScroll: { paddingHorizontal: 16, gap: 10 },
  chip: { height: 38, paddingHorizontal: 20, borderRadius: 19, backgroundColor: '#f1f5f9', justifyContent: 'center' },
  chipActive: { backgroundColor: DESIGN.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#000', fontWeight: '800' },

  listContent: { flexGrow: 1 },
  notiItem: { paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: DESIGN.border, position: 'relative' },
  notiUnread: { backgroundColor: '#37ec1305' },
  unreadIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: DESIGN.primary, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  notiMainRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  textWrapper: { flex: 1, marginLeft: 16 },
  textTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  notiTitle: { fontSize: 16, fontWeight: '800', color: DESIGN.textMain, flex: 1 },
  notiTime: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  notiDesc: { fontSize: 14, color: '#475569', lineHeight: 20, fontWeight: '500' },
  textDimmed: { opacity: 0.6, fontWeight: '500' },
  rightStatus: { marginLeft: 10, height: 48, justifyContent: 'center' },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: DESIGN.primary },

  center: { marginTop: 100, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: DESIGN.textMain },
  emptySub: { fontSize: 14, color: DESIGN.textSub, textAlign: 'center', marginTop: 8 },
});