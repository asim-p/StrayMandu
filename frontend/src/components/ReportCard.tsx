import { styles } from '@/src/styles/reportStyles';
import type { StrayDog } from '@/src/types/StrayDog';
import { getStatusColor, getStatusLabel } from '@/src/utils/statusHelpers';
import React from 'react';
import { Text, View } from 'react-native';

interface ReportCardProps {
  dog: StrayDog;
}

export default function ReportCard({ dog }: ReportCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dog.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(dog.status)}</Text>
        </View>
        <Text style={styles.cardDate}>{dog.reportedAt.toLocaleDateString()}</Text>
      </View>
      <Text style={styles.cardDescription}>{dog.description}</Text>
      <Text style={styles.cardLocation}>📍 {dog.location.address}</Text>
      <Text style={styles.cardReporter}>Reported by: {dog.reportedBy}</Text>
    </View>
  );
}
