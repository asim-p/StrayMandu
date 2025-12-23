import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationPicked: (location: LocationData) => void;
  incomingLocation?: LocationData | null; // <--- NEW PROP
}

export default function LocationPicker({ onLocationPicked, incomingLocation }: LocationPickerProps) {
  const mapRef = useRef<MapView>(null); // <--- NEW REF
  const [pickedLocation, setPickedLocation] = useState<LocationData | null>(null);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. AUTOMATICALLY GET USER LOCATION ON MOUNT
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Default fallback (Kathmandu)
          setInitialRegion({
            latitude: 27.7172,
            longitude: 85.3240,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setInitialRegion({
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        
        setPickedLocation(coords);
        onLocationPicked(coords);
      } catch (error) {
        Alert.alert('Error', 'Could not fetch location.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 2. LISTEN FOR EXTERNAL SEARCH UPDATES (NEW)
  useEffect(() => {
    if (incomingLocation) {
      // Update the marker
      setPickedLocation(incomingLocation);
      
      // Move the map
      mapRef.current?.animateToRegion({
        latitude: incomingLocation.latitude,
        longitude: incomingLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);

      // Tell parent the location is set
      onLocationPicked(incomingLocation);
    }
  }, [incomingLocation]);

  // Handle manual map taps
  const pickOnMapHandler = (event: MapPressEvent) => {
    const coords = event.nativeEvent.coordinate;
    setPickedLocation(coords);
    onLocationPicked(coords);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#37ec13" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef} // <--- ATTACH REF
        style={styles.map}
        initialRegion={initialRegion}
        onPress={pickOnMapHandler}
        provider={PROVIDER_GOOGLE} 
        showsUserLocation={true} 
        showsMyLocationButton={false} 
      >
        {pickedLocation && (
          <Marker 
            title="Selected Location" 
            coordinate={pickedLocation} 
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  }
});