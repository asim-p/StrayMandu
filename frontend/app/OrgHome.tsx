import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

// --- COMPONENTS ---
import OrgBottomNav from '../src/components/OrgBottom'; 

// --- FIREBASE IMPORTS ---
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const { width } = Dimensions.get('window');
const DEFAULT_IMAGE = require('../img/default.png'); 

const COLORS = {
  primary: '#37ec13',
  primaryDark: '#2ab80e',
  backgroundLight: '#f6f8f6',
  surfaceDark: '#1a2c15', 
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#10B981',
};

export default function OrgHome() {
  const router = useRouter();
  
  // State
  const [orgName, setOrgName] = useState('StrayMandu HQ');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating HQ...');
  
  // Dashboard Data
  const [unassignedReports, setUnassignedReports] = useState<any[]>([]);
  const [activeCaseCount, setActiveCaseCount] = useState(0); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && mounted) {
        try {
          // --- FIXED LOGIC: CHECK BOTH COLLECTIONS ---
          
          // 1. First, try the 'organizations' collection
          let docRef = doc(db, "organizations", user.uid);
          let docSnap = await getDoc(docRef);

          // 2. If not found there, try 'users' collection
          if (!docSnap.exists()) {
            docRef = doc(db, "users", user.uid);
            docSnap = await getDoc(docRef);
          }

          // 3. Set the data if found
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Check multiple potential field names for the Organization Name
            setOrgName(data.organizationName || data.orgName || data.name || 'StrayMandu HQ');
            setProfilePhoto(data.photoURL || user.photoURL);
          }
        } catch (error) { 
          console.log("Error fetching org data:", error); 
        }
      }
    });

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          let address = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
          if (mounted && address.length > 0) {
            const area = address[0].district || address[0].street || address[0].city;
            const city = address[0].city || address[0].region;
            setCurrentAddress(`${area}, ${city}`);
          }
        }
      } catch (error) { if (mounted) setCurrentAddress('Kathmandu, Nepal'); }
    })();

    const fetchStats = async () => {
      try {
        const pendingQ = query(collection(db, "reports"), where("status", "==", "pending"), limit(10));
        const pendingSnap = await getDocs(pendingQ);
        const reports = pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const activeQ = query(collection(db, "reports"), where("status", "==", "in-progress"));
        const activeSnap = await getDocs(activeQ);

        if (mounted) {
          setUnassignedReports(reports);
          setActiveCaseCount(activeSnap.size); 
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { mounted = false; unsubscribeAuth(); };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.avatarContainer} onPress={() => router.push('/OrgProfile')}>
            <Image source={profilePhoto ? { uri: profilePhoto } : DEFAULT_IMAGE} style={styles.avatar} />
            <View style={styles.onlineBadge} />
          </Pressable>
          <View>
            <Text style={styles.headerSub}>Organization Portal</Text>
            <Text style={styles.headerTitle}>{orgName} 🏠</Text>
          </View>
        </View>
        <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')}>
          <MaterialIcons name="notifications-active" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Operations Center */}
        <View style={styles.sectionContainer}>
          <View style={styles.opsCard}>
            <View style={styles.opsHeader}>
              <View>
                <Text style={styles.opsLabel}>DAILY OVERVIEW</Text>
                <Text style={styles.opsTitle}>Operations Center</Text>
              </View>
              <View style={styles.systemBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.systemBadgeText}>System Live</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <MaterialIcons name="assignment-late" size={20} color={COLORS.warning} />
                  {unassignedReports.length > 0 && (
                    <Text style={styles.newTag}>+{unassignedReports.length} New</Text>
                  )}
                </View>
                <Text style={styles.statNumber}>{unassignedReports.length.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Unassigned</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <MaterialIcons name="medical-services" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.statNumber}>{activeCaseCount.toString().padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Active Cases</Text>
              </View>
            </View>

            <Pressable style={styles.reviewButton} onPress={() => router.push('/reports-queue')}>
              <MaterialIcons name="fact-check" size={18} color={COLORS.textMain} />
              <Text style={styles.reviewButtonText}>Review Pending Queue</Text>
            </Pressable>
          </View>
        </View>

        {/* Needing Review */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Needing Review <Text style={styles.urgentTag}>Urgent</Text></Text>
          <Pressable style={styles.viewAllBtn} onPress={() => router.push('/reports-queue')}>
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}>
            {unassignedReports.length === 0 ? (
                <View style={{ width: width - 40, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: COLORS.textSub }}>No pending reports.</Text>
                </View>
            ) : (
                unassignedReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                    <ImageBackground source={report.imageUrls ? { uri: report.imageUrls[0] } : DEFAULT_IMAGE} style={styles.cardImage}>
                    <View style={styles.criticalBadge}>
                        <Text style={styles.criticalText}>PENDING</Text>
                    </View>
                    </ImageBackground>
                    <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{report.breed || 'Injured Stray'}</Text>
                    <Text style={styles.cardLoc} numberOfLines={1}>
                        <MaterialIcons name="location-on" size={12} color={COLORS.textSub} /> {report.location?.address || 'Unknown Location'}
                    </Text>
                    <View style={styles.cardButtons}>
                        <Pressable style={styles.detailsBtn} onPress={() => router.push({ pathname: '/detailReports', params: { id: report.id } })}>
                        <Text style={styles.btnText}>Details</Text>
                        </Pressable>
                        <Pressable style={styles.assignBtn}><Text style={[styles.btnText, {color: COLORS.textMain}]}>Assign</Text></Pressable>
                    </View>
                    </View>
                </View>
                ))
            )}
          </ScrollView>
        )}

        {/* Active Map */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderNoPadding}>
            <Text style={styles.sectionTitle}>Active Operations</Text>
            <View style={styles.miniStatsRow}>
              <View style={styles.miniBadgeBlue}><Text style={styles.miniBadgeTextBlue}>{activeCaseCount} Active</Text></View>
              <View style={styles.miniBadgeGreen}><Text style={styles.miniBadgeTextGreen}>Live View</Text></View>
            </View>
          </View>
          <View style={styles.mapCard}>
            <ImageBackground 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4PPr0HJOQ0mohRvRnwIeMxt_bdSQyY5utrgFeKXqoz98Z561u3yO38iw__VxOgEgJYCX0WvG6aCKrMeNGf5EwVlkIvjFct3Iz9kLmdQ7aotwz4FOma3lZB07AX3E6nPC9owyBLHuJEdg1AAmWPyB3a7Byt3UiT_jCBVUwuteaJ-AtHoS3PMeDxu_vKP7ixzm6wAVE7Hydbq6JiB9Rtwrx9ic7hAh2gqsZoQM7MnKm8jftMUFKi-ECvbrcwIndQOlJQft5IPfWjmc' }} 
              style={styles.mapImage}
            >
              <View style={styles.mapOverlay} />
              
              {/* HQ Pin (Center Anchor) */}
              <View style={[styles.mapPinContainer, { top: '35%', left: '45%' }]}>
                  <View style={styles.mapPin}><MaterialCommunityIcons name="office-building" size={18} color="#121811" /></View>
              </View>

              {/* Ambulance 1 (Slightly Top-Right of HQ) */}
              <View style={[styles.mapPinContainer, { top: '28%', left: '55%' }]}>
                  <View style={[styles.mapPin, { backgroundColor: COLORS.white, borderColor: COLORS.primary }]}>
                    <MaterialCommunityIcons name="ambulance" size={16} color={COLORS.primary} />
                  </View>
              </View>

              {/* Ambulance 2 (Slightly Bottom-Left of HQ) */}
              <View style={[styles.mapPinContainer, { top: '42%', left: '38%' }]}>
                   <View style={[styles.mapPin, { backgroundColor: COLORS.white, borderColor: COLORS.warning }]}>
                    <MaterialCommunityIcons name="ambulance" size={16} color={COLORS.warning} />
                  </View>
              </View>

              {/* Info Overlay */}
              <View style={styles.mapInfoCard}>
                <View style={styles.mapInfoLeft}>
                  <View style={styles.locationIconBg}><MaterialIcons name="my-location" size={18} color={COLORS.primary} /></View>
                  <View>
                    <Text style={styles.mapInfoTitle}>Operational HQ</Text>
                    <Text style={styles.mapInfoSub}>{currentAddress}</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Live Coverage</Text></View>
              </View>
            </ImageBackground>
          </View>
        </View>

      </ScrollView>

      {/* --- INTEGRATED ORG BOTTOM NAV --- */}
      <OrgBottomNav activePage="overview" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: COLORS.primary },
  onlineBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
    backgroundColor: COLORS.primary, borderRadius: 6, borderWidth: 2, borderColor: COLORS.white,
  },
  headerSub: { fontSize: 10, fontWeight: '600', color: COLORS.textSub, textTransform: 'uppercase' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  iconButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionContainer: { paddingHorizontal: 16, marginTop: 16 },
  opsCard: { backgroundColor: COLORS.surfaceDark, borderRadius: 24, padding: 20, elevation: 10 },
  opsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  opsLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  opsTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  systemBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  systemBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newTag: { fontSize: 8, fontWeight: '800', color: '#fdba74', backgroundColor: 'rgba(251,146,60,0.2)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  statNumber: { color: COLORS.white, fontSize: 28, fontWeight: '800', marginVertical: 4 },
  statLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600' },
  reviewButton: {
    backgroundColor: COLORS.primary, height: 48, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  reviewButtonText: { fontWeight: '800', fontSize: 14, color: COLORS.textMain },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionHeaderNoPadding: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  urgentTag: { fontSize: 10, color: '#ef4444', backgroundColor: '#fee2e2', paddingHorizontal: 8, borderRadius: 10, overflow: 'hidden' },
  viewAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center' },
  reportCard: { width: 260, backgroundColor: COLORS.white, borderRadius: 16, marginRight: 16, borderWidth: 1, borderColor: '#eee', overflow: 'hidden', elevation: 2 },
  cardImage: { height: 140, width: '100%' },
  criticalBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  criticalText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  cardLoc: { fontSize: 12, color: COLORS.textSub, marginTop: 4 },
  cardButtons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  detailsBtn: { flex: 1, height: 36, backgroundColor: '#f3f4f6', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  assignBtn: { flex: 1, height: 36, backgroundColor: COLORS.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 12, fontWeight: '700' },
  miniStatsRow: { flexDirection: 'row', gap: 6 },
  miniBadgeBlue: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeTextBlue: { color: '#1d4ed8', fontSize: 10, fontWeight: '700' },
  miniBadgeGreen: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeTextGreen: { color: '#15803d', fontSize: 10, fontWeight: '700' },
  
  // --- MAP STYLES ---
  mapCard: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    height: 180, 
    marginTop: 4 
  },
  mapImage: { 
    flex: 1 
  },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  
  mapPinContainer: { position: 'absolute' }, 
  
  mapPin: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  mapInfoCard: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIconBg: { backgroundColor: 'rgba(55,236,19,0.2)', padding: 8, borderRadius: 20 },
  mapInfoTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMain },
  mapInfoSub: { fontSize: 10, color: '#6B7280', fontWeight: '600', maxWidth: 150 },
  activeBadge: { backgroundColor: 'rgba(55,236,19,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
});