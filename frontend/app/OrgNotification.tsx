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
// Removed: useAuth and notificationService imports
import OrgBottomNav from '../src/components/OrgBottom';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceDark: '#1c2e18',
  textMain: '#121811',
  textSub: '#64748b',
  white: '#ffffff',
  border: '#f1f5f9',
  urgent: '#fee2e2',
  urgentText: '#dc2626',
  system: '#eff6ff',
  systemText: '#2563eb',
};

const CATEGORIES = ['All', 'Reports', 'Urgent', 'System'];

// --- MOCK DATA GENERATOR ---
// We create a helper to mimic Firestore Timestamp: { toDate: () => Date }
const createTimestamp = (daysAgo = 0, hoursAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return { toDate: () => date };
};

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Urgent: Bin Overflow',
    desc: 'Bin #403 at Central Park is at 98% capacity. Immediate pickup required.',
    type: 'alert-decagram',
    category: 'Urgent',
    isRead: false,
    createdAt: createTimestamp(0, 1), // Today, 1 hour ago
  },
  {
    id: '2',
    title: 'New Report Submitted',
    desc: 'A user reported a missed pickup in Sector 4 via the mobile app.',
    type: 'bell-ring',
    category: 'Reports',
    isRead: false,
    createdAt: createTimestamp(0, 5), // Today, 5 hours ago
  },
  {
    id: '3',
    title: 'System Maintenance',
    desc: 'Scheduled server maintenance was completed successfully at 3:00 AM.',
    type: 'check_circle',
    category: 'System',
    isRead: true,
    createdAt: createTimestamp(1, 0), // Yesterday
  },
  {
    id: '4',
    title: 'Weekly Summary Available',
    desc: 'Your organization collected 450kg of waste last week. Click to view report.',
    type: 'bell-ring',
    category: 'System',
    isRead: true,
    createdAt: createTimestamp(5, 0), // 5 Days ago (Earlier)
  },
];

export default function OrgNotification() {
  const router = useRouter();
  
  // Set initial state to MOCK_NOTIFICATIONS
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false); // No loading needed for hardcoded
  const [activeTab, setActiveTab] = useState('All');

  // --- LOCAL HANDLERS (Replacing Service Calls) ---
  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // --- GROUPING LOGIC ---
  const groupNotifications = (notis) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);

    const filtered = notis.filter((n) => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Urgent') return n.category === 'Urgent' || n.title.toLowerCase().includes('urgent');
      return n.category === activeTab;
    });

    return {
      Today: filtered.filter(n => n.createdAt?.toDate().getTime() >= today),
      Yesterday: filtered.filter(n => {
        const time = n.createdAt?.toDate().getTime();
        return time < today && time >= yesterday;
      }),
      Earlier: filtered.filter(n => n.createdAt?.toDate().getTime() < yesterday),
    };
  };

  const groups = groupNotifications(notifications);

  // --- RENDER NOTIFICATION ITEM ---
  const renderItem = (item) => {
    const isUrgent = item.title.toLowerCase().includes('urgent') || item.category === 'Urgent';
    
    return (
      <Pressable 
        key={item.id}
        onPress={() => handleMarkAsRead(item.id)}
        style={[styles.notiCard, !item.isRead && styles.unreadCard]}
      >
        <View style={[
          styles.iconCircle, 
          { backgroundColor: isUrgent ? COLORS.urgent : COLORS.system }
        ]}>
          <MaterialCommunityIcons 
            name={isUrgent ? 'alert-decagram' : 'bell-ring'} 
            size={24} 
            color={isUrgent ? COLORS.urgentText : COLORS.systemText} 
          />
        </View>

        <View style={styles.content}>
          <View style={styles.notiHeader}>
            <Text style={styles.notiTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.timeText}>
               {item.createdAt ? formatTime(item.createdAt.toDate()) : 'Now'}
            </Text>
          </View>
          <Text style={styles.notiDesc} numberOfLines={2}>{item.desc}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
          </Pressable>
          <Pressable onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        </View>
        <Text style={styles.pageTitle}>Notifications</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {CATEGORIES.map(cat => (
            <Pressable 
              key={cat} 
              onPress={() => setActiveTab(cat)}
              style={[styles.tab, activeTab === cat && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === cat && styles.tabTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* --- LIST --- */}
      <ScrollView contentContainerStyle={styles.listBody} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          <>
            {groups.Today.length > 0 && (
              <Section title="Today" items={groups.Today} render={renderItem} />
            )}
            {groups.Yesterday.length > 0 && (
              <Section title="Yesterday" items={groups.Yesterday} render={renderItem} />
            )}
            {groups.Earlier.length > 0 && (
              <Section title="Earlier" items={groups.Earlier} render={renderItem} />
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <OrgBottomNav activePage="alerts" />
    </SafeAreaView>
  );
}

// --- SUB-COMPONENTS ---
const Section = ({ title, items, render }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    {items.map((item) => render(item))}
  </View>
);

// --- HELPER ---
const formatTime = (date) => {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  markAll: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textMain, marginTop: 10 },
  tabScroll: { marginTop: 15, marginBottom: 15 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  tabActive: { backgroundColor: COLORS.textMain, borderColor: COLORS.textMain },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  tabTextActive: { color: COLORS.white },
  
  listBody: { paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 12, letterSpacing: 1 },
  
  notiCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  unreadCard: { borderWidth: 1, borderColor: COLORS.primary + '80', backgroundColor: '#f0fdf4' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: 15 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notiTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textMain, flex: 1 },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  notiDesc: { fontSize: 13, color: COLORS.textSub, marginTop: 3, lineHeight: 18 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10, shadowColor: COLORS.primary, shadowOpacity: 0.6, shadowRadius: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' }
});