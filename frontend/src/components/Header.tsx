import { styles } from '@/src/styles/reportStyles';
import React from 'react';
import { Text, View } from 'react-native';

export default function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>🐕 StrayMandu</Text>
      <Text style={styles.headerSubtitle}>Protecting Nepal's Strays</Text>
    </View>
  );
}
