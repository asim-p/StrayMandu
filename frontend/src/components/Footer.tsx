import { styles } from '@/src/styles/reportStyles';
import type { StrayDog } from '@/src/types/StrayDog';
import React from 'react';
import { Text, View } from 'react-native';

interface StatsFooterProps {
  strayDogs: StrayDog[];
}

export default function StatsFooter({ strayDogs }: StatsFooterProps) {
  return (
    <View style={styles.footer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{strayDogs.length}</Text>
        <Text style={styles.statLabel}>Total Reports</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {strayDogs.filter(d => d.status === 'rescued').length}
        </Text>
        <Text style={styles.statLabel}>Rescued</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {strayDogs.filter(d => d.status === 'vaccinated').length}
        </Text>
        <Text style={styles.statLabel}>Vaccinated</Text>
      </View>
    </View>
  );
}
