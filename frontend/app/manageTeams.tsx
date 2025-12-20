import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, 
  ScrollView, StatusBar, ActivityIndicator, Dimensions
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- FIREBASE IMPORTS ---
import { db, auth } from '../src/config/firebase'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const DESIGN = {
  primary: '#37ec13',
  bgLight: '#f6f8f6',
  white: '#ffffff',
  textMain: '#121811',
  textSub: '#688961',
  border: '#E8EBE8',
};

const CATEGORIES = ['All Teams', 'Rescue', 'Medical', 'Logistics', 'Care'];

export default function ManageTeams() {
  const router = useRouter();
  
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Teams');
  
  // 1. NEW STATE: Sorting Criteria ('name' or 'members')
  const [sortBy, setSortBy] = useState<'name' | 'members'>('name');

  useEffect(() => {
    const q = query(
      collection(db, "teams"),
      where("orgId", "==", auth.currentUser?.uid || 'guest')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(teamList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. LOGIC: Filter and then Sort
  const filteredAndSortedTeams = teams
    .filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All Teams' || 
        team.focus.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name); // Sort A-Z
      } else {
        return (b.members?.length || 0) - (a.members?.length || 0); // Sort Highest to Lowest
      }
    });

  const toggleSort = () => {
    setSortBy(prev => prev === 'name' ? 'members' : 'name');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={DESIGN.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Teams</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.main}>
        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color="#999" style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search teams..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* CATEGORY CHIPS */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable 
                key={cat} 
                onPress={() => setActiveCategory(cat)}
                style={[styles.chip, activeCategory === cat && styles.chipActive]}
              >
                <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.listContent}>
          {/* SORTING TOGGLE HEADER */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE TEAMS</Text>
            <Pressable onPress={toggleSort} style={styles.sortBtn}>
              <Text style={styles.sortText}>
                Sort by: <Text style={{fontWeight: '900'}}>{sortBy === 'name' ? 'Name' : 'Members'}</Text>
              </Text>
              <MaterialIcons 
                name={sortBy === 'name' ? 'sort-by-alpha' : 'groups'} 
                size={16} 
                color={DESIGN.primary} 
                style={{ marginLeft: 4 }}
              />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={DESIGN.primary} style={{ marginTop: 40 }} />
          ) : filteredAndSortedTeams.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🐶</Text>
              <Text style={styles.emptyTitle}>No teams found</Text>
            </View>
          ) : (
            filteredAndSortedTeams.map((team) => (
              <View key={team.id} style={styles.teamCard}>
                <View style={styles.avatarPlaceholder}>
                   <MaterialCommunityIcons name="account-group" size={28} color="#AAA" />
                </View>
                
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <View style={styles.teamSubRow}>
                    <MaterialIcons name="group" size={14} color={DESIGN.textSub} />
                    <Text style={styles.memberCount}>{team.members?.length || 0} Members</Text>
                    <View style={styles.dot} />
                    <Text style={styles.focusLabel}>{team.focus}</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#CCC" />
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* CREATE BUTTON */}
      <View style={styles.footer}>
        <Pressable style={styles.createBtn} onPress={() => router.push('/createTeam')}>
          <MaterialIcons name="add-circle" size={24} color="black" />
          <Text style={styles.createBtnText}>Create New Team</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  iconBtn: { padding: 4 },
  main: { flex: 1, paddingHorizontal: 16 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    height: 52, borderRadius: 26, paddingHorizontal: 16, marginVertical: 12, elevation: 1
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipScroll: { paddingBottom: 16 },
  chip: { paddingHorizontal: 20, height: 38, borderRadius: 19, backgroundColor: '#FFF', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: DESIGN.border },
  chipActive: { backgroundColor: DESIGN.primary, borderColor: DESIGN.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: DESIGN.textSub },
  chipTextActive: { color: 'black', fontWeight: '800' },
  listContent: { paddingBottom: 120 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#999' },
  sortBtn: { flexDirection: 'row', alignItems: 'center' },
  sortText: { fontSize: 12, color: DESIGN.primary, fontWeight: '600' },
  teamCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 20, marginBottom: 10, elevation: 1 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F2F0', justifyContent: 'center', alignItems: 'center' },
  teamInfo: { flex: 1, marginLeft: 15 },
  teamName: { fontSize: 16, fontWeight: '800' },
  teamSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  memberCount: { fontSize: 12, color: DESIGN.textSub, marginLeft: 4 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 8 },
  focusLabel: { fontSize: 12, color: DESIGN.textSub, textTransform: 'capitalize' },
  footer: { position: 'absolute', bottom: 0, width: width, padding: 20, paddingBottom: 30 },
  createBtn: { backgroundColor: DESIGN.primary, height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  createBtnText: { fontSize: 18, fontWeight: '900' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#999', marginTop: 10 }
});