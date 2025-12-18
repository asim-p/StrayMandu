import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  background: '#f6f8f6',
  surface: '#ffffff',
  textMain: '#121811',
  textSub: '#5c6f57',
};

// Dummy Data
const DUMMY_REPORTS = [
  { id: 1, title: 'Injured Dog', type: 'Medical', lat: 27.7172, long: 85.3240, desc: 'Leg injury, needs help.' },
  { id: 2, title: 'Lost Puppy', type: 'Lost', lat: 27.7120, long: 85.3130, desc: 'Black puppy, red collar.' },
  { id: 3, title: 'Aggressive Stray', type: 'Danger', lat: 27.7200, long: 85.3200, desc: 'Barking at pedestrians.' },
];

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedReport, setSelectedReport] = useState<typeof DUMMY_REPORTS[0] | null>(null);
  
  // Optimization: Allow markers to render once before freezing them (Prevents Android Crash)
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // 1. Get User Location on Mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation);

      if (mapRef.current && userLocation) {
        mapRef.current.animateToRegion({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    })();
    
    // Stop tracking view changes after 1 second to improve performance & prevent crashes
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleMarkerPress = (report: typeof DUMMY_REPORTS[0]) => {
    setSelectedReport(report);
  };

  const handleMapPress = () => {
    setSelectedReport(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* 2. Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={COLORS.textSub} />
          <Text style={styles.searchText}>Search Kathmandu...</Text>
        </View>
      </View>

      {/* 3. The Map */}
      {!location ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSub }}>Locating you...</Text>
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
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          customMapStyle={mapStyle}
        >
          {DUMMY_REPORTS.map((report) => (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.lat, longitude: report.long }}
              // Improved Crash Fix: Only track changes for the first second
              tracksViewChanges={tracksViewChanges}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(report);
              }}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerBubble}>
                  <MaterialIcons name="pets" size={20} color="#FFF" />
                </View>
                <View style={styles.markerArrow} />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* 4. Recenter Button */}
      <Pressable 
        style={styles.recenterButton}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }}
      >
        <MaterialIcons name="my-location" size={24} color={COLORS.primary} />
      </Pressable>

      {/* 5. Bottom Info Card */}
      {selectedReport && (
        <View style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{selectedReport.title}</Text>
              <Text style={styles.cardSubtitle}>{selectedReport.type} Report</Text>
            </View>
            <View style={styles.cardIcon}>
              <MaterialIcons name="medical-services" size={20} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.cardDesc}>{selectedReport.desc}</Text>
          <Pressable style={styles.cardButton}>
            <Text style={styles.cardButtonText}>View Details</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#121811" />
          </Pressable>
        </View>
      )}

      {/* 6. Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <Pressable onPress={() => router.push('/home')} style={styles.navItem}>
            <MaterialIcons name="home" size={26} color="#9CA3AF" />
            <Text style={styles.navLabel}>Home</Text>
          </Pressable>

          <Pressable style={styles.navItem}>
            <MaterialIcons name="map" size={26} color={COLORS.primary} />
            <Text style={[styles.navLabel, { color: COLORS.textMain, fontWeight: '700' }]}>Map</Text>
          </Pressable>

          {/* Spacer for Floating Button */}
          <View style={{ width: 60 }} />

          <Pressable onPress={() => router.push('/volunteer')} style={styles.navItem}>
            <MaterialIcons name="volunteer-activism" size={26} color="#9CA3AF" />
            <Text style={styles.navLabel}>Donate</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/about')} style={styles.navItem}>
            <MaterialIcons name="info" size={26} color="#9CA3AF" />
            <Text style={styles.navLabel}>About</Text>
          </Pressable>
        </View>

        {/* Floating Report Button */}
        <View style={styles.floatingButtonContainer}>
          <Pressable 
            onPress={() => router.push('/report')}
            style={({pressed}) => [styles.floatingButton, pressed && { transform: [{scale: 0.95}] }]}
          >
            <MaterialIcons name="add" size={32} color="#121811" />
          </Pressable>
          <Text style={styles.floatingLabel}>Report</Text>
        </View>
      </View>

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
  
  /* Top Bar */
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
  searchText: {
    marginLeft: 8,
    color: COLORS.textSub,
    fontSize: 14,
  },

  /* Custom Marker - FINAL FIX */
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Removed fixed width/height to prevent clipping of shadows/edges
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
    // Shadow settings
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
    // Shadow for arrow
    shadowColor: '#000',
    shadowOpacity: 0.1, 
    elevation: 2,
  },

  /* Recenter Button */
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

  /* Bottom Card */
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
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(55,236,19,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    color: '#121811',
  },

  /* Bottom Navigation Styles */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 30, 
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    height: 80,
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: -30, 
    left: width / 2 - 30,
    alignItems: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.background, 
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textMain,
    marginTop: 6,
  },
});

const mapStyle = [
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "poi.business",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "lightness": 100 }, { "visibility": "simplified" }]
  }
];