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
import * as ImagePicker from 'expo-image-picker'; // Added Image Picker

// --- COMPONENTS ---
import OrgBottomNav from '../src/components/OrgBottom'; 

// --- SERVICES ---
import { uploadToCloudinary } from '../src/services/cloudinaryService'; // Added Cloudinary Service

// --- FIREBASE IMPORTS ---
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { onAuthStateChanged } from 'firebase/auth';

const { width } = Dimensions.get('window');

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
};

export default function OrgProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false); // UI State for upload
  const [orgData, setOrgData] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('organizations'); // Track where data came from

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && mounted) {
        try {
          // 1. Try 'organizations' collection first
          let docRef = doc(db, "organizations", user.uid);
          let docSnap = await getDoc(docRef);
          let foundCollection = "organizations";

          // 2. If not found, try 'users' collection
          if (!docSnap.exists()) {
            docRef = doc(db, "users", user.uid);
            docSnap = await getDoc(docRef);
            foundCollection = "users";
          }

          if (docSnap.exists()) {
            setOrgData(docSnap.data());
            setCollectionName(foundCollection);
          }
        } catch (error) {
          console.error("Error fetching org profile:", error);
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

  // --- IMAGE UPLOAD LOGIC ---
  const handleUpdateProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your gallery to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      uploadAndSaveImage(localUri);
    }
  };

  const uploadAndSaveImage = async (uri: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    setUploadingImage(true);
    try {
      // 1. Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(uri);
      
      // 2. Update Firestore (using the collection we found earlier)
      const orgRef = doc(db, collectionName, user.uid);
      await updateDoc(orgRef, {
        photoURL: cloudinaryUrl
      });

      // 3. Update Local State immediately
      setOrgData((prev: any) => ({ ...prev, photoURL: cloudinaryUrl }));
      
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to upload image. Please check your connection.");
    } finally {
      setUploadingImage(false);
    }
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
  const displayAddress = typeof orgData?.address === 'string' 
    ? orgData.address 
    : 'Kathmandu Valley, Nepal'; 
  
  const totalRescues = orgData?.totalRescues ?? 0;
  const monthlyRescues = orgData?.monthlyRescues ?? 0;
  const volunteerCount = orgData?.numberOfVolunteers ?? 0;
  
  // Logic: Show Spinner OR User Photo OR Default Photo
  const renderAvatar = () => {
    if (uploadingImage) {
      return (
        <View style={[styles.avatar, styles.loadingAvatar]}>
          <ActivityIndicator color={COLORS.primary} size="large" />
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
          <Pressable style={styles.iconButtonSmall}>
            <MaterialIcons name="share" size={20} color={COLORS.textMain} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Info */}
        <View style={styles.profileHero}>
          <View style={styles.avatarContainer}>
            {renderAvatar()}
            
            {/* Verified Badge (Top Right) */}
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={14} color={COLORS.white} />
            </View>

            {/* Camera Button (Bottom Right) */}
            <Pressable 
              style={styles.cameraBtn} 
              onPress={handleUpdateProfilePicture}
              disabled={uploadingImage}
            >
              <MaterialIcons name="photo-camera" size={16} color={COLORS.textMain} />
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

        {/* Lifetime Impact Card */}
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
              <Text style={styles.impactFooterText}>Consistent growth since 2024</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Rescues Card (Monthly) */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.blue} />
              </View>
              <Text style={styles.percentageBadge}>+12%</Text>
            </View>
            <View>
              <Text style={styles.statBigNumber}>{monthlyRescues}</Text>
              <Text style={styles.statLabel}>Rescues This Month</Text>
            </View>
          </View>

          {/* Pending Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#fff7ed' }]}>
                <MaterialIcons name="assignment-late" size={20} color={COLORS.orange} />
              </View>
              <View style={styles.pulseContainer}>
                <View style={styles.pulseDot} />
              </View>
            </View>
            <View>
              <Text style={styles.statBigNumber}>5</Text> 
              <Text style={styles.statLabel}>Pending Reports</Text>
            </View>
          </View>

          {/* Active Ops Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#f5f3ff' }]}>
                <MaterialCommunityIcons name="ambulance" size={20} color={COLORS.purple} />
              </View>
              <Text style={[styles.percentageBadge, { color: COLORS.purple, backgroundColor: '#f5f3ff' }]}>Live</Text>
            </View>
            <View>
              <Text style={styles.statBigNumber}>2</Text>
              <Text style={styles.statLabel}>Active Operations</Text>
            </View>
          </View>

          {/* Volunteers Card */}
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBox, { backgroundColor: '#f0fdfa' }]}>
                <MaterialIcons name="group" size={20} color={COLORS.teal} />
              </View>
            </View>
            <View>
              <Text style={styles.statBigNumber}>{volunteerCount}</Text>
              <Text style={styles.statLabel}>Volunteers Online</Text>
            </View>
          </View>
        </View>

        {/* Recent Rescues Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Rescues</Text>
          <Pressable style={styles.viewAllBtn} onPress={() => router.push('/myReport')}>
            <Text style={styles.viewAllText}>View Gallery</Text>
            <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
          </Pressable>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
        >
          <View style={styles.rescueCard}>
            <ImageBackground 
              source={{ uri: 'https://picsum.photos/seed/rescue1/400/250' }} 
              style={styles.rescueImg}
            >
              <View style={styles.rescueOverlay}>
                <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statusText}>Adopted</Text>
                </View>
                <Text style={styles.rescueTitle}>Litter of 3 found a home in Pokhara</Text>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.rescueCard}>
            <ImageBackground 
              source={{ uri: 'https://picsum.photos/seed/rescue2/400/250' }} 
              style={styles.rescueImg}
            >
              <View style={styles.rescueOverlay}>
                <View style={[styles.statusBadge, { backgroundColor: COLORS.blue }]}>
                  <Text style={styles.statusText}>Recovered</Text>
                </View>
                <Text style={styles.rescueTitle}>Kalu fully recovered from leg surgery</Text>
              </View>
            </ImageBackground>
          </View>
        </ScrollView>
      </ScrollView>

      {/* UPDATED: Using Organization Bottom Nav */}
      <OrgBottomNav activePage="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconButtonSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundLight, justifyContent: 'center', alignItems: 'center' },
  
  profileHero: { alignItems: 'center', paddingVertical: 24 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: COLORS.white },
  loadingAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' },
  
  // Badge Styles
  verifiedBadge: { 
    position: 'absolute', 
    top: 0, 
    right: 0, 
    backgroundColor: '#3b82f6', 
    borderRadius: 12, 
    padding: 4, 
    borderWidth: 2, 
    borderColor: COLORS.white 
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    elevation: 3,
  },

  orgName: { fontSize: 24, fontWeight: '900', color: COLORS.textMain, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locationText: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
  ngoTag: { backgroundColor: '#dbeafe', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  ngoTagText: { fontSize: 10, fontWeight: '800', color: '#1d4ed8' },

  impactSection: { paddingHorizontal: 16, marginBottom: 16 },
  impactCard: { 
    backgroundColor: COLORS.surfaceDark, 
    borderRadius: 24, padding: 24, 
    alignItems: 'center',
    overflow: 'hidden',
  },
  impactIconBg: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 24, marginBottom: 12 },
  impactLabel: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  impactNumber: { color: COLORS.white, fontSize: 48, fontWeight: '900', marginBottom: 4 },
  impactSubtext: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  impactFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  impactFooterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, marginBottom: 16 },
  statCard: { 
    backgroundColor: COLORS.white, 
    width: (width - 44) / 2, 
    height: 140, 
    margin: 6, 
    borderRadius: 20, 
    padding: 16, 
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statIconBox: { padding: 8, borderRadius: 12 },
  percentageBadge: { fontSize: 10, fontWeight: '800', color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pulseContainer: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.orange },
  statBigNumber: { fontSize: 28, fontWeight: '900', color: COLORS.textMain },
  statLabel: { fontSize: 12, color: COLORS.textSub, fontWeight: '600', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  
  rescueCard: { width: 280, height: 160, borderRadius: 20, marginRight: 16, overflow: 'hidden' },
  rescueImg: { flex: 1, justifyContent: 'flex-end' },
  rescueOverlay: { padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginBottom: 4 },
  statusText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  rescueTitle: { color: COLORS.white, fontSize: 14, fontWeight: '700', lineHeight: 18 },
});