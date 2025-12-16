import { dummyReports } from "@/src/data/dummyReports";
import { styles } from "@/src/styles/reportStyles";
import type { StrayDog } from "@/src/types/StrayDog";
import { getStatusColor, getStatusLabel } from "@/src/utils/statusHelpers";
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';


const { width, height } = Dimensions.get('window');


export default function Report() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [modalVisible, setModalVisible] = useState(false);
  const [strayDogs, setStrayDogs] = useState<StrayDog[]>(dummyReports);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

//Location 

  const handleReport = () => {
    if (!description || !reporterName || !selectedLocation) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const newReport: StrayDog = {
      id: Date.now().toString(),
      location: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: 'Selected Location',
      },
      description,
      status: 'reported',
      reportedBy: reporterName,
      reportedAt: new Date(),
    };

    setStrayDogs([...strayDogs, newReport]);
    setModalVisible(false);
    setDescription('');
    setReporterName('');
    Alert.alert('Success', 'Stray dog reported successfully!');
  };


  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
 

      {/* Map View */}
      {view === 'map' && userLocation && (
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
              coordinate={{
                latitude: dog.location.latitude,
                longitude: dog.location.longitude,
              }}
              pinColor={getStatusColor(dog.status)}
              title={dog.description}
              description={`Status: ${getStatusLabel(dog.status)}`}
            />
          ))}
        </MapView>
      )}

      {/* List View */}

      {/* Report Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Report Modal */}

      {/* Stats Footer */}
    </View>
  );
}
