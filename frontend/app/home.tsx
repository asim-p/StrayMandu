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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import BottomNav from '../src/components/BottomNav'; // Import the component

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  danger: '#EF4444',
  warning: '#F97316',
};

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating...');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          const name = parsed?.name || parsed?.email || null;
          if (mounted && name) setUserName(name);
        }
      } catch (err) {
        console.warn('Failed to load user', err);
      }
    })();

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

    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <ImageBackground
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwA8mbDnpc4KGlAtsEnWM9zeee9JKlQ1ylxt1kPXqscY8dWoaP0qHZgkyGvSmYk87fyHvLtzzrrtDitM-sJnKTRF_ClRnEiSxZxybQfvw2g5pSlBd7AIGApG2e-BKZ7DaxLSGCCFQsaz-xVEKQJmuPZxt-jfOSQeQtG38JEvDY4RjyPkppiCzuFcnuBJAzde7btSw7Zv5onQnDRYGxxq0b8w8lr9Rt6JWfY97wsHfLfMiPzXU64EyZzO2Q4nvRsSDcfpdog7jiZ-M' }}
              style={styles.avatar}
              imageStyle={{ borderRadius: 20 }}
            />
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.userName}>Namaste, {userName ?? 'User'} 👋</Text>
          </View>
        </View>
        <Pressable 
          style={styles.iconButton}
          onPress={() => router.push('/')}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
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

        {/* Nearby Reports */}
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
                    <Text style={styles.mapInfoSub}>{currentAddress}</Text>
                  </View>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>3 Active</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Latest Reports */}
        <View style={[styles.sectionContainer, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Latest Reports</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            snapToInterval={256} 
            decelerationRate="fast"
          >
            <View style={styles.listCard}>
              <ImageBackground
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxRrAnJIsX4tTfrUcmxU2SE83waosz5-br8RCf62lCSnPj-M5EFgHOTqJ5l3P4StqBaJiMq9DLxD1x97L85DDQn6Q-UoJCanCWV_cZxz6IC_1WQ0jxOJewBaK46daFbF5V0DtrnxUvhZpbbPjlX2D40OLRc_gcpn2ar_TEruP8zXGGvwWslqxojBB7Tss9LWqZ6FaDABZ8VAQ2rNgPSXWWDlrUOGBdkbwfwsTgW0LeN_7ieyYGJL58QWr9iboOeOrim0x2b8IE7v4' }}
                style={styles.listCardImage}
              >
                <Text style={[styles.cardBadge, { backgroundColor: COLORS.danger }]}>Foster Needed</Text>
              </ImageBackground>
              <View style={styles.listCardContent}>
                <Text style={styles.listCardTitle}>3 Puppies, Patan</Text>
                <Text numberOfLines={2} style={styles.listCardDesc}>Found abandoned near Durbar Square. Urgent foster care required for 2 weeks.</Text>
                <Pressable style={styles.actionButtonOutline}>
                  <Text style={styles.actionButtonText}>I Can Foster</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.listCard}>
              <ImageBackground
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCanuTCLCsq3vyBw2yewkElCdrM0rpT-eGPQkRnrGjatEgx_DC2mm8K32i7PwhH9-ySlaY-5goYKKmnn4gOjdJX2SFmZhrkCayjZE82XfldPdReKPi5De455lJDaMg9bF0GF2yJunLSbbqOFr8KOpWFRKHxwE-b4qYdDoagMqz8bM3XusxZY1gfJgOHETtoijvfqTWZBquj6BhH1GNXSvV6nGXlDJ6mRLMrudaC8BSspB9opeTYm11bNWHepjGRm-UmIXXwO7-4lD4' }}
                style={styles.listCardImage}
              >
                <Text style={[styles.cardBadge, { backgroundColor: COLORS.warning }]}>Medical Fund</Text>
              </ImageBackground>
              <View style={styles.listCardContent}>
                <Text style={styles.listCardTitle}>Kalu's Surgery</Text>
                <Text numberOfLines={2} style={styles.listCardDesc}>Hit by a bike. Needs leg surgery immediately. We are raising NPR 15,000.</Text>
                <Pressable style={styles.actionButtonOutline}>
                  <Text style={styles.actionButtonText}>Donate Now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
  },
  listCardImage: {
    height: 128,
    width: '100%',
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
    textTransform: 'uppercase',
  },
  listCardContent: {
    padding: 12,
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
    marginBottom: 12,
    lineHeight: 16,
    height: 32,
  },
  actionButtonOutline: {
    backgroundColor: 'rgba(55,236,19,0.1)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
});