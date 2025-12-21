import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { auth, db } from '../src/config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
} from 'firebase/firestore';

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
  border: '#E5E7EB',
};

interface PendingReport {
  id: string;
  name: string;
  breed: string;
  condition: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  imageUrls?: string[];
  createdAt?: any;
  distance?: number;
}

export default function OrgNotification() {
  const router = useRouter();
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgLocation, setOrgLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to view pending reports');
      router.back();
      return;
    }

    // Get organization location
    (async () => {
      try {
        // Try to get org location from database
        let docRef = doc(db, 'organizations', user.uid);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          docRef = doc(db, 'users', user.uid);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.location?.latitude && data.location?.longitude) {
            setOrgLocation({
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            });
          } else {
            // Fallback to current device location
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              let location = await Location.getCurrentPositionAsync({});
              setOrgLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        }
      } catch (error) {
        console.log('Error fetching org location:', error);
        // Try to use device location as fallback
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({});
            setOrgLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        } catch (locError) {
          console.log('Error getting device location:', locError);
        }
      }
    })();

    setLoading(true);

    // Subscribe to real-time pending reports
    const reportsQuery = query(
      collection(db, 'reports'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        try {
          const reports: PendingReport[] = [];
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            reports.push({
              id: doc.id,
              name: data.name || 'Unknown Dog',
              breed: data.breed || 'Unknown',
              condition: data.condition || 'Unknown',
              location: data.location || {
                latitude: 0,
                longitude: 0,
                address: 'Unknown Location',
              },
              imageUrls: data.imageUrls || [],
              createdAt: data.createdAt,
            });
          });
          setPendingReports(reports);
          setLoading(false);
        } catch (error) {
          console.error('Error processing reports:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const getReportsWithDistance = () => {
    if (!orgLocation) return pendingReports;

    return pendingReports.map((report) => ({
      ...report,
      distance: calculateDistance(
        orgLocation.latitude,
        orgLocation.longitude,
        report.location.latitude,
        report.location.longitude
      ),
    }));
  };

  const handleReportPress = (reportId: string) => {
    router.push({
      pathname: '/OrgDetailViews',
      params: { id: reportId },
    });
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'injured':
        return COLORS.danger;
      case 'sick':
        return COLORS.warning;
      case 'healthy':
        return COLORS.success;
      case 'abandoned':
        return '#8B5CF6';
      default:
        return COLORS.textSub;
    }
  };

  const getTimeAgo = (seconds: number | undefined): string => {
    if (!seconds) return 'Just now';
    const now = Math.floor(Date.now() / 1000);
    const diff = now - seconds;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSub }}>
            Loading pending reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const reportsWithDistance = getReportsWithDistance();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Nearby Reports</Text>
          {reportsWithDistance.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{reportsWithDistance.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {reportsWithDistance.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="location-off" size={64} color={COLORS.textSub} />
          <Text style={styles.emptyTitle}>No Pending Reports</Text>
          <Text style={styles.emptyDesc}>
            There are currently no pending reports in your area. Check back soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={reportsWithDistance}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={styles.reportCard}
              onPress={() => handleReportPress(item.id)}
            >
              {/* Image */}
              <Image
                source={
                  item.imageUrls && item.imageUrls.length > 0
                    ? { uri: item.imageUrls[0] }
                    : DEFAULT_IMAGE
                }
                style={styles.dogImage}
              />

              {/* Badge - New Report */}
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <View style={styles.titleSection}>
                    <Text style={styles.dogName}>{item.name}</Text>
                    <Text style={styles.breed}>{item.breed}</Text>
                  </View>
                  {item.distance !== undefined && (
                    <View style={styles.distanceContainer}>
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.distanceText}>
                        {item.distance} km
                      </Text>
                    </View>
                  )}
                </View>

                {/* Condition & Location */}
                <View style={styles.detailsRow}>
                  <View
                    style={[
                      styles.conditionTag,
                      {
                        backgroundColor: getConditionColor(item.condition) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.conditionText,
                        { color: getConditionColor(item.condition) },
                      ]}
                    >
                      {item.condition}
                    </Text>
                  </View>

                  <View style={styles.addressTag}>
                    <MaterialIcons
                      name="location-on"
                      size={12}
                      color={COLORS.textSub}
                    />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.location.address}
                    </Text>
                  </View>
                </View>

                {/* Timestamp */}
                <Text style={styles.timestamp}>
                  Reported {getTimeAgo((item.createdAt as any)?.seconds)}
                </Text>
              </View>

              {/* Right Arrow */}
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.textSub}
                style={styles.arrow}
              />
            </Pressable>
          )}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '800',
  },
  iconButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dogImage: {
    width: 80,
    height: 80,
    backgroundColor: '#E0E0E0',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  dogName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  breed: {
    fontSize: 12,
    color: COLORS.textSub,
    marginTop: 2,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  conditionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addressTag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  addressText: {
    fontSize: 11,
    color: COLORS.textSub,
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  arrow: {
    marginRight: 12,
  },
});
