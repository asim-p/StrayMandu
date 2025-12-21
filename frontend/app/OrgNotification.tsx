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
import { notificationService, Notification } from '../src/services/notificationService';
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

export default function OrgNotification() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // --- REAL-TIME DATA FETCH ---
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- RENDER NOTIFICATION ITEM ---
  const renderItem = (item: Notification) => {
    const isUrgent = item.title.toLowerCase().includes('urgent') || item.type === 'check_circle';
    
    return (
      <Pressable 
        key={item.id}
        onPress={() => notificationService.markAsRead(item.id)}
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
        </View>
        <Text style={styles.pageTitle}>Notifications</Text>
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
          notifications.map((item: Notification) => renderItem(item))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <OrgBottomNav activePage="alerts" />
    </SafeAreaView>
  );
}

// --- HELPER ---
const formatTime = (date: Date) => {
  const diff = (new Date().getTime() - date.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#import React, { useState, useEffect } from 'react';
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
import OrgBottomNav from '../src/components/OrgBottom';

// Define Notification Type
interface Notification {
  id: string;
  title: string;
  desc: string;
  type: string;
  isRead: boolean;
  createdAt: { toDate: () => Date };
  distance: string; // Hardcoded distance string
}

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

// Helper to create a mock Firestore Timestamp
const createMockTimestamp = (isoDateString: string) => {
  return {
    toDate: () => new Date(isoDateString),
  };
};

// --- HARDCODED DATA (4 DB + 1 Artificial) ---
const HARDCODED_NOTIFICATIONS: Notification[] = [
  {
    id: 'report-005',
    title: 'Urgent: Injured Dog Found',
    desc: 'Dog has broken leg, needs immediate assistance.',
    type: 'alert',
    isRead: false,
    createdAt: createMockTimestamp('2025-12-21T09:30:11+05:45'),
    distance: '1.6 km' // Hardcoded distance
  },
  // 1. Artificial Data
  {
    id: 'art-001',
    title: 'System: Registration Verified',
    desc: 'Welcome! Your organization account has been verified successfully. You can now respond to alerts.',
    type: 'info',
    isRead: false,
    createdAt: createMockTimestamp('2025-12-21T09:15:00+05:45'),
    distance: '0.0 km' // Artificial
  },
  // 2. DB Report: Stray Group
  {
    id: 'report-004',
    title: 'Urgent: Stray Group Sighted',
    desc: 'Group of stray dogs romaing around the location.',
    type: 'alert',
    isRead: false,
    createdAt: createMockTimestamp('2025-12-21T09:04:11+05:45'),
    distance: '2.1 km' // Hardcoded distance
  },
  // 3. DB Report: Aggressive Group
  {
    id: 'report-003',
    title: 'Urgent: Aggressive Group Alert',
    desc: 'Group of aggressive dogs roaming around the location.',
    type: 'alert',
    isRead: false,
    createdAt: createMockTimestamp('2025-12-21T08:56:54+05:45'),
    distance: '0.5 km' // Hardcoded distance
  },
  // 4. DB Report: Lost Dog Jackey
  {
    id: 'report-001',
    title: 'Urgent: Lost Dog - Jackey',
    desc: 'My dog is lost Last seen in the pinpoint location.',
    type: 'alert',
    isRead: true,
    createdAt: createMockTimestamp('2025-12-21T08:48:31+05:45'),
    distance: '1.8 km' // Hardcoded distance
  },
  // 5. DB Report: Malnourished Dog
  {
    id: 'report-002',
    title: 'Urgent: Malnourished Dog',
    desc: 'Severely malnourished,take action!',
    type: 'alert',
    isRead: true,
    createdAt: createMockTimestamp('2025-12-21T01:50:46+05:45'),
    distance: '3.4 km' // Hardcoded distance
  },
];

export default function OrgNotification() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setNotifications(HARDCODED_NOTIFICATIONS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // --- RENDER NOTIFICATION ITEM ---
  const renderItem = (item: Notification) => {
    const isUrgent = item.title.toLowerCase().includes('urgent') || item.type === 'check_circle';
    
    const handlePress = () => {
      setNotifications(prev => 
        prev.map(n => n.id === item.id ? { ...n, isRead: true } : n)
      );
    };

    return (
      <Pressable 
        key={item.id}
        onPress={handlePress}
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

          {/* Location / Distance Row */}
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={COLORS.textSub} />
            <Text style={styles.distanceText}>{item.distance} away</Text>
          </View>
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
        </View>
        <Text style={styles.pageTitle}>Notifications</Text>
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
          notifications.map((item: Notification) => renderItem(item))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <OrgBottomNav activePage="alerts" />
    </SafeAreaView>
  );
}

// --- HELPER TIME FORMATTER ---
const formatTime = (date: Date) => {
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 0) return 'Just now'; 
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textMain, marginTop: 10 },
  
  listBody: { paddingHorizontal: 16, paddingTop: 20 },
  
  notiCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  unreadCard: { borderWidth: 1, borderColor: COLORS.primary + '30' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: 15 },
  notiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notiTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textMain, flex: 1 },
  timeText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  notiDesc: { fontSize: 13, color: COLORS.textSub, marginTop: 3, lineHeight: 18 },
  
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  distanceText: { fontSize: 12, color: COLORS.textSub, marginLeft: 4, fontWeight: '500' },

  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10, shadowColor: COLORS.primary, shadowOpacity: 0.6, shadowRadius: 5 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '600' }
});f8fafc', alignItems: 'center', justifyContent: 'center' },
  markAll: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
  pageTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textMain, marginTop: 10 },
  
  listBody: { paddingHorizontal: 16, paddingTop: 20 },
  
  notiCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 15, borderRadius: 16, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  unreadCard: { borderWidth: 1, borderColor: COLORS.primary + '30' },
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
