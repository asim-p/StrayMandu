import { styles } from '@/src/styles/reportStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ViewToggleProps {
  view: 'map' | 'list';
  setView: (view: 'map' | 'list') => void;
}

export default function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
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
  );
}
