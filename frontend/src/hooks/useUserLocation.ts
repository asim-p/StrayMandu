import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export function useUserLocation() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  
useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);
    return location;
}