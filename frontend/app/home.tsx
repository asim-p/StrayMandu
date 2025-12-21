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
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import BottomNav from '../src/components/BottomNav'; 

// --- FIREBASE IMPORTS ---
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DEFAULT_IMAGE = require('../img/default.png'); 

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#10B981',
  neutral: '#6B7280',
  white: '#FFFFFF',
};

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating...');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // --- NEW STATE FOR REPORTS ---
  const [latestReports, setLatestReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  // Helper to get badge color based on condition
  const getConditionColor = (condition: string) => {
  switch (condition) {
    case 'Cruelty':   // Added case
    case 'Injured':
    case 'Aggressive':
      return COLORS.danger;
    case 'Healthy':
      return COLORS.success;
    case 'Neutral':
    case 'Unknown':
    default:
      return COLORS.warning;
  }
};

  useEffect(() => {
    let mounted = true;

    // 1. FETCH USER & PHOTO
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && mounted) {
        setUserName(user.displayName || user.email?.split('@')[0] || 'Hero');
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.photoURL) setProfilePhoto(data.photoURL);
            else setProfilePhoto(user.photoURL);
            if (data.name) setUserName(data.name);
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
        }
      }
    });

    // 2. LOCATION LOGIC
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (mounted) setCurrentAddress('Permission Denied');
          return;
        }
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
      } catch (error) {
        if (mounted) setCurrentAddress('Kathmandu, Nepal');
      }
    })();

    // 3. FETCH LATEST REPORTS FROM FIRESTORE
    const fetchReports = async () => {
      try {
        // Query: Collection 'reports', order by 'createdAt' desc, limit 5
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(5));
        const querySnapshot = await getDocs(q);
        
        const reportsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (mounted) {
          setLatestReports(reportsData);
          setLoadingReports(false);
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        if (mounted) setLoadingReports(false);
      }
    };

    fetchReports();

    return () => { 
      mounted = false; 
      unsubscribeAuth();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.avatarContainer} 
            onPress={() => router.push('/profile')} 
          >
            <Image
              source={profilePhoto ? { uri: profilePhoto } : DEFAULT_IMAGE}
              style={styles.avatar}
            />
            <View style={styles.onlineBadge} />
          </Pressable>
          
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              Namaste, {userName} 👋
            </Text>
          </View>
        </View>
        
        <Pressable 
          style={styles.iconButton}
          onPress={() => router.push('/userNotification')}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>


      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section (Unchanged) */}
        <View style={styles.sectionContainer}>
          <Pressable 
            style={({pressed}) => [styles.heroCard, pressed && { transform: [{scale: 0.98}] }]}
            onPress={() => router.push('/report')}
          >
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1Gwv6_qqbnjnZUsTmZPvFkciN2qagV_g_9PpGNkXbGpwdV3l4uVj8h1CLeykwqUThk_VQKp9bjSARfseXKBkit0ByZnrVZBQh3nBXfm0_AQYLgwgkMmyw1htCweqx-HmwCD4jqxriMkmnBPu-_jeccC2CMeMxEGu_Sb2Hxe1id3dnYDxHQcivVC1qAxENGqlbj7YAgWkIwMZciaVEChbQ9XkL_a7gqSHg-7qcwCCEG5SvY-PGxUVcmSKbQPlhTTlotxoMvfNjPrY' }}
              style={styles.heroImage}
            >
              <View style={styles.heroOverlay}>
                <View style={styles.heroContent}>
                  <View style={styles.emergencyBadge}>
                    <MaterialIcons name="home" size={14} color="#FFF" />
                    <Text style={styles.emergencyText}>Emergency Report</Text>
                  </View>
                  <Text style={styles.heroTitle}>Spot a stray in need?</Text>
                  <Text style={styles.heroSubtitle}>Help us keep the streets safe. Report location and condition instantly.</Text>
                  <Pressable style={styles.heroButton} onPress={() => router.push('/report')}>
                    <MaterialIcons name="add-a-photo" size={20} color="#121811" />
                    <Text style={styles.heroButtonText}>Report Now</Text>
                  </Pressable>
                </View>
              </View>
            </ImageBackground>
          </Pressable>
        </View>

        {/* Nearby Reports (Unchanged Images) */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Reports</Text>
            <Pressable onPress={() => router.push('/map')} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={16} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={styles.mapCard}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4PPr0HJOQ0mohRvRnwIeMxt_bdSQyY5utrgFeKXqoz98Z561u3yO38iw__VxOgEgJYCX0WvG6aCKrMeNGf5EwVlkIvjFct3Iz9kLmdQ7aotwz4FOma3lZB07AX3E6nPC9owyBLHuJEdg1AAmWPyB3a7Byt3UiT_jCBVUwuteaJ-AtHoS3PMeDxu_vKP7ixzm6wAVE7Hydbq6JiB9Rtwrx9ic7hAh2gqsZoQM7MnKm8jftMUFKi-ECvbrcwIndQOlJQft5IPfWjmc' }}
              style={styles.mapImage}
            >
              <View style={styles.mapOverlay} />
              <View style={styles.mapPinContainer}>
                <View style={styles.mapPin}>
                  <MaterialIcons name="pets" size={14} color="#121811" />
                </View>
              </View>
              <View style={styles.mapInfoCard}>
                <View style={styles.mapInfoLeft}>
                  <View style={styles.locationIconBg}>
                    <MaterialIcons name="my-location" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.mapInfoTitle}>Current Location</Text>
                    <Text style={styles.mapInfoSub}>{ 'New Baneshwor, Kathmandu'}</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{latestReports.length} Active</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Latest Reports (DYNAMIC FROM DB) */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Latest Reports</Text>
          
          {loadingReports ? (
             <ActivityIndicator size="small" color={COLORS.primary} />
          ) : latestReports.length === 0 ? (
             <Text style={{color: COLORS.textSub}}>No reports found.</Text>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              snapToInterval={256} 
              decelerationRate="fast"
            >
              {latestReports.map((report) => (
                <Pressable 
                  key={report.id}
                  style={styles.listCard}
                  // Redirect to detail page with the ID
                  onPress={() => router.push({ pathname: '/detailReports', params: { id: report.id } })}
                >
                  <ImageBackground
                    // Use first image from DB or fallback
                    source={
                      report.imageUrls && report.imageUrls.length > 0 
                      ? { uri: report.imageUrls[0] } 
                      : DEFAULT_IMAGE
                    }
                    style={styles.listCardImage}
                  >
                    {/* Dynamic Badge based on Condition */}
                    <Text style={[
                      styles.cardBadge, 
                      { backgroundColor: getConditionColor(report.condition) }
                    ]}>
                      {report.condition || 'Unknown'}
                    </Text>
                  </ImageBackground>
                  
                  <View style={styles.listCardContent}>
                    {/* Name or Breed */}
                    <Text style={styles.listCardTitle} numberOfLines={1}>
                      {report.name ? report.name : report.breed}
                    </Text>
                    
                    {/* Description */}
                    <Text numberOfLines={2} style={styles.listCardDesc}>
                      {report.description || "No description provided."}
                    </Text>
                    
                    {/* Tap to View Details (Visual Cue) */}
                    <View style={styles.tapToView}>
                       <Text style={styles.tapToViewText}>Tap to view details</Text>
                       <MaterialIcons name="arrow-forward" size={12} color={COLORS.primary} />
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* REUSABLE COMPONENT */}
      <BottomNav activePage="home" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#e5e7eb',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  greetingText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    color: COLORS.textMain,
    fontWeight: '700',
    lineHeight: 22,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  heroCard: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    gap: 4,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
    gap: 4,
  },
  emergencyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 16,
  },
  heroButton: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121811',
  },
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 180,
  },
  mapImage: {
    flex: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  mapPinContainer: {
    position: 'absolute',
    top: '30%',
    left: '25%',
  },
  mapPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  mapInfoCard: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  mapInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIconBg: {
    backgroundColor: 'rgba(55,236,19,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  mapInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  mapInfoSub: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: 'rgba(55,236,19,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  // --- UPDATED LIST CARD STYLES ---
  listCard: {
    width: 240,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
    height: 230, // Fixed height to align
  },
  listCardImage: {
    height: 128,
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  listCardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between'
  },
  listCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  listCardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
    height: 32, // limit to 2 lines approximately
  },
  tapToView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tapToViewText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
});