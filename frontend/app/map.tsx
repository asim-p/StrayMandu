import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  ActivityIndicator,
  StatusBar,
  TextInput, 
  Alert,     
  Keyboard,
  Image
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav'; 

// Firebase Imports
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { DogReportData } from '../src/services/reportService';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  alert: '#ef4444', // Red for emergencies
  background: '#f6f8f6',
  surface: '#ffffff',
  textMain: '#121811',
  textSub: '#5c6f57',
};

// Extend your Report Type to include the Firestore Document ID
interface ReportWithId extends DogReportData {
  id: string;
}

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [reports, setReports] = useState<ReportWithId[]>([]); // Store real reports
  const [selectedReport, setSelectedReport] = useState<ReportWithId | null>(null);
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch User Location & Reports on Mount
  useEffect(() => {
    (async () => {
      // A. Get User Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }

      // B. Fetch Reports from Firebase
      fetchReports();
    })();
    
    // Optimize marker rendering
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'reports'));
      const fetchedReports: ReportWithId[] = [];
      
      querySnapshot.forEach((doc) => {
        // Cast the data to your interface
        fetchedReports.push({ id: doc.id, ...doc.data() } as ReportWithId);
      });

      setReports(fetchedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      Alert.alert("Error", "Could not load stray dog reports.");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    Keyboard.dismiss();

    try {
      const geocodedLocation = await Location.geocodeAsync(searchQuery);

      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      } else {
        Alert.alert('Location not found', 'Please try a different search term.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Something went wrong while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkerPress = (report: ReportWithId) => {
    setSelectedReport(report);
  };

  const handleMapPress = () => {
    setSelectedReport(null);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>

        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={COLORS.textSub} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search location..."
            placeholderTextColor={COLORS.textSub}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {isSearching && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
        </View>
      </View>

      {/* The Map */}
      {!userLocation && loadingReports ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSub }}>Loading Map & Reports...</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={handleMapPress}
          initialRegion={{
            // Default to Kathmandu if location fails, otherwise user loc
            latitude: userLocation?.coords.latitude || 27.7172,
            longitude: userLocation?.coords.longitude || 85.3240,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          customMapStyle={mapStyle}
        >
          {/* Render Real Reports */}
          {reports.map((report) => (
            <Marker
              key={report.id}
              coordinate={{ 
                latitude: report.location.latitude, 
                longitude: report.location.longitude 
              }}
              tracksViewChanges={tracksViewChanges}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(report);
              }}
            >
              <View style={styles.markerContainer}>
                <View style={[
                  styles.markerBubble,
                  // If emergency, turn Red, otherwise Green
                  report.emergency ? { backgroundColor: COLORS.alert, borderColor: '#fff' } : {}
                ]}>
                  <MaterialIcons name="pets" size={20} color="#FFF" />
                </View>
                <View style={[
                  styles.markerArrow,
                  report.emergency ? { borderTopColor: COLORS.alert } : {}
                ]} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Recenter Button */}
      <Pressable 
        style={styles.recenterButton}
        onPress={() => {
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
            setSearchQuery('');
          }
        }}
      >
        <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
      </Pressable>

      {/* Bottom Info Card - Updated for Real Data */}
      {selectedReport && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {selectedReport.name ? selectedReport.name : selectedReport.breed}
              </Text>
              <View style={styles.badgeRow}>
                 {/* Emergency Badge */}
                 {selectedReport.emergency && (
                    <View style={styles.emergencyBadge}>
                      <Text style={styles.emergencyText}>EMERGENCY</Text>
                    </View>
                 )}
                 <Text style={styles.cardSubtitle}>
                    {selectedReport.condition} • {selectedReport.gender}
                 </Text>
              </View>
            </View>
            
            {/* Display Image Preview if available */}
            {selectedReport.imageUrls && selectedReport.imageUrls.length > 0 ? (
              <Image 
                source={{ uri: selectedReport.imageUrls[0] }} 
                style={styles.cardImage} 
              />
            ) : (
              <View style={styles.cardIcon}>
                <MaterialIcons name="pets" size={20} color={COLORS.primary} />
              </View>
            )}
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {selectedReport.description || "No additional details provided."}
          </Text>
          
          <Pressable style={[
            styles.cardButton,
            selectedReport.emergency ? { backgroundColor: COLORS.alert } : {}
          ]}>
            <Text style={styles.cardButtonText}>View Details</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* REUSABLE COMPONENT */}
      <BottomNav activePage="map" />

    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        width: width,
        height: height,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 50,
        left: 16,
        right: 16,
        flexDirection: 'row',
        zIndex: 10,
        gap: 12,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 4,
    },
    searchBar: {
        flex: 1,
        height: 44,
        backgroundColor: COLORS.surface,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: COLORS.textMain,
        fontSize: 14,
    },
    
    // Marker Styles
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    markerBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    markerArrow: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS.primary,
        marginTop: -2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 2,
    },

    recenterButton: {
        position: 'absolute',
        right: 16,
        bottom: 250,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        elevation: 5,
        zIndex: 20,
    },

    // Card Styles
    bottomCard: {
        position: 'absolute',
        bottom: 110,
        left: 16,
        right: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        elevation: 10,
        zIndex: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textMain,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    emergencyBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    emergencyText: {
        color: '#B91C1C',
        fontSize: 10,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 12,
        color: COLORS.textSub,
        fontWeight: '600',
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(55,236,19,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    cardDesc: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        marginTop: 8,
    },
    cardButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cardButtonText: {
        fontWeight: '700',
        color: '#fff', 
    },
});

const mapStyle = [
  { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 100 }, { "visibility": "simplified" }] }
];