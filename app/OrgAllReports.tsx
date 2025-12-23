import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, View, Text, ScrollView, ImageBackground,
  Pressable, StyleSheet, StatusBar, Image, Modal, TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

// --- FIREBASE ---
import { db } from '../src/config/firebase'; 
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import OrgBottom from '../src/components/OrgBottom';

const DESIGN = {
  primary: '#37ec13',
  bgLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#688961',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
};

// --- HELPER: DYNAMIC TIME ---
const getTimeAgo = (seconds: number) => {
  if (!seconds) return '...';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// --- HELPER: STATUS COLORS ---
const getStatusColors = (status: string) => {
  const normalized = status ? status.toLowerCase() : 'pending';
  switch (normalized) {
    case 'resolved': return { bg: '#dcfce7', text: '#15803d' }; // Green
    case 'ongoing': return { bg: '#dbeafe', text: '#1d4ed8' }; // Blue
    case 'acknowledged': return { bg: '#f3e8ff', text: '#7e22ce' }; // Purple
    case 'pending':
    default: return { bg: '#f3f4f6', text: '#4b5563' }; // Gray
  }
};

// --- HELPER: CONDITION COLORS (NEW) ---
const getConditionColors = (condition: string) => {
  const normalized = condition ? condition.toLowerCase() : 'unknown';
  switch (normalized) {
    case 'critical':
      return { bg: '#fee2e2', text: '#ef4444' }; // Red
    case 'injured':
      return { bg: '#fff7ed', text: '#c2410c' }; // Deep Orange
    case 'aggressive':
      return { bg: '#fae8ff', text: '#86198f' }; // Purple/Violet
    case 'healthy':
      return { bg: '#ecfccb', text: '#4d7c0f' }; // Light Green
    case 'neutral':
    default:
      return { bg: '#f3f4f6', text: '#4b5563' }; // Gray
  }
};

export default function OrgHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [nearby, setNearby] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  
  // --- FILTER & SORT STATES ---
  const [sortBy, setSortBy] = useState('Date'); 
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applySorting();
  }, [sortBy, allReports]);

  const fetchReports = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      let userLoc = status === 'granted' ? await Location.getCurrentPositionAsync({}) : null;

      // UPDATED QUERY: Fetch all reports, sorted by newest first
      const q = query(
        collection(db, "reports"), 
        orderBy("createdAt", "desc"), 
        limit(50)
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => {
        const reportData = doc.data();
        let dist = 0;
        if (userLoc && reportData.location) {
          dist = calculateDistance(
            userLoc.coords.latitude, userLoc.coords.longitude,
            reportData.location.latitude, reportData.location.longitude
          );
        }
        return { id: doc.id, ...reportData, dist };
      });

      setAllReports(data);
      // For nearby, we still calculate distance on the client side
      const nearestList = [...data].sort((a, b) => a.dist - b.dist).slice(0, 5);
      setNearby(nearestList);
      setLoading(false);
    } catch (e) { 
      console.error(e); 
      setLoading(false); 
    }
  };

  const applySorting = () => {
    let sorted = [...allReports];
    if (sortBy === 'Date') {
      sorted.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } else if (sortBy === 'Distance') {
      sorted.sort((a, b) => a.dist - b.dist);
    } else if (sortBy === 'Urgency') {
      // Prioritize Critical, then Injured, then others
      const order: any = { 'Critical': 0, 'Injured': 1, 'Aggressive': 2, 'Healthy': 3, 'Neutral': 4 };
      sorted.sort((a, b) => (order[a.condition] ?? 5) - (order[b.condition] ?? 5));
    }
    setRecent(sorted);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- STICKY HEADER --- */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={DESIGN.textMain} />
          </Pressable>
          <Text style={styles.headerTitle}>All Reports</Text>
          <Pressable onPress={() => router.push('/OrgMap')} style={styles.iconBtn}>
            <MaterialIcons name="map" size={24} color={DESIGN.textMain} />
          </Pressable>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchWrapper}>
            <MaterialIcons name="search" size={20} color={DESIGN.textSub} style={{ marginLeft: 12 }} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search ID, Location or Condition"
              placeholderTextColor={DESIGN.textSub}
            />
            <Pressable onPress={() => setShowFilterModal(true)}>
                <MaterialIcons name="tune" size={20} color={DESIGN.textSub} style={{ marginRight: 12 }} />
            </Pressable>
          </View>
        </View>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* --- NEAREST SECTION --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleWithIcon}>
                <MaterialIcons name="near-me" size={18} color={DESIGN.primary} />
                <Text style={styles.sectionTitle}>Nearest to You</Text>
            </View>
            <Pressable style={styles.radiusButton}>
              <Text style={styles.radiusText}>2km Radius</Text>
              <MaterialIcons name="keyboard-arrow-down" size={14} color={DESIGN.primary} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
            {nearby.map(item => (
               <Pressable key={item.id} style={styles.nearCard} onPress={() => router.push({ pathname: '/OrgDetailViews', params: { id: item.id } })}>
                 <ImageBackground source={{ uri: item.imageUrls?.[0] }} style={styles.nearImg} imageStyle={{ borderRadius: 16 }}>
                   <View style={styles.nearOverlay}>
                     <Text style={styles.nearDistText}>{item.dist.toFixed(1)} km</Text>
                   </View>
                 </ImageBackground>
                 <Text style={styles.nearTitle} numberOfLines={1}>#{item.id.slice(-4)} {item.breed}</Text>
               </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* --- RECENT REPORTS LIST --- */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 16 }]}>
            <Text style={styles.sectionTitle}>All Reports</Text>
            
            <Pressable style={styles.sortBtn} onPress={() => setShowFilterModal(true)}>
              <Text style={styles.sortText}>Sort by: {sortBy}</Text>
              <MaterialIcons name="expand-more" size={16} color={DESIGN.textSub} />
            </Pressable>
          </View>

          <View style={styles.listContainer}>
            {recent.map(item => {
              // 1. Get COLORS
              const statusColor = getStatusColors(item.status);
              const conditionColor = getConditionColors(item.condition);
              
              return (
                <Pressable key={item.id} style={styles.recentRow} onPress={() => router.push({ pathname: '/OrgDetailViews', params: { id: item.id } })}>
                  <Image source={{ uri: item.imageUrls?.[0] }} style={styles.rowImg} />
                  <View style={styles.rowContent}>
                    
                    {/* Header Row: ID, Badges, Time */}
                    <View style={styles.rowHeader}>
                      <View style={styles.rowTitleArea}>
                          <Text style={styles.rowId}>#{item.id.slice(-4)}</Text>
                          
                          {/* UPDATED: Condition Badge using helper */}
                          <View style={[styles.rowBadge, { backgroundColor: conditionColor.bg }]}>
                              <Text style={[styles.rowBadgeText, { color: conditionColor.text }]}>
                                {item.condition}
                              </Text>
                          </View>

                          {/* Status Badge */}
                          <View style={[styles.rowBadge, { backgroundColor: statusColor.bg }]}>
                              <Text style={[styles.rowBadgeText, { color: statusColor.text, textTransform: 'uppercase' }]}>
                                {item.status || 'PENDING'}
                              </Text>
                          </View>
                      </View>
                      <Text style={styles.rowTime}>{getTimeAgo(item.createdAt?.seconds)}</Text>
                    </View>

                    <Text style={styles.rowTitle} numberOfLines={1}>{item.breed || 'Reported Dog'}</Text>
                    
                    <View style={styles.rowFooter}>
                      <Text style={styles.rowLocText} numberOfLines={1}>{item.location?.address}</Text>
                      <View style={styles.rowActionBtn}><MaterialIcons name="arrow-forward" size={14} color="black" /></View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* --- FILTER MODAL --- */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort Reports By</Text>
            {['Date', 'Distance', 'Urgency'].map((option) => (
              <Pressable 
                key={option} 
                style={styles.optionBtn}
                onPress={() => { setSortBy(option); setShowFilterModal(false); }}
              >
                <Text style={[styles.optionText, sortBy === option && styles.activeOptionText]}>{option}</Text>
                {sortBy === option && <MaterialIcons name="check" size={18} color={DESIGN.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <OrgBottom activePage="reports" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.bgLight },
  
  // Header
  header: { backgroundColor: DESIGN.bgLight, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: DESIGN.textMain },
  iconBtn: { padding: 8 },
  
  // Search
  searchSection: { paddingHorizontal: 16, paddingBottom: 12 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, height: 46, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: DESIGN.textMain, paddingHorizontal: 10 },

  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: DESIGN.textMain },
  
  // Radius Button
  radiusButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#37ec1315', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 16, gap: 2 },
  radiusText: { color: DESIGN.primary, fontSize: 11, fontWeight: '800' },
  
  // Sort Button
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 16 },
  sortText: { fontSize: 12, color: DESIGN.textSub, fontWeight: '700' },

  // List Items
  listContainer: { paddingHorizontal: 16, gap: 12 },
  recentRow: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 24, elevation: 1 },
  rowImg: { width: 75, height: 75, borderRadius: 16 },
  rowContent: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  
  // UPDATED ROW HEADER for multiple badges
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitleArea: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexWrap: 'wrap' },
  
  rowId: { fontSize: 12, fontWeight: '800', marginRight: 2 },
  rowBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  rowBadgeText: { fontSize: 9, fontWeight: '800' },
  
  rowTime: { fontSize: 10, color: DESIGN.textSub, marginLeft: 4 },
  rowTitle: { fontSize: 15, fontWeight: '700', marginVertical: 4 },
  
  rowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLocText: { fontSize: 11, color: DESIGN.textSub, flex: 1 },
  rowActionBtn: { backgroundColor: DESIGN.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
  optionBtn: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionText: { fontSize: 16, fontWeight: '600', color: DESIGN.textMain },
  activeOptionText: { color: DESIGN.primary },

  nearCard: { width: 125, marginRight: 12 },
  nearImg: { width: 125, height: 125 },
  nearOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end', padding: 8, borderRadius: 16 },
  nearDistText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  nearTitle: { marginTop: 6, fontSize: 13, fontWeight: '700' }
});