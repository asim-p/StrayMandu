// import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import OrgBottomNav from '../src/components/OrgBottom';
const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceDark: '#1a2c15',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

// Mock Data - Replace with Firebase query later
const RANKING_DATA = [
  { id: '1', name: 'KAT Centre', points: 1250, rescues: 84, image: 'https://i.pravatar.cc/150?u=kat' },
  { id: '2', name: 'Sneha Care', points: 1100, rescues: 72, image: 'https://i.pravatar.cc/150?u=sneha' },
  { id: '3', name: 'StrayMandu HQ', points: 950, rescues: 56, image: 'https://i.pravatar.cc/150?u=stray' },
  { id: '4', name: 'Animal Nepal', points: 800, rescues: 45, image: 'https://i.pravatar.cc/150?u=animal' },
  { id: '5', name: 'Paws Foundation', points: 720, rescues: 38, image: 'https://i.pravatar.cc/150?u=paws' },
  { id: '6', name: 'Valley Rescue', points: 600, rescues: 30, image: 'https://i.pravatar.cc/150?u=valley' },
];

export default function Leaderboard() {
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isTopThree = index < 3;
    
    return (
      <View style={styles.rankRow}>
        <View style={styles.rankLeft}>
          <Text style={styles.rankNumber}>{index + 1}</Text>
          <Image source={{ uri: item.image }} style={styles.rowAvatar} />
          <View>
            <Text style={styles.rowName}>{item.name}</Text>
            <Text style={styles.rowSub}>{item.rescues} Successful Rescues</Text>
          </View>
        </View>
        <View style={styles.rankRight}>
          <Text style={styles.pointsText}>{item.points}</Text>
          <Text style={styles.pointsLabel}>PTS</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top performing organizations in Nepal</Text>
      </View>

      {/* Podium Section */}
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        <View style={[styles.podiumSpot, { marginTop: 30 }]}>
          <FontAwesome5 name="medal" size={20} color={COLORS.silver} />
          <Image source={{ uri: RANKING_DATA[1].image }} style={[styles.podiumAvatar, { borderColor: COLORS.silver }]} />
          <Text style={styles.podiumName}>{RANKING_DATA[1].name}</Text>
          <View style={styles.podiumBadge}><Text style={styles.podiumPoints}>{RANKING_DATA[1].points}</Text></View>
        </View>

        {/* 1st Place */}
        <View style={styles.podiumSpot}>
          <FontAwesome5 name="crown" size={24} color={COLORS.gold} style={{ marginBottom: 5 }} />
          <Image source={{ uri: RANKING_DATA[0].image }} style={[styles.podiumAvatar, styles.firstPlaceAvatar]} />
          <Text style={styles.podiumName}>{RANKING_DATA[0].name}</Text>
          <View style={[styles.podiumBadge, { backgroundColor: COLORS.gold }]}><Text style={[styles.podiumPoints, { color: '#000' }]}>{RANKING_DATA[0].points}</Text></View>
        </View>

        {/* 3rd Place */}
        <View style={[styles.podiumSpot, { marginTop: 40 }]}>
          <FontAwesome5 name="medal" size={20} color={COLORS.bronze} />
          <Image source={{ uri: RANKING_DATA[2].image }} style={[styles.podiumAvatar, { borderColor: COLORS.bronze }]} />
          <Text style={styles.podiumName}>{RANKING_DATA[2].name}</Text>
          <View style={styles.podiumBadge}><Text style={styles.podiumPoints}>{RANKING_DATA[2].points}</Text></View>
        </View>
      </View>

      {/* List Section */}
      <View style={styles.listContainer}>
        <FlatList
          data={RANKING_DATA.slice(3)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <OrgBottomNav activePage="ranking" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surfaceDark },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    height: 220,
    marginTop: 10,
  },
  podiumSpot: { alignItems: 'center', width: width / 3.5 },
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: COLORS.primary },
  firstPlaceAvatar: { width: 80, height: 80, borderRadius: 40, borderColor: COLORS.gold },
  podiumName: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  podiumBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  podiumPoints: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  rankNumber: { fontSize: 16, fontWeight: '800', color: COLORS.textSub, width: 25 },
  rowAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#DDD' },
  rowName: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  rowSub: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  rankRight: { alignItems: 'flex-end' },
  pointsText: { fontSize: 18, fontWeight: '900', color: COLORS.textMain },
  pointsLabel: { fontSize: 9, fontWeight: '700', color: COLORS.primary },
});