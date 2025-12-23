import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
  Dimensions,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import OrgBottomNav from '../src/components/OrgBottom';

// --- FIREBASE IMPORTS ---
import { auth, db } from '../src/config/firebase';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  primaryDark: '#2ab80e',
  backgroundLight: '#f6f8f6',
  surfaceDark: '#1a2c15',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
  highlightBg: '#ecfccb', // Light green highlight for current user
  highlightBorder: '#37ec13',
};

const DEFAULT_IMAGE = 'https://firebasestorage.googleapis.com/v0/b/straymandu-db.appspot.com/o/defaults%2Fdefault-org.png?alt=media';

export default function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'monthly' | 'lifetime'>('monthly');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (user) setCurrentUser(user.uid);

        // Fetch all organizations
        // In a real production app with thousands of orgs, you would use limit() and pagination.
        const orgsRef = collection(db, 'organizations');
        const q = query(orgsRef); 
        const querySnapshot = await getDocs(q);

        const orgs = querySnapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.organizationName || d.name || 'Unknown Org',
            image: d.photoURL || null,
            monthly: d.monthlyRescues || 0,
            lifetime: d.totalRescues || 0,
          };
        });

        setData(orgs);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Sort data based on selected timeframe
  const getSortedData = () => {
    const sorted = [...data].sort((a, b) => {
      const valA = timeframe === 'monthly' ? a.monthly : a.lifetime;
      const valB = timeframe === 'monthly' ? b.monthly : b.lifetime;
      return valB - valA; // Descending order
    });
    return sorted;
  };

  const sortedData = getSortedData();
  const topThree = sortedData.slice(0, 3);
  const restOfList = sortedData.slice(3);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.id === currentUser;
    const rank = index + 4; // Because top 3 are in podium
    const score = timeframe === 'monthly' ? item.monthly : item.lifetime;

    return (
      <View style={[styles.rankRow, isMe && styles.highlightRow]}>
        <View style={styles.rankLeft}>
          <Text style={[styles.rankNumber, isMe && { color: COLORS.primaryDark }]}>{rank}</Text>
          <Image 
            source={item.image ? { uri: item.image } : { uri: DEFAULT_IMAGE }} 
            style={styles.rowAvatar} 
          />
          <View>
            <Text style={[styles.rowName, isMe && { color: COLORS.primaryDark }]}>
              {item.name} {isMe && '(You)'}
            </Text>
            <Text style={styles.rowSub}>{score} Rescues</Text>
          </View>
        </View>
        <View style={styles.rankRight}>
          <Text style={[styles.pointsText, isMe && { color: COLORS.primaryDark }]}>{score}</Text>
          <Text style={styles.pointsLabel}>RESCUES</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.surfaceDark} />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSub}>Top performing organizations in Nepal</Text>

        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleBtn, timeframe === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setTimeframe('monthly')}
          >
            <Text style={[styles.toggleText, timeframe === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </Pressable>
          <Pressable 
            style={[styles.toggleBtn, timeframe === 'lifetime' && styles.toggleBtnActive]}
            onPress={() => setTimeframe('lifetime')}
          >
            <Text style={[styles.toggleText, timeframe === 'lifetime' && styles.toggleTextActive]}>All-Time</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Podium Section */}
          <View style={styles.podiumContainer}>
            {/* 2nd Place */}
            {topThree[1] && (
              <View style={[styles.podiumSpot, { marginTop: 30 }]}>
                <FontAwesome5 name="medal" size={20} color={COLORS.silver} />
                <Image 
                  source={topThree[1].image ? { uri: topThree[1].image } : { uri: DEFAULT_IMAGE }} 
                  style={[styles.podiumAvatar, { borderColor: COLORS.silver }]} 
                />
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[1].name}</Text>
                <View style={styles.podiumBadge}>
                  <Text style={styles.podiumPoints}>
                    {timeframe === 'monthly' ? topThree[1].monthly : topThree[1].lifetime}
                  </Text>
                </View>
              </View>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <View style={styles.podiumSpot}>
                <FontAwesome5 name="crown" size={24} color={COLORS.gold} style={{ marginBottom: 5 }} />
                <Image 
                  source={topThree[0].image ? { uri: topThree[0].image } : { uri: DEFAULT_IMAGE }} 
                  style={[styles.podiumAvatar, styles.firstPlaceAvatar]} 
                />
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[0].name}</Text>
                <View style={[styles.podiumBadge, { backgroundColor: COLORS.gold }]}>
                  <Text style={[styles.podiumPoints, { color: '#000' }]}>
                    {timeframe === 'monthly' ? topThree[0].monthly : topThree[0].lifetime}
                  </Text>
                </View>
              </View>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <View style={[styles.podiumSpot, { marginTop: 40 }]}>
                <FontAwesome5 name="medal" size={20} color={COLORS.bronze} />
                <Image 
                   source={topThree[2].image ? { uri: topThree[2].image } : { uri: DEFAULT_IMAGE }} 
                   style={[styles.podiumAvatar, { borderColor: COLORS.bronze }]} 
                />
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[2].name}</Text>
                <View style={styles.podiumBadge}>
                  <Text style={styles.podiumPoints}>
                    {timeframe === 'monthly' ? topThree[2].monthly : topThree[2].lifetime}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* List Section */}
          <View style={styles.listContainer}>
            <FlatList
              data={restOfList}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: COLORS.textSub }}>No other organizations found.</Text>
                </View>
              }
            />
          </View>
        </>
      )}

      <OrgBottomNav activePage="ranking" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.surfaceDark },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surfaceDark },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginTop: 20,
    padding: 4,
    width: 200,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  toggleTextActive: {
    color: '#000',
    fontWeight: '800',
  },

  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    height: 200,
    marginTop: 10,
  },
  podiumSpot: { alignItems: 'center', width: width / 3.5 },
  podiumAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 3, borderColor: COLORS.primary, backgroundColor: '#333' },
  firstPlaceAvatar: { width: 70, height: 70, borderRadius: 35, borderColor: COLORS.gold },
  podiumName: { color: COLORS.white, fontSize: 12, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  podiumBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6 },
  podiumPoints: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 10,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: COLORS.backgroundLight,
  },
  highlightRow: {
    backgroundColor: COLORS.highlightBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.highlightBorder,
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  rankNumber: { fontSize: 16, fontWeight: '800', color: COLORS.textSub, width: 25, textAlign: 'center' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDD' },
  rowName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain, maxWidth: 140 },
  rowSub: { fontSize: 11, color: COLORS.textSub, marginTop: 2 },
  rankRight: { alignItems: 'flex-end' },
  pointsText: { fontSize: 18, fontWeight: '900', color: COLORS.textMain },
  pointsLabel: { fontSize: 9, fontWeight: '700', color: COLORS.primary },
});