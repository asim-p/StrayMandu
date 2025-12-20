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
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location'; // <--- Added Location

// --- COMPONENTS ---
import OrgBottomNav from '../src/components/OrgBottom'; 

// --- SERVICES ---
import { authService } from '../src/services/authService';
import { uploadToCloudinary } from '../src/services/cloudinaryService'; 

// --- FIREBASE IMPORTS ---
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';

const { width } = Dimensions.get('window');
const DEFAULT_IMAGE = require('../img/default.png'); 

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceDark: '#1a2c15',
  surfaceDarkElevated: '#23381e',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  blue: '#2563eb',
  orange: '#f97316',
  purple: '#a855f7',
  teal: '#0d9488',
  red: '#ef4444', 
  cardBorder: '#F3F4F6'
};

export default function OrgProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Profile Data
  const [orgData, setOrgData] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('organizations');

  // Rescues Data
  const [resolvedRescues, setResolvedRescues] = useState<any[]>([]); // <--- New State

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && mounted) {
        try {
          // 1. Fetch Profile Data
          let docRef = doc(db, "organizations", user.uid);
          let docSnap = await getDoc(docRef);
          let foundCollection = "organizations";

          if (!docSnap.exists()) {
            docRef = doc(db, "users", user.uid);
            docSnap = await getDoc(docRef);
            foundCollection = "users";
          }

          if (docSnap.exists()) {
            setOrgData(docSnap.data());
            setCollectionName(foundCollection);
          }

          // 2. Fetch Resolved Rescues
          // Note: Adjust "Resolved" to match exactly how you save it in DB (e.g. "Resolved", "resolved", "Adopted")
          const q = query(
            collection(db, "reports"), 
            where("status", "in", ["Resolved", "resolved", "Adopted"]), 
            limit(5)
          );
          const querySnap = await getDocs(q);
          const rescues = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          if (mounted) {
            setResolvedRescues(rescues);
          }

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleUpdateProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required to change photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadAndSaveImage(result.assets[0].uri);
    }
  };

  const uploadAndSaveImage = async (uri: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    setUploadingImage(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(uri);
      const orgRef = doc(db, collectionName, user.uid);
      await updateDoc(orgRef, { photoURL: cloudinaryUrl });
      setOrgData((prev: any) => ({ ...prev, photoURL: cloudinaryUrl }));
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Logout", 
        style: "destructive", 
        onPress: async () => {
          await authService.logout();
          router.replace('/login');
        } 
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // --- SAFE DATA MAPPING ---
  const displayName = orgData?.organizationName || orgData?.name || 'Organization Name';
  const displayAddress = (typeof orgData?.address === 'string' && orgData.address) 
    ? orgData.address 
    : 'Location not provided'; 
  
  const totalRescues = orgData?.totalRescues ?? 0;
  const monthlyRescues = orgData?.monthlyRescues ?? 0;
  const volunteerCount = orgData?.numberOfVolunteers ?? 0;
  const pendingReports = orgData?.pendingReports ?? 0;
  const activeOps = orgData?.activeOperations ?? 0;

  const renderAvatar = () => {
    if (uploadingImage) {
      return (
        <View style={[styles.avatar, styles.loadingAvatar]}>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      );
    }
    return (
      <Image
        source={orgData?.photoURL ? { uri: orgData.photoURL } : require('../img/default.png')}
        style={styles.avatar}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
          </Pressable>
          <Text style={styles.headerTitle}>Profile Overview</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButtonSmall} onPress={() => router.push('/edit-profile')}>
            <MaterialIcons name="edit" size={20} color={COLORS.textMain} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            {renderAvatar()}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color={COLORS.white} />
            </View>
            <Pressable style={styles.cameraBtn} onPress={handleUpdateProfilePicture} disabled={uploadingImage}>
              <MaterialIcons name="photo-camera" size={16} color={COLORS.white} />
            </Pressable>
          </View>
          <Text style={styles.orgName}>{displayName}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={COLORS.textSub} />
            <Text style={styles.locationText}>{displayAddress}</Text>
          </View>
          <View style={styles.ngoTag}>
            <Text style={styles.ngoTagText}>NGO VERIFIED</Text>
          </View>
        </View>

        {/* Impact Section */}
        <View style={styles.impactSection}>
          <View style={styles.impactCard}>
            <View style={styles.impactIconBg}>
              <MaterialCommunityIcons name="paw" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.impactLabel}>LIFETIME IMPACT</Text>
            <Text style={styles.impactNumber}>{totalRescues.toLocaleString()}</Text>
            <Text style={styles.impactSubtext}>Total Rescues (All-Time)</Text>
            <View style={styles.divider} />
            <View style={styles.impactFooter}>
              <MaterialIcons name="trending-up" size={16} color={COLORS.primary} />
              <Text style={styles.impactFooterText}>Consistent growth in 2025</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Monthly Rescues', val: monthlyRescues, icon: 'calendar-today', col: COLORS.blue, bg: '#eff6ff' },
            { label: 'Pending Reports', val: pendingReports, icon: 'assignment-late', col: COLORS.orange, bg: '#fff7ed' },
            { label: 'Active Ops', val: activeOps, icon: 'ambulance', col: COLORS.purple, bg: '#f5f3ff', isMCI: true },
            { label: 'Team Members', val: volunteerCount, icon: 'group', col: COLORS.teal, bg: '#f0fdfa' }
          ].map((item, idx) => (
            <View key={idx} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: item.bg }]}>
                {item.isMCI ? 
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.col} /> :
                  <MaterialIcons name={item.icon as any} size={20} color={item.col} />
                }
              </View>
              <View>
                <Text style={styles.statBigNumber}>{item.val}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Rescues Section (RESOLVED) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Victories</Text>
          <Pressable style={styles.viewAllBtn} onPress={() => router.push('/myReport')}>
            <Text style={styles.viewAllText}>View Gallery</Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {resolvedRescues.length === 0 ? (
             <View style={{ width: width - 40, height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 20 }}>
                <Text style={{ color: COLORS.textSub }}>No recent resolved cases.</Text>
             </View>
          ) : (
            resolvedRescues.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                  <ImageBackground source={report.imageUrls ? { uri: report.imageUrls[0] } : DEFAULT_IMAGE} style={styles.cardImage}>
                    <View style={styles.resolvedBadge}>
                       <MaterialIcons name="check-circle" size={10} color={COLORS.white} style={{marginRight:4}} />
                       <Text style={styles.criticalText}>RESOLVED</Text>
                    </View>
                  </ImageBackground>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{report.breed || 'Rescued Dog'}</Text>
                    
                    {/* DYNAMIC LOCATION CALCULATION */}
                    <View style={styles.locationRowSmall}>
                      <MaterialIcons name="location-on" size={12} color={COLORS.textSub} />
                      <LocationAddress location={report.location} />
                    </View>
                    
                    <View style={styles.cardButtons}>
                        <Pressable 
                          style={styles.actionBtn}
                          onPress={() => router.push({ pathname: '/OrgDetailViews', params: { id: report.id } })}
                        >
                          <Text style={styles.actionBtnText}>View Details</Text>
                          <MaterialIcons name="arrow-forward" size={14} color={COLORS.textMain} />
                        </Pressable>
                    </View>
                  </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Logout Button */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

      </ScrollView>

      <OrgBottomNav activePage="profile" />
    </SafeAreaView>
  );
}

// --- HELPER COMPONENT FOR ADDRESS ---
const LocationAddress = ({ location }: { location: any }) => {
  const [displayAddress, setDisplayAddress] = React.useState(
    location?.address || "Locating..."
  );

  React.useEffect(() => {
    if (location?.address) return;

    const fetchAddress = async () => {
      try {
        if (location?.latitude && location?.longitude) {
          const result = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
          });

          if (result.length > 0) {
            const place = result[0];
            const street = place.street || place.name || '';
            const city = place.city || place.subregion || '';
            const formatted = [street, city].filter(Boolean).join(', ');
            setDisplayAddress(formatted);
          } else {
            setDisplayAddress("Unknown Location");
          }
        }
      } catch (error) {
        setDisplayAddress(`${location?.latitude.toFixed(2)}, ${location?.longitude.toFixed(2)}`);
      }
    };

    fetchAddress();
  }, [location]);

  return (
    <Text style={styles.locationTextSmall} numberOfLines={1}>
      {displayAddress}
    </Text>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.white },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, justifyContent: 'center' },
  iconButtonSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundLight, justifyContent: 'center', alignItems: 'center' },
  
  // Profile Hero
  profileHero: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.white },
  loadingAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' },
  verifiedBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#3b82f6', borderRadius: 12, padding: 4, borderWidth: 2, borderColor: COLORS.white },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: COLORS.white },
  orgName: { fontSize: 22, fontWeight: '900', color: COLORS.textMain, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 14, color: COLORS.textSub },
  ngoTag: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  ngoTagText: { fontSize: 10, fontWeight: '800', color: '#1d4ed8' },
  
  // Impact
  impactSection: { paddingHorizontal: 16, marginBottom: 16 },
  impactCard: { backgroundColor: COLORS.surfaceDark, borderRadius: 24, padding: 24, alignItems: 'center' },
  impactIconBg: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 24, marginBottom: 12 },
  impactLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  impactNumber: { color: COLORS.white, fontSize: 42, fontWeight: '900' },
  impactSubtext: { color: '#cbd5e1', fontSize: 14 },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  impactFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  impactFooterText: { color: '#94a3b8', fontSize: 12 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginBottom: 10 },
  statCard: { backgroundColor: COLORS.white, width: (width - 44) / 2, margin: 6, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  statIconBox: { padding: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
  statBigNumber: { fontSize: 24, fontWeight: '900', color: COLORS.textMain },
  statLabel: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  
  // Recent Rescues (UPDATED)
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  horizontalScroll: { paddingLeft: 16, paddingRight: 8, marginBottom: 20 },
  
  reportCard: { width: 200, backgroundColor: COLORS.white, borderRadius: 16, marginRight: 12, borderWidth: 1, borderColor: COLORS.cardBorder, overflow: 'hidden' },
  cardImage: { height: 120, width: '100%', justifyContent: 'flex-start', alignItems: 'flex-end', padding: 8 },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  criticalText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textMain, marginBottom: 4 },
  locationRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationTextSmall: { fontSize: 11, color: COLORS.textSub, flex: 1 },
  
  cardButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', height: 32, backgroundColor: COLORS.backgroundLight, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.textMain },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 15, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: COLORS.red, fontWeight: '800', marginLeft: 8 }
});