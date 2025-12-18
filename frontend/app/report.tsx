import { dummyReports } from "@/src/data/dummyReports";
import { styles } from "@/src/styles/reportStyles";
import type { StrayDog } from "@/src/types/StrayDog";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

//components bata taneko
import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import ReportList from "@/src/components/ReportList";
import ReportModal from "@/src/components/ReportModal";
import ViewToggle from "@/src/components/ViewToggle";
import { getStatusColor, getStatusLabel } from "@/src/utils/statusHelpers";

export default function Report() {
  const [view, setView] = useState<"map" | "list">("map");
  const [modalVisible, setModalVisible] = useState(false);
  const [strayDogs, setStrayDogs] = useState<StrayDog[]>(dummyReports);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Location fetching
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      setSelectedLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <Header />

      {/* Map/List Toggle */}
      <ViewToggle view={view} setView={setView} />

      {/* Map View */}
      {view === "map" && userLocation && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {strayDogs.map((dog) => (
            <Marker
              key={dog.id}
              coordinate={{ latitude: dog.location.latitude, longitude: dog.location.longitude }}
              pinColor={getStatusColor(dog.status)}
              title={dog.description}
              description={`Status: ${getStatusLabel(dog.status)}`}
            />
          ))}
        </MapView>
      )}

      {/* List View */}
      {view === "list" && <ReportList strayDogs={strayDogs} />}

      {/* Report Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Report Modal */}
      {selectedLocation && (
        <ReportModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          strayDogs={strayDogs}
          setStrayDogs={setStrayDogs}
          selectedLocation={selectedLocation}
        />
      )}

      {/* Footer */}
      <Footer strayDogs={strayDogs} />
    </View>
  );
}
