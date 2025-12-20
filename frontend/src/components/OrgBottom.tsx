import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13', // StrayMandu Neon Green
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  inactive: '#9CA3AF',
};

type OrgBottomNavProps = {
  activePage: 'overview' | 'map' | 'reports' | 'ranking' | 'about';
};

export default function OrgBottomNav({ activePage }: OrgBottomNavProps) {
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
        {/* 1. OVERVIEW */}
        <Pressable onPress={() => router.push('/OrgHome')} style={styles.navItem}>
          <MaterialIcons name="dashboard" size={26} color={getColor('overview')} />
          <Text style={getLabelStyle('overview')}>Overview</Text>
        </Pressable>

        {/* 2. MAP */}
        <Pressable onPress={() => router.push('/map')} style={styles.navItem}>
          <MaterialIcons name="map" size={26} color={getColor('map')} />
          <Text style={getLabelStyle('map')}>Map</Text>
        </Pressable>

        {/* Spacer for Floating "All Reports" Button */}
        <View style={{ width: 60 }} />

        {/* 4. RANKING */}
        <Pressable onPress={() => router.push('/leaderboard')} style={styles.navItem}>
          <MaterialIcons name="leaderboard" size={26} color={getColor('ranking')} />
          <Text style={getLabelStyle('ranking')}>Ranking</Text>
        </Pressable>

        {/* 5. ABOUT */}
        <Pressable onPress={() => router.push('/aboutus')} style={styles.navItem}>
          <MaterialIcons name="info" size={26} color={getColor('about')} />
          <Text style={getLabelStyle('about')}>About</Text>
        </Pressable>
      </View>

      {/* Floating "All Reports" Button */}
      <View style={styles.floatingButtonContainer}>
        <Pressable 
          onPress={() => router.push('/myReport')}
          style={({pressed}) => [
            styles.floatingButton, 
            pressed && { transform: [{scale: 0.95}] }
          ]}
        >
          <MaterialCommunityIcons name="clipboard-list-outline" size={30} color="#121811" />
        </Pressable>
        <Text style={styles.floatingLabel}>Reports</Text>
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
    zIndex: 100,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 10,
    height: 85, 
    paddingBottom: 15,
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
    borderColor: '#f6f8f6', 
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  floatingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#121811',
    marginTop: 6,
  },
});