import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, 
  ScrollView, StatusBar, ActivityIndicator, Dimensions, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- FIREBASE IMPORTS ---
import { db, auth } from '../src/config/firebase'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const DESIGN = {
  primary: '#37ec13',
  bgLight: '#f6f8f6',
  white: '#ffffff',
  textMain: '#121811',
  textSub: '#688961',
  border: '#E8EBE8',
  accent: '#e6fce2'
};

const CATEGORIES = ['All Teams', 'Rescue', 'Medical', 'Logistics', 'Care'];

export default function ManageTeams() {
  const router = useRouter();
  
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Teams');
  const [sortBy, setSortBy] = useState<'name' | 'members'>('name');

  // 1. NEW STATE: Track which team is expanded
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }

    const q = query(collection(db, "teams"), where("orgId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id: string) => {
    // Smooth animation when opening/closing
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTeamId(prev => prev === id ? null : id);
  };

  // Filter & Sort Logic
  const filteredAndSortedTeams = teams
    .filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All Teams' || team.focus.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.members?.length || 0) - (a.members?.length || 0);
    });

  const toggleSort = () => setSortBy(prev => prev === 'name' ? 'members' : 'name');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={DESIGN.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Teams</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.main}>
        {/* Search & Filter UI (Unchanged) */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color="#999" style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search teams..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE TEAMS</Text>
            <Pressable onPress={toggleSort} style={styles.sortBtn}>
              <Text style={styles.sortText}>Sort: <Text style={{fontWeight: '900'}}>{sortBy === 'name' ? 'Name' : 'Size'}</Text></Text>
              <MaterialIcons name="sort" size={16} color={DESIGN.primary} style={{ marginLeft: 4 }}/>
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
            filteredAndSortedTeams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              
              return (
                <Pressable 
                  key={team.id} 
                  style={[styles.teamCard, isExpanded && styles.teamCardExpanded]} 
                  onPress={() => toggleExpand(team.id)}
                >
                  {/* MAIN CARD ROW */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarPlaceholder, isExpanded && {backgroundColor: DESIGN.primary}]}>
                       <MaterialCommunityIcons name="account-group" size={28} color={isExpanded ? 'black' : '#AAA'} />
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
                    
                    <MaterialIcons 
                      name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="#CCC" 
                    />
                  </View>

                  {/* EXPANDED MEMBER LIST */}
                  {isExpanded && (
                    <View style={styles.membersContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.membersLabel}>TEAM ROSTER</Text>
                      
                      {team.members && team.members.length > 0 ? (
                        team.members.map((member: any, index: number) => (
                          <View key={index} style={styles.memberRow}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.initials}>{member.name.charAt(0)}</Text>
                            </View>
                            <View>
                              <Text style={styles.memberName}>{member.name}</Text>
                              <Text style={styles.memberPhone}>{member.phone}</Text>
                            </View>
                            <Pressable style={styles.callBtn}>
                               <MaterialIcons name="phone" size={18} color={DESIGN.primary} />
                            </Pressable>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noMembers}>No members listed.</Text>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

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
  
  // Search & Chips
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 52, borderRadius: 26, paddingHorizontal: 16, marginVertical: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height: 2} },
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
  
  // --- UPDATED CARD STYLES ---
  teamCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    marginBottom: 12, 
    
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android (Elevation)
    elevation: 3, 
    
    borderWidth: 1,
    borderColor: 'transparent', // Invisible border by default
  },
  
  // When active, give it a green border
  teamCardExpanded: { 
    borderColor: DESIGN.primary, 
    elevation: 0, // Flatten it when open if you prefer, or keep it
    backgroundColor: '#fcfdfc'
  },
  
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
    // This ensures the rounded corners work even if we removed overflow:hidden from parent
    borderRadius: 16, 
    backgroundColor: '#FFF'
  },
  
  // Visual "Status Strip" on the left
  activeStrip: {
    width: 4,
    height: '60%',
    backgroundColor: DESIGN.primary,
    borderRadius: 2,
    marginRight: 12
  },

  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F2F0', justifyContent: 'center', alignItems: 'center' },
  teamInfo: { flex: 1, marginLeft: 12 },
  teamName: { fontSize: 16, fontWeight: '800', color: DESIGN.textMain },
  teamSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  memberCount: { fontSize: 12, color: DESIGN.textSub, marginLeft: 4, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#CCC', marginHorizontal: 8 },
  focusLabel: { fontSize: 11, color: DESIGN.textSub, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', backgroundColor: '#f0f2f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  // EXPANDED AREA
  membersContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    backgroundColor: '#fcfdfc',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 15, marginHorizontal: 10 },
  membersLabel: { fontSize: 11, fontWeight: '800', color: '#AAA', marginBottom: 10, letterSpacing: 1, marginLeft: 4 },
  
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e6fce2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  initials: { fontSize: 13, fontWeight: '800', color: '#2a5c24' },
  memberName: { fontSize: 14, fontWeight: '700', color: DESIGN.textMain },
  memberPhone: { fontSize: 12, color: DESIGN.textSub },
  callBtn: { marginLeft: 'auto', padding: 8, backgroundColor: '#f5f7f5', borderRadius: 20 },
  noMembers: { fontStyle: 'italic', color: '#999', fontSize: 13, padding: 10 },

  footer: { position: 'absolute', bottom: 0, width: width, padding: 20, paddingBottom: 30 },
  createBtn: { backgroundColor: DESIGN.primary, height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5, shadowColor: DESIGN.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width:0, height: 4} },
  createBtnText: { fontSize: 18, fontWeight: '900' },
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#999', marginTop: 10 }
});