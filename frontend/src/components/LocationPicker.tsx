import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationPickerProps {
  onLocationPicked: (location: LocationData) => void;
}

export default function LocationPicker({ onLocationPicked }: LocationPickerProps) {
  const [pickedLocation, setPickedLocation] = useState<LocationData | null>(null);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. AUTOMATICALLY GET LOCATION ON MOUNT
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Permission to access location was denied. The map will default to Kathmandu.'
          );
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
        style={styles.map}
        initialRegion={initialRegion}
        onPress={pickOnMapHandler}
        provider={PROVIDER_GOOGLE} 
        showsUserLocation={true} // Shows the blue dot for user's real position
        showsMyLocationButton={false} // We hide the default button for a cleaner look
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
    flex: 1, // Fills the parent container (The Hero Section)
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