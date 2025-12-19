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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Firebase Imports
import { db } from '../src/config/firebase'; 
import { doc, getDoc } from 'firebase/firestore';

// Types
import { DogReportData } from '../src/services/reportService';

const { width } = Dimensions.get('window');

interface UserProfile {
  username: string;
  profileImage?: string;
  phoneNumber?: string;
}

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  red: '#EF4444',
  cardBorder: '#F3F4F6',
};

const mapStyle = [
  { "featureType": "poi", "elementType": "labels.text", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "lightness": 100 }, { "visibility": "simplified" }] }
];

export default function ReportDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DogReportData | null>(null);
  const [reporterUser, setReporterUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        
        // 1. Fetch the Report
        const docRef = doc(db, 'reports', id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = docSnap.data() as DogReportData;
          setReport(reportData);

          // 2. Fetch the Reporter's Profile from 'users' collection
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
        Alert.alert("Error", "Could not connect to the database.");
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [id]);

  const openInExternalMaps = () => {
    if (!report) return;
    const { latitude, longitude } = report.location;
    const label = report.name || "Stray Dog Location";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) Linking.openURL(url);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSub }}>Loading details...</Text>
      </View>
    );
  }

  if (!report) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Report Details</Text>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="share" size={22} color={COLORS.textMain} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Carousel */}
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
          {/* Title and Status */}
          <View style={styles.titleRow}>
            <View style={styles.nameHeader}>
              <Text style={styles.dogName}>{report.name || 'Unnamed Dog'}</Text>
              {report.emergency && (
                <View style={styles.criticalBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.criticalText}>EMERGENCY</Text>
                </View>
              )}
            </View>
            <Text style={styles.reportStatus}>Status: {report.status.toUpperCase()}</Text>
          </View>

          {/* Tag Row */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, report.condition === 'Injured' && styles.injuredTag]}>
              <MaterialIcons 
                name={report.condition === 'Injured' ? "medical-services" : "info"} 
                size={14} 
                color={report.condition === 'Injured' ? COLORS.red : COLORS.textSub} 
              />
              <Text style={report.condition === 'Injured' ? styles.injuredTagText : styles.tagText}>
                {report.condition}
              </Text>
            </View>
            <View style={styles.tag}><Text style={styles.tagText}>{report.breed}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{report.gender}</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>{report.color}</Text></View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>

          {/* Location Section */}
          <View style={styles.locationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Pressable style={styles.directionBtn} onPress={openInExternalMaps}>
                <Text style={styles.directionText}>Open Maps</Text>
                <MaterialIcons name="directions" size={16} color={COLORS.primary} />
              </Pressable>
            </View>
            
            <Pressable style={styles.mapContainer} onPress={openInExternalMaps}>
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
                <Marker coordinate={{ latitude: report.location.latitude, longitude: report.location.longitude }}>
                  <View style={styles.markerContainer}>
                    <View style={[styles.markerBubble, report.emergency ? { backgroundColor: COLORS.red } : { backgroundColor: COLORS.primary }]}>
                      <MaterialIcons name="pets" size={18} color="#FFF" />
                    </View>
                    <View style={[styles.markerArrow, report.emergency ? { borderTopColor: COLORS.red } : { borderTopColor: COLORS.primary }]} />
                  </View>
                </Marker>
              </MapView>
            </Pressable>

            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={24} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressTitle}>{report.location.address || "Street Location"}</Text>
                <Text style={styles.addressSub}>
                  Coordinates: {report.location.latitude.toFixed(5)}, {report.location.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </View>

          {/* Reported By Card - DYNAMIC */}
          <View style={styles.reporterCard}>
            <View style={styles.reporterInfo}>
              {reporterUser?.profileImage ? (
                <Image source={{ uri: reporterUser.profileImage }} style={styles.avatarCircle} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: COLORS.textSub }]}>
                  <MaterialIcons name="person" size={24} color={COLORS.white} />
                </View>
              )}
              <View>
                <Text style={styles.reporterLabel}>REPORTED BY</Text>
                <Text style={styles.reporterName}>
                  {reporterUser?.username || `User_${report.reporterId.substring(0, 6)}`}
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
      
      {/* Footer */}
      {/* <View style={styles.footerAction}>
         <Pressable 
          style={[styles.respondButton, report.status === 'resolved' && {backgroundColor: '#ccc'}]}
          disabled={report.status === 'resolved'}
          onPress={() => Alert.alert("Confirm", "Are you heading to help this dog?")}
         >
            <Text style={styles.respondButtonText}>
              {report.status === 'resolved' ? "Case Resolved" : "I can help this dog"}
            </Text>
         </Pressable>
      </View> */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  scrollContent: { paddingBottom: 110 },
  imageCarousel: { height: 380 },
  heroImage: { width: width - 32, height: 360, borderRadius: 24, marginHorizontal: 16, marginTop: 10 },
  placeholderImg: { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
  mainContainer: { paddingHorizontal: 20, marginTop: -20, backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  dogName: { fontSize: 28, fontWeight: '900', color: COLORS.textMain },
  reportStatus: { fontSize: 13, fontWeight: '700', color: COLORS.textSub, marginTop: 4 },
  criticalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  criticalText: { color: COLORS.white, fontSize: 10, fontWeight: '900' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
  injuredTag: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  injuredTagText: { color: COLORS.red, fontWeight: '800' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
  descriptionText: { fontSize: 15, color: COLORS.textMain, lineHeight: 22 },
  locationSection: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  directionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  directionText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  mapContainer: { height: 180, borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder },
  markerContainer: { alignItems: 'center' },
  markerBubble: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', elevation: 4 },
  markerArrow: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  addressRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  addressTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  addressSub: { fontSize: 13, color: COLORS.textSub, marginTop: 2 },
  reporterCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginTop: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.cardBorder },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  reporterLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textSub, letterSpacing: 0.5 },
  reporterName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#37ec1320', justifyContent: 'center', alignItems: 'center' },
  footerAction: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  respondButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', elevation: 4 },
  respondButtonText: { fontSize: 16, fontWeight: '900', color: COLORS.textMain },
});