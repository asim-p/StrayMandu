import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Firebase Imports
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Types
import { DogReportData } from '../src/services/reportService';

const { width } = Dimensions.get('window');

interface UserProfile {
  name: string;
  photoURL?: string;
  phoneNumber?: string;
}

const COLORS = {
  primary: '#39E53D',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  red: '#EF4444',
  cardBorder: '#F3F4F6',
  gray: '#9CA3AF',
  disabled: '#E5E7EB'
};

const mapStyle = [
  { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 100 }, { "visibility": "simplified" }] }
];

export default function OrgDetailViews() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DogReportData | null>(null);
  const [reporterUser, setReporterUser] = useState<UserProfile | null>(null);
  
  // Organization Management State
  const [isClaimed, setIsClaimed] = useState(false);
  const [orgStatus, setOrgStatus] = useState('Pending'); // Pending, In Progress, Rescued
  const [assignedTeam, setAssignedTeam] = useState('Unassigned');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        
        const docRef = doc(db, 'reports', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = docSnap.data() as DogReportData;
          setReport(reportData);

          // Check if this report is already claimed (You would likely store this in DB)
          // For demo, we assume if 'claimedBy' field exists, it is claimed
          if (reportData.claimedBy) {
            setIsClaimed(true);
            setOrgStatus(reportData.orgStatus || 'In Progress');
            setAssignedTeam(reportData.assignedTeam || 'Team Alpha');
          }

          if (reportData.reporterId) {
            const userRef = doc(db, 'users', reportData.reporterId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setReporterUser(userSnap.data() as UserProfile);
            }
          }
        } else {
          Alert.alert("Not Found", "This report no longer exists.");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id]);

  // --- ACTIONS ---

  const handleTakeResponsibility = async () => {
    Alert.alert(
      "Confirm Rescue",
      "By taking responsibility, you confirm your organization is deploying resources for this dog. This will lock other orgs from claiming it.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              setSaving(true);
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              // Update Firebase
              const reportRef = doc(db, 'reports', id as string);
              await updateDoc(reportRef, {
                claimedBy: currentUser.uid,
                orgStatus: 'In Progress',
                assignedTeam: 'Unassigned',
                status: 'Rescue In Progress' // Update public status
              });

              // Update Local State
              setIsClaimed(true);
              setOrgStatus('In Progress');
              Alert.alert("Success", "You have taken responsibility for this case.");
            } catch (err) {
              Alert.alert("Error", "Failed to update status.");
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleChangeStatus = () => {
    if (!isClaimed) return;
    Alert.alert("Update Status", "Select current rescue status:", [
      { text: "In Progress", onPress: () => setOrgStatus("In Progress") },
      { text: "Rescued / Medical Care", onPress: () => setOrgStatus("Medical Care") },
      { text: "Resolved / Adopted", onPress: () => setOrgStatus("Resolved") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const handleAssignTeam = () => {
    if (!isClaimed) return;
    Alert.alert("Assign Team", "Select a response team:", [
      { text: "Team Alpha (Van 1)", onPress: () => setAssignedTeam("Team Alpha") },
      { text: "Team Bravo (Bike Unit)", onPress: () => setAssignedTeam("Team Bravo") },
      { text: "Medical Unit", onPress: () => setAssignedTeam("Medical Unit") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const openInExternalMaps = () => {
    if (!report) return;
    const { latitude, longitude } = report.location;
    const label = report.name || "Stray Dog";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`
    });
    if (url) Linking.openURL(url);
  };

  if (loading || !report) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Org View</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Carousel */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageCarousel}>
          {report.imageUrls && report.imageUrls.length > 0 ? (
            report.imageUrls.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.heroImage} />
            ))
          ) : (
            <View style={[styles.heroImage, styles.placeholderImg]}>
               <MaterialIcons name="pets" size={60} color="#ccc" />
            </View>
          )}
        </ScrollView>

        <View style={styles.mainContainer}>
          
          {/* Header Info */}
          <View style={styles.titleRow}>
            <View style={styles.nameHeader}>
              <Text style={styles.dogName}>{report.name || 'Unnamed Dog'}</Text>
              {report.emergency && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalText}>URGENT</Text>
                </View>
              )}
            </View>
            {/* Condition Tags */}
            <View style={styles.miniTagRow}>
              <View style={[styles.miniTag, report.condition === 'Injured' && styles.injuredTag]}>
                <Text style={report.condition === 'Injured' ? styles.injuredTagText : styles.tagText}>{report.condition}</Text>
              </View>
              <Text style={styles.metaText}>{report.breed} • {report.gender}</Text>
            </View>
          </View>

          {/* --------------------------------------------------------- */}
          {/* INTERNAL MANAGEMENT SECTION                   */}
          {/* --------------------------------------------------------- */}
          <View style={styles.managementSection}>
            <View style={styles.mgmtHeader}>
              <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.primary} />
              <Text style={styles.mgmtTitle}>Internal Management</Text>
            </View>

            {/* Controls (Greyed out if not claimed) */}
            <View style={[styles.controlGrid, !isClaimed && styles.disabledArea]}>
              
              {/* Status Selector */}
              <Pressable style={styles.controlBox} onPress={handleChangeStatus} disabled={!isClaimed}>
                <Text style={styles.controlLabel}>CURRENT STATUS</Text>
                <View style={styles.controlValueRow}>
                  <Text style={styles.controlValue}>{orgStatus}</Text>
                  <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSub} />
                </View>
              </Pressable>

              {/* Team Selector */}
              <Pressable style={styles.controlBox} onPress={handleAssignTeam} disabled={!isClaimed}>
                <Text style={styles.controlLabel}>ASSIGNED TEAM</Text>
                <View style={styles.controlValueRow}>
                  <Text style={styles.controlValue}>{assignedTeam}</Text>
                  <MaterialIcons name="group-add" size={20} color={COLORS.textSub} />
                </View>
              </Pressable>
            </View>

            {/* Take Responsibility Button */}
            {!isClaimed ? (
              <Pressable 
                style={({ pressed }) => [styles.claimButton, pressed && { opacity: 0.9 }]} 
                onPress={handleTakeResponsibility}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.textMain} />
                ) : (
                  <>
                    <MaterialIcons name="shield" size={20} color={COLORS.textMain} style={{ marginRight: 8 }} />
                    <Text style={styles.claimButtonText}>Take Responsibility</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <View style={styles.activeFooter}>
                 <Text style={styles.activeText}>Case managed by your organization</Text>
                 <Pressable style={styles.saveIcon}>
                    <MaterialIcons name="save" size={24} color={COLORS.primary} />
                 </Pressable>
              </View>
            )}
            
            {!isClaimed && (
               <Text style={styles.disclaimerText}>
                 * Unlocks team assignment and status updates. Prevents other orgs from interfering.
               </Text>
            )}
          </View>
          {/* --------------------------------------------------------- */}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Pressable style={styles.directionBtn} onPress={openInExternalMaps}>
                <Text style={styles.directionText}>Navigate</Text>
                <MaterialIcons name="turn-right" size={16} color={COLORS.primary} />
              </Pressable>
            </View>
            
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: report.location.latitude,
                  longitude: report.location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                customMapStyle={mapStyle}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={report.location} />
              </MapView>
            </View>
            <Text style={styles.addressTitle}>{report.location.address || "Unknown Address"}</Text>
          </View>

          {/* Reporter Info */}
          <View style={styles.reporterCard}>
            <View style={styles.reporterInfo}>
              {reporterUser?.photoURL ? (
                <Image source={{ uri: reporterUser.photoURL }} style={styles.avatarCircle} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: COLORS.textSub }]}>
                  <MaterialIcons name="person" size={24} color={COLORS.white} />
                </View>
              )}
              <View>
                <Text style={styles.reporterLabel}>REPORTED BY</Text>
                <Text style={styles.reporterName}>
                  {reporterUser?.name || 'Anonymous User'}
                </Text>
              </View>
            </View>
            <Pressable 
              style={styles.callButton} 
              onPress={() => reporterUser?.phoneNumber && Linking.openURL(`tel:${reporterUser.phoneNumber}`)}
            >
              <MaterialIcons name="call" size={20} color={COLORS.primary} />
            </Pressable>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  
  scrollContent: { paddingBottom: 60 },
  imageCarousel: { height: 300 },
  heroImage: { width: width - 32, height: 280, borderRadius: 24, marginHorizontal: 16, marginTop: 10 },
  placeholderImg: { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
  
  mainContainer: { paddingHorizontal: 20, marginTop: -20, backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  
  titleRow: { marginTop: 20, marginBottom: 20 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dogName: { fontSize: 26, fontWeight: '900', color: COLORS.textMain },
  criticalBadge: { backgroundColor: COLORS.red, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  criticalText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  miniTagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  miniTag: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  injuredTag: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  injuredTagText: { color: COLORS.red, fontSize: 11, fontWeight: '800' },
  tagText: { color: COLORS.textMain, fontSize: 11, fontWeight: '600' },
  metaText: { color: COLORS.textSub, fontSize: 13, fontWeight: '500' },

  // --- MANAGEMENT SECTION STYLES ---
  managementSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  mgmtHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  mgmtTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  
  controlGrid: { gap: 12 },
  disabledArea: { opacity: 0.4 }, 
  
  controlBox: {
    backgroundColor: COLORS.backgroundLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  controlLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSub, marginBottom: 4 },
  controlValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlValue: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  
  claimButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary, // Changed to GREEN
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  claimButtonText: { color: COLORS.textMain, fontSize: 14, fontWeight: '800' }, // Changed text to DARK for contrast
  
  activeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  activeText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  saveIcon: { padding: 4 },
  disclaimerText: { fontSize: 10, color: COLORS.textSub, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  // ---------------------------------

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  descriptionText: { fontSize: 14, color: COLORS.textMain, lineHeight: 22 },
  
  locationSection: { marginBottom: 24 },
  directionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  directionText: { color: COLORS.primary, fontWeight: '800', fontSize: 12 },
  mapContainer: { height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: COLORS.cardBorder },
  addressTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  
  reporterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  reporterLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textSub },
  reporterName: { fontSize: 13, fontWeight: '700', color: COLORS.textMain },
  callButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#37ec1315', justifyContent: 'center', alignItems: 'center' },
});