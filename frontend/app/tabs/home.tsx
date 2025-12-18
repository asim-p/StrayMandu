import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  ImageBackground,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  backgroundDark: '#132210',
  surfaceLight: '#ffffff',
  surfaceDark: '#1a2c15',
  textMain: '#121811',
  textSub: '#5c6f57',
};

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

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
        if (!raw) return;
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          await AsyncStorage.removeItem('user');
          return;
        }
        const name = parsed?.name || parsed?.email || parsed?._id || null;
        if (mounted && name) setUserName(name);
      } catch (err) {
        console.warn('Failed to load user from storage', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // small helpers
  const navHitSlop = { top: 10, left: 10, right: 10, bottom: 10 };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.profileContainer}>
            <ImageBackground
              source={{
                uri:
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuBwA8mbDnpc4KGlAtsEnWM9zeee9JKlQ1ylxt1kPXqscY8dWoaP0qHZgkyGvSmYk87fyHvLtzzrrtDitM-sJnKTRF_ClRnEiSxZxybQfvw2g5pSlBd7AIGApG2e-BKZ7DaxLSGCCFQsaz-xVEKQJmuPZxt-jfOSQeQtG38JEvDY4RjyPkppiCzuFcnuBJAzde7btSw7Zv5onQnDRYGxxq0b8w8lr9Rt6JWfY97wsHfLfMiPzXU64EyZzO2Q4nvRsSDcfpdog7jiZ-M',
              }}
              style={styles.profileImage}
              imageStyle={styles.profileImageStyle}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.nameText}>Namaste, {userName ?? 'Aarav'} 👋</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Notifications"
          hitSlop={navHitSlop}
          onPress={() => router.push('/notifications')}
          style={styles.notificationButton}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Card: Report a Stray */}
        <View style={styles.heroContainer}>
          <Pressable
            accessibilityLabel="Report a stray"
            hitSlop={navHitSlop}
            onPress={() => router.push('/report')}
            style={styles.heroCard}
          >
            <ImageBackground
              source={{
                uri:
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1Gwv6_qqbnjnZUsTmZPvFkciN2qagV_g_9PpGNkXbGpwdV3l4uVj8h1CLeykwqUThk_VQKp9bjSARfseXKBkit0ByZnrVZBQh3nBXfm0_AQYLgwgkMmyw1htCweqx-HmwCD4jqxriMkmnBPu-_jeccC2CMeMxEGu_Sb2Hxe1id3dnYDxHQcivVC1qAxENGqlbj7YAgWkIwMZciaVEChbQ9XkL_a7gqSHg-7qcwCCEG5SvY-PGxUVcmSKbQPlhTTlotxoMvfNjPrY',
              }}
              style={styles.heroImage}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={styles.emergencyBadge}>
                  <MaterialIcons name="emergency-share" size={14} color="#ffffff" />
                  <Text style={styles.emergencyText}>Emergency Report</Text>
                </View>
                <Text style={styles.heroTitle}>Spot a stray in need?</Text>
                <Text style={styles.heroSubtitle}>
                  Help us keep the streets safe. Report location and condition instantly.
                </Text>
                <Pressable
                  accessibilityLabel="Report now"
                  hitSlop={navHitSlop}
                  onPress={() => router.push('/report')}
                  style={styles.reportButton}
                >
                  <MaterialIcons name="add-a-photo" size={20} color="#121811" />
                  <Text style={styles.reportButtonText}>Report Now</Text>
                </Pressable>
              </View>
            </ImageBackground>
          </Pressable>
        </View>

        {/* Section: Nearby Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Reports</Text>
            <Pressable
              accessibilityLabel="View all reports"
              hitSlop={navHitSlop}
              onPress={() => router.push('/reports')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="chevron-right" size={14} color={COLORS.primary} />
            </Pressable>
          </View>

          <View style={styles.mapContainer}>
            <ImageBackground
              source={{
                uri:
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuA4PPr0HJOQ0mohRvRnwIeMxt_bdSQyY5utrgFeKXqoz98Z561u3yO38iw__VxOgEgJYCX0WvG6aCKrMeNGf5EwVlkIvjFct3Iz9kLmdQ7aotwz4FOma3lZB07AX3E6nPC9owyBLHuJEdg1AAmWPyB3a7Byt3UiT_jCBVUwuteaJ-AtHoS3PMeDxu_vKP7ixzm6wAVE7Hydbq6JiB9Rtwrx9ic7hAh2gqsZoQM7MnKm8jftMUFKi-ECvbrcwIndQOlJQft5IPfWjmc',
              }}
              style={styles.mapImage}
              imageStyle={styles.mapImageStyle}
            >
              <View style={styles.mapOverlay} />
              {/* Pins */}
              <View style={styles.pin1}>
                <View style={styles.pinIcon}>
                  <MaterialIcons name="pets" size={12} color="#121811" />
                </View>
              </View>
              <View style={styles.pin2}>
                <View style={styles.pinDot} />
              </View>
              {/* Bottom Info */}
              <View style={styles.mapInfo}>
                <View style={styles.locationContainer}>
                  <View style={styles.locationIcon}>
                    <MaterialIcons name="my-location" size={18} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.locationTitle}>Current Location</Text>
                    <Text style={styles.locationSubtitle}>Thamel, Kathmandu</Text>
                  </View>
                </View>
                <Text style={styles.activeText}>3 Active</Text>
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Section: Urgent Needs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgent Needs ❤️</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {/* Card 1 */}
            <View style={styles.urgentCard}>
              <ImageBackground
                source={{
                  uri:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxRrAnJIsX4tTfrUcmxU2SE83waosz5-br8RCf62lCSnPj-M5EFgHOTqJ5l3P4StqBaJiMq9DLxD1x97L85DDQn6Q-UoJCanCWV_cZxz6IC_1WQ0jxOJewBaK46daFbF5V0DtrnxUvhZpbbPjlX2D40OLRc_gcpn2ar_TEruP8zXGGvwWslqxojBB7Tss9LWqZ6FaDABZ8VAQ2rNgPSXWWDlrUOGBdkbwfwsTgW0LeN_7ieyYGJL58QWr9iboOeOrim0x2b8IE7v4',
                }}
                style={styles.cardImage}
              >
                <Text style={styles.cardBadge}>Foster Needed</Text>
              </ImageBackground>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>3 Puppies, Patan</Text>
                <Text style={styles.cardDescription}>
                  Found abandoned near Durbar Square. Urgent foster care required for 2 weeks.
                </Text>
                <Pressable
                  accessibilityLabel="I can foster"
                  hitSlop={navHitSlop}
                  onPress={() => router.push('/report')}
                  style={styles.cardButton}
                >
                  <Text style={styles.cardButtonText}>I Can Foster</Text>
                </Pressable>
              </View>
            </View>

            {/* Card 2 */}
            <View style={styles.urgentCard}>
              <ImageBackground
                source={{
                  uri:
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuCanuTCLCsq3vyBw2yewkElCdrM0rpT-eGPQkRnrGjatEgx_DC2mm8K32i7PwhH9-ySlaY-5goYKKmnn4gOjdJX2SFmZhrkCayjZE82XfldPdReKPi5De455lJDaMg9bF0GF2yJunLSbbqOFr8KOpWFRKHxwE-b4qYdDoagMqz8bM3XusxZY1gfJgOHETtoijvfqTWZBquj6BhH1GNXSvV6nGXlDJ6mRLMrudaC8BSspB9opeTYm11bNWHepjGRm-UmIXXwO7-4lD4',
                }}
                style={styles.cardImage}
              >
                <Text style={styles.cardBadge}>Medical Fund</Text>
              </ImageBackground>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Kalu's Surgery</Text>
                <Text style={styles.cardDescription}>
                  Hit by a bike. Needs leg surgery immediately. We are raising NPR 15,000.
                </Text>
                <Pressable
                  accessibilityLabel="Donate now"
                  hitSlop={navHitSlop}
                  onPress={() => router.push('/reportdocs')}
                  style={styles.cardButton}
                >
                  <Text style={styles.cardButtonText}>Donate Now</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable
          accessibilityLabel="Home"
          hitSlop={navHitSlop}
          onPress={() => router.push('/')}
          style={styles.navItem}
        >
          <MaterialIcons name="home" size={28} color={COLORS.primary} />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Map"
          hitSlop={navHitSlop}
          onPress={() => router.push('/map')}
          style={styles.navItem}
        >
          <MaterialIcons name="map" size={28} color="#9CA3AF" />
          <Text style={styles.navText}>Map</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Report"
          hitSlop={navHitSlop}
          onPress={() => router.push('/report')}
          style={styles.floatingButton}
        >
          <MaterialIcons name="volunteer-activism" size={28} color={COLORS.primary} />
        </Pressable>

        <Pressable
          accessibilityLabel="History"
          hitSlop={navHitSlop}
          onPress={() => router.push('/history')}
          style={styles.navItem}
        >
          <MaterialIcons name="history" size={28} color="#9CA3AF" />
          <Text style={styles.navText}>History</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Profile"
          hitSlop={navHitSlop}
          onPress={() => router.push('/profile')}
          style={styles.navItem}
        >
          <MaterialIcons name="person" size={28} color="#9CA3AF" />
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  profileImageStyle: {
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surfaceLight,
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSub,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heroCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroImage: {
    height: 240,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    opacity: 0.9,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121811',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapImage: {
    width: '100%',
    aspectRatio: 2,
  },
  mapImageStyle: {
    opacity: 0.8,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  pin1: {
    position: 'absolute',
    top: '33%',
    left: '25%',
    alignItems: 'center',
  },
  pinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pin2: {
    position: 'absolute',
    bottom: '33%',
    right: '33%',
    alignItems: 'center',
    opacity: 0.8,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mapInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(55,236,19,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  locationSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: 'rgba(55,236,19,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  horizontalScroll: {
    marginTop: 12,
  },
  urgentCard: {
    width: 240,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    height: 128,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 8,
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  cardButton: {
    backgroundColor: 'rgba(55,236,19,0.1)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 80,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    width: 48,
  },
  navText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  navTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.textMain,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.backgroundLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});