import { styles } from '@/src/styles/reportStyles';
import type { StrayDog } from '@/src/types/StrayDog';
import React, { useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  strayDogs: StrayDog[];
  setStrayDogs: React.Dispatch<React.SetStateAction<StrayDog[]>>;
  selectedLocation?: { latitude: number; longitude: number };
}

export default function ReportModal({
  visible,
  onClose,
  strayDogs,
  setStrayDogs,
  selectedLocation
}: ReportModalProps) {
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');

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
    setDescription('');
    setReporterName('');
    onClose();
    Alert.alert('Success', 'Stray dog reported successfully!');
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
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
              onPress={onClose}
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
  );
}
