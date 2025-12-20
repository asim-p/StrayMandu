import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, ScrollView, Image, Pressable,
  StatusBar, Dimensions, ActivityIndicator, Alert, Platform, Linking, Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Firebase Imports
import { auth, db } from '../src/config/firebase'; 
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Types & Services
import { DogReportData } from '../src/services/reportService';
import { notificationService } from '../src/services/notificationService';

const { width } = Dimensions.get('window');

interface Team {
  id: string;
  name: string;
  focus: string;
  members: any[];
}

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
  locked: '#64748b', 
  lockedBg: '#f1f5f9'
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
  const [isClaimedByOther, setIsClaimedByOther] = useState(false);
  const [claimingOrgName, setClaimingOrgName] = useState('Loading...'); // Default while fetching
  const [claimingOrgImage, setClaimingOrgImage] = useState<string | null>(null); // Organization's profile image
  
  const [currentStatus, setCurrentStatus] = useState('pending'); 
  const [assignedTeam, setAssignedTeam] = useState('Unassigned');
  const [saving, setSaving] = useState(false);

  // Team Selection State
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        
        // 1. Fetch Report
        const docRef = doc(db, 'reports', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = docSnap.data() as DogReportData;
          setReport(reportData);
          
          setCurrentStatus(reportData.status || 'pending');
          setAssignedTeam(reportData.assignedTeam || 'Unassigned');

          // --- LOGIC: Handle Claims & Fetch Rescuer Info ---
          if (reportData.rescuerID) {
            setIsClaimed(true);

            // Check if it is MY organization
            if (currentUser && reportData.rescuerID === currentUser.uid) {
              // It's me - do nothing special
              setIsClaimedByOther(false);
            } else {
              // It is ANOTHER organization -> FETCH THEIR DETAILS
              setIsClaimedByOther(true);
              
              try {
                // Use the rescuerID to look up the organization in 'users'
                const rescuerRef = doc(db, 'users', reportData.rescuerID);
                const rescuerSnap = await getDoc(rescuerRef);

                if (rescuerSnap.exists()) {
                  const rescuerData = rescuerSnap.data();
                  // Fallback: Check 'name', then 'orgName', then default
                  setClaimingOrgName(rescuerData.name || rescuerData.orgName || 'Unknown Organization');
                  // Fetch the organization's profile image
                  setClaimingOrgImage(rescuerData.photoURL || null);
                } else {
                  setClaimingOrgName('Unknown Organization');
                  setClaimingOrgImage(null);
                }
              } catch (err) {
                console.error("Error fetching rescuer details:", err);
                setClaimingOrgName('Network Error');
                setClaimingOrgImage(null);
              }
            }
          }

          // Fetch Reporter Info (The user who posted the dog)
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
      "By taking responsibility, you lock this case. Your organization's name will be visible to others.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              setSaving(true);
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const reportRef = doc(db, 'reports', id as string);
              
              // We just save the ID and status. 
              // The UI will fetch our name automatically next time using the logic above.
              await updateDoc(reportRef, {
                rescuerID: currentUser.uid,
                status: 'acknowledged',
                assignedTeam: 'Unassigned',
              });

              setIsClaimed(true);
              setCurrentStatus('acknowledged');
              Alert.alert("Success", "You have claimed this case.");
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

  const fetchOrgTeams = async () => {
    if (isClaimedByOther) return;
    const user = auth.currentUser;
    if (!user) return;
    if (teams.length > 0) {
      setShowTeamModal(true);
      return;
    }
    try {
      setLoadingTeams(true);
      const q = query(collection(db, 'teams'), where('orgId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const teamList: Team[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamList);
      setShowTeamModal(true);
    } catch (error) {
      Alert.alert("Error", "Could not load teams.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSelectTeam = async (team: Team) => {
    try {
      setSaving(true);
      setShowTeamModal(false);
      const reportRef = doc(db, 'reports', id as string);
      await updateDoc(reportRef, { assignedTeam: team.name, assignedTeamId: team.id });
      setAssignedTeam(team.name);
    } catch (error) {
      Alert.alert("Error", "Failed to assign team.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangeStatus = () => {
    if (!isClaimed || isClaimedByOther) return;
    Alert.alert("Update Status", "Select current rescue status:", [
      { text: "Acknowledged", onPress: () => updateStatusDB("acknowledged") },
      { text: "Ongoing (Rescue in progress)", onPress: () => updateStatusDB("ongoing") },
      { text: "Resolved (Rescued/Treated)", onPress: () => updateStatusDB("resolved") },
      { text: "Completed (Closed case)", onPress: () => updateStatusDB("completed") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const updateStatusDB = async (newStatus: string) => {
     try {
        const currentUser = auth.currentUser;
        const reportRef = doc(db, 'reports', id as string);
        
        // Update the report status in Firebase
        await updateDoc(reportRef, { status: newStatus });
        setCurrentStatus(newStatus);

        // Create a notification for the user who reported the dog
        if (report && report.reporterId) {
          await notificationService.sendNotification(
            report.reporterId,
            `${report.name || 'Stray Dog'} Status Update`,
            `${claimingOrgName || 'An organization'} updated the status to: ${newStatus}`,
            'assignment_turned_in',
            {
              reportId: id as string,
              dogName: report.name || 'Unknown Dog',
              breed: report.breed || 'Unknown Breed',
              newStatus: newStatus,
              orgName: claimingOrgName || 'Organization'
            }
          );
        }

        Alert.alert("Success", `Status updated to ${newStatus}`);
     } catch (e) { 
        Alert.alert("Error", "Failed to update status");
        console.error(e);
     }
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return '#F59E0B'; 
      case 'ongoing': return '#3B82F6'; 
      case 'resolved': return '#10B981'; 
      case 'completed': return '#6B7280'; 
      default: return COLORS.textMain;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Org View</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
          <View style={styles.titleRow}>
            <View style={styles.nameHeader}>
              <Text style={styles.dogName}>{report.name || 'Unnamed Dog'}</Text>
              {report.emergency && (
                <View style={styles.criticalBadge}>
                  <Text style={styles.criticalText}>URGENT</Text>
                </View>
              )}
            </View>
            <View style={styles.miniTagRow}>
              <View style={[styles.miniTag, report.condition === 'Injured' && styles.injuredTag]}>
                <Text style={report.condition === 'Injured' ? styles.injuredTagText : styles.tagText}>{report.condition}</Text>
              </View>
              <Text style={styles.metaText}>{report.breed} • {report.gender}</Text>
            </View>
          </View>

          {/* MANAGEMENT SECTION (Dynamic Logic) */}
          {isClaimedByOther ? (
             <View style={styles.lockedSection}>
                <View style={styles.lockedHeader}>
                   <MaterialIcons name="lock" size={24} color={COLORS.locked} />
                   <Text style={styles.lockedTitle}>CASE LOCKED</Text>
                </View>
                <Text style={styles.lockedText}>This report is handled by:</Text>
                
                {/* Organization Profile Image */}
                {claimingOrgImage ? (
                  <Image 
                    source={{ uri: claimingOrgImage }} 
                    style={styles.claimingOrgImage}
                  />
                ) : (
                  <View style={[styles.claimingOrgImage, { backgroundColor: COLORS.textSub, justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialIcons name="domain" size={40} color={COLORS.white} />
                  </View>
                )}
                
                {/* Dynamically Fetched Name */}
                <Text style={styles.claimingOrgName}>{claimingOrgName}</Text>
                
                <View style={styles.lockedFooter}>
                   <Text style={styles.lockedFooterText}>You cannot perform actions on this case.</Text>
                </View>
             </View>
          ) : (
             <View style={styles.managementSection}>
               <View style={styles.mgmtHeader}>
                 <MaterialIcons name="admin-panel-settings" size={20} color={COLORS.primary} />
                 <Text style={styles.mgmtTitle}>Internal Management</Text>
               </View>

               <View style={[styles.controlGrid, !isClaimed && styles.disabledArea]}>
                 <Pressable style={styles.controlBox} onPress={handleChangeStatus} disabled={!isClaimed}>
                   <Text style={styles.controlLabel}>CURRENT STATUS</Text>
                   <View style={styles.controlValueRow}>
                     <Text style={[styles.controlValue, { color: getStatusColor(currentStatus), textTransform: 'capitalize' }]}>
                       {currentStatus}
                     </Text>
                     <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSub} />
                   </View>
                 </Pressable>

                 <Pressable style={styles.controlBox} onPress={fetchOrgTeams} disabled={!isClaimed}>
                   <Text style={styles.controlLabel}>ASSIGNED TEAM</Text>
                   <View style={styles.controlValueRow}>
                     <Text style={styles.controlValue}>{assignedTeam}</Text>
                     {loadingTeams ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                     ) : (
                        <MaterialIcons name="group-add" size={20} color={COLORS.textSub} />
                     )}
                   </View>
                 </Pressable>
               </View>

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
                    <Text style={styles.activeText}>Managed by your organization</Text>
                    <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
                 </View>
               )}
             </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>

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
                <Text style={styles.reporterName}>{reporterUser?.name || 'Anonymous User'}</Text>
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

      {/* --- TEAM SELECTION MODAL --- */}
      <Modal visible={showTeamModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTeamModal(false)}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Select Response Team</Text>
               <Pressable onPress={() => setShowTeamModal(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textMain} />
               </Pressable>
             </View>

             {teams.length === 0 ? (
               <View style={styles.emptyTeams}>
                  <Text>No teams found. Go to 'Manage Teams' to create one.</Text>
               </View>
             ) : (
               teams.map((team) => (
                 <Pressable 
                    key={team.id} 
                    style={styles.teamOption} 
                    onPress={() => handleSelectTeam(team)}
                 >
                    <View style={styles.teamIconBox}>
                        <MaterialIcons name="groups" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{flex:1}}>
                        <Text style={styles.teamOptionName}>{team.name}</Text>
                        <Text style={styles.teamOptionMeta}>{team.members?.length || 0} Members • {team.focus}</Text>
                    </View>
                    {assignedTeam === team.name && (
                       <MaterialIcons name="check" size={24} color={COLORS.primary} />
                    )}
                 </Pressable>
               ))
             )}
          </View>
        </Pressable>
      </Modal>

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

  managementSection: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, marginBottom: 20 },
  mgmtHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  mgmtTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  controlGrid: { gap: 12 },
  disabledArea: { opacity: 0.5 }, 
  controlBox: { backgroundColor: COLORS.backgroundLight, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  controlLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSub, marginBottom: 4 },
  controlValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlValue: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  claimButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  claimButtonText: { color: COLORS.textMain, fontSize: 14, fontWeight: '800' },
  activeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  activeText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },

  lockedSection: { backgroundColor: COLORS.lockedBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, alignItems: 'center' },
  lockedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  lockedTitle: { color: COLORS.locked, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  lockedText: { color: COLORS.textSub, fontSize: 14, marginBottom: 12 },
  claimingOrgImage: { width: 80, height: 80, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: COLORS.cardBorder },
  claimingOrgName: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginBottom: 10, textAlign: 'center' },
  lockedFooter: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%', alignItems: 'center', paddingTop: 10 },
  lockedFooterText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  teamOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder },
  teamIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  teamOptionName: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  teamOptionMeta: { fontSize: 12, color: COLORS.textSub },
  emptyTeams: { padding: 20, alignItems: 'center' }
});