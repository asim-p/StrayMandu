import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  inactive: '#9CA3AF',
};

type BottomNavProps = {
  activePage: 'home' | 'map' | 'donate' | 'about';
};

export default function BottomNav({ activePage }: BottomNavProps) {
  const router = useRouter();

  const getColor = (page: string) => {
    return activePage === page ? COLORS.primary : COLORS.inactive;
  };

  const getLabelStyle = (page: string) => {
    return [
      styles.navLabel,
      { 
        color: activePage === page ? COLORS.textMain : COLORS.inactive,
        fontWeight: activePage === page ? '700' : '500' 
      }
    ];
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        <Pressable onPress={() => router.push('/home')} style={styles.navItem}>
          <MaterialIcons name="home" size={26} color={getColor('home')} />
          <Text style={getLabelStyle('home')}>Home</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/map')} style={styles.navItem}>
          <MaterialIcons name="map" size={26} color={getColor('map')} />
          <Text style={getLabelStyle('map')}>Map</Text>
        </Pressable>

        {/* Spacer for Floating Button */}
        <View style={{ width: 60 }} />

        <Pressable onPress={() => router.push('/volunteer')} style={styles.navItem}>
          <MaterialIcons name="volunteer-activism" size={26} color={getColor('donate')} />
          <Text style={getLabelStyle('donate')}>Donate</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/about')} style={styles.navItem}>
          <MaterialIcons name="info" size={26} color={getColor('about')} />
          <Text style={getLabelStyle('about')}>About</Text>
        </Pressable>
      </View>

      {/* Floating Report Button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable 
          onPress={() => router.push('/report')}
          style={({pressed}) => [styles.floatingButton, pressed && { transform: [{scale: 0.95}] }]}
        >
          <MaterialIcons name="add" size={32} color="#121811" />
        </Pressable>
        <Text style={styles.floatingLabel}>Report</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 100, // Ensure it stays on top
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    height: 80, 
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
  },
  floatingButtonContainer: {
    position: 'absolute',
    top: -30, 
    left: width / 2 - 30, 
    alignItems: 'center',
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.backgroundLight, 
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#121811',
    marginTop: 6,
  },
});