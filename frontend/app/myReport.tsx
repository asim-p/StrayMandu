import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../src/config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { DogReportData } from '../src/services/reportService';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  surfaceLight: '#ffffff',
  textMain: '#121811',
  textSub: '#688961',
  border: '#dde6db',
  blueBadge: '#2563eb',
  orangeBadge: '#ea580c',
};

export default function MyReports() {
  const router = useRouter();
  const [reports, setReports] = useState<(DogReportData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reports'),
        where('reporterId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as (DogReportData & { id: string })[];
      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          report.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Active' && report.status !== 'resolved') || (filter === 'Completed' && report.status === 'resolved');
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'resolved': return { bg: '#37ec1320', text: '#2d8a1d', label: 'Rescued', icon: 'check-circle' };
      case 'pending': return { bg: '#fff7ed', text: COLORS.orangeBadge, label: 'Pending', icon: 'schedule' };
      default: return { bg: '#eff6ff', text: COLORS.blueBadge, label: 'In Review', icon: 'visibility' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>My Reports</Text>
        <Pressable style={styles.headerIcon}>
          <MaterialIcons name="filter-list" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search by name or ID..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['All', 'Active', 'Completed'].map((item) => (
            <Pressable 
              key={item} 
              onPress={() => setFilter(item)}
              style={[styles.chip, filter === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Report List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.listContainer}>
            {filteredReports.map((report) => {
              const status = getStatusStyle(report.status);
              return (
                <Pressable 
                  key={report.id} 
                  style={styles.reportCard}
                  onPress={() => router.push({ pathname: '/detailReports', params: { id: report.id } })}
                >
                  <View style={styles.imageWrapper}>
                    {report.imageUrls?.[0] ? (
                        <Image source={{ uri: report.imageUrls[0] }} style={styles.cardImg} />
                    ) : (
                        <View style={styles.placeholderImg}><MaterialIcons name="pets" size={32} color="#cbd5e1" /></View>
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.dogName}>{report.name || 'Unknown'}</Text>
                        <View style={styles.idBadge}>
                          <Text style={styles.idText}>ID: #{report.id.substring(0, 6).toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <MaterialIcons name={status.icon as any} size={12} color={status.text} />
                        <Text style={[styles.statusLabel, { color: status.text }]}>{status.label}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="calendar-today" size={14} color="#9ca3af" />
                        <Text style={styles.infoText}>Reported: {new Date(report.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="location-on" size={14} color="#9ca3af" />
                        <Text style={styles.infoText} numberOfLines={1}>{report.location.address}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {filteredReports.length === 0 && (
                <Text style={styles.noMoreText}>No reports found</Text>
            )}
            <Text style={styles.noMoreText}>No more reports</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable style={styles.navItem} onPress={() => router.push('/home')}>
          <MaterialIcons name="home" size={28} color="#9ca3af" />
          <Text style={styles.navText}>Home</Text>
        </Pressable>
        <Pressable style={styles.fabContainer} onPress={() => router.push('/report')}>
          <View style={styles.fab}>
            <MaterialIcons name="add" size={32} color="#132210" />
          </View>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/profile')}>
          <MaterialIcons name="person" size={28} color={COLORS.primary} />
          <Text style={[styles.navText, { color: COLORS.primary, fontWeight: '700' }]}>Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(246, 248, 246, 0.95)' },
  headerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, flex: 1, textAlign: 'center' },
  scrollPadding: { paddingBottom: 100, paddingHorizontal: 16 },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 30, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, marginTop: 8 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: COLORS.textMain },
  chipScroll: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.textMain, borderColor: COLORS.textMain },
  chipText: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  chipTextActive: { color: COLORS.surfaceLight },
  listContainer: { marginTop: 16, gap: 12 },
  reportCard: { flexDirection: 'row', backgroundColor: COLORS.surfaceLight, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: COLORS.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  imageWrapper: { width: 96, height: 96, borderRadius: 16, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%' },
  placeholderImg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: 16, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dogName: { fontSize: 17, fontWeight: '800', color: COLORS.textMain },
  idBadge: { backgroundColor: '#f3f4f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  idText: { fontSize: 10, fontWeight: '600', color: COLORS.textSub },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardFooter: { gap: 4, marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  noMoreText: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 20 },
  navBar: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: COLORS.surfaceLight, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 15 },
  navItem: { alignItems: 'center', width: '30%' },
  navText: { fontSize: 11, color: '#9ca3af', marginTop: 4, fontWeight: '500' },
  fabContainer: { top: -25 },
  fab: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }
});