import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { dummyReports } from "@/src/data/dummyReports";
const [strayDogs, setStrayDogs] = useState(dummyReports);


const { width, height } = Dimensions.get('window');

// Types
interface StrayDog {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  status: 'reported' | 'rescued' | 'vaccinated' | 'relocated';
  reportedBy: string;
  reportedAt: Date;
  imageUrl?: string;
}

export default function Report() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [modalVisible, setModalVisible] = useState(false);
  const [strayDogs, setStrayDogs] = useState<StrayDog[]>([]);
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

  // Load user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Sample data for demonstration
  // useEffect(() => {
  //   setStrayDogs([
  //     {
  //       id: '1',
  //       location: {
  //         latitude: 27.7172,
  //         longitude: 85.324,
  //         address: 'Thamel, Kathmandu',
  //       },
  //       description: 'Injured dog near tourist area, limping',
  //       status: 'reported',
  //       reportedBy: 'Anonymous',
  //       reportedAt: new Date('2025-10-28'),
  //     },
  //     {
  //       id: '2',
  //       location: {
  //         latitude: 27.7089,
  //         longitude: 85.3206,
  //         address: 'Patan Durbar Square',
  //       },
  //       description: 'Mother dog with puppies, needs food',
  //       status: 'rescued',
  //       reportedBy: 'Karma Sherpa',
  //       reportedAt: new Date('2025-10-27'),
  //     },
  //     {
  //       id: '3',
  //       location: {
  //         latitude: 27.7242,
  //         longitude: 85.3089,
  //         address: 'Swayambhunath Temple Area',
  //       },
  //       description: 'Aggressive dog, vaccination needed',
  //       status: 'vaccinated',
  //       reportedBy: 'Sita Rai',
  //       reportedAt: new Date('2025-10-26'),
  //     },
  //   ]);
  // }, []);

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

  const getStatusColor = (status: StrayDog['status']) => {
    switch (status) {
      case 'reported':
        return '#ff6b6b';
      case 'rescued':
        return '#feca57';
      case 'vaccinated':
        return '#48dbfb';
      case 'relocated':
        return '#1dd1a1';
      default:
        return '#95a5a6';
    }
  };

  const getStatusLabel = (status: StrayDog['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐕 StrayMandu</Text>
        <Text style={styles.headerSubtitle}>Protecting Nepal's Strays</Text>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'map' && styles.toggleActive]}
          onPress={() => setView('map')}
        >
          <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>
            Map View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, view === 'list' && styles.toggleActive]}
          onPress={() => setView('list')}
        >
          <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>
            List View
          </Text>
        </TouchableOpacity>
      </View>

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
      {view === 'list' && (
        <ScrollView style={styles.listContainer}>
          {strayDogs.map((dog) => (
            <View key={dog.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(dog.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusLabel(dog.status)}</Text>
                </View>
                <Text style={styles.cardDate}>
                  {dog.reportedAt.toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.cardDescription}>{dog.description}</Text>
              <Text style={styles.cardLocation}>📍 {dog.location.address}</Text>
              <Text style={styles.cardReporter}>Reported by: {dog.reportedBy}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Report Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report a Stray Dog</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={reporterName}
              onChangeText={setReporterName}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the dog's condition and location details"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.locationHint}>
              📍 Location will be set to your current position
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReport}
              >
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stats Footer */}
      <View style={styles.footer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{strayDogs.length}</Text>
          <Text style={styles.statLabel}>Total Reports</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {strayDogs.filter((d) => d.status === 'rescued').length}
          </Text>
          <Text style={styles.statLabel}>Rescued</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {strayDogs.filter((d) => d.status === 'vaccinated').length}
          </Text>
          <Text style={styles.statLabel}>Vaccinated</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2ecc71',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#2ecc71',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
  },
  map: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardReporter: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#e74c3c',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});