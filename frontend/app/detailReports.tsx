import React from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13',
  backgroundLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#5c6f57',
  white: '#FFFFFF',
  red: '#EF4444',
  cardBorder: '#F3F4F6',
};

export default function ReportDetail() {
  const router = useRouter();

  // Mock data for the specific report
  const report = {
    id: '402',
    name: 'Buddy',
    status: 'CRITICAL',
    time: '2 hours ago',
    description: 'Found near the temple entrance early this morning. The dog seems to be limping on the left hind leg and appears dehydrated. He is very friendly but scared of loud noises.',
    images: [
      { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCreINL86vxmKH6NYaXDPY7Mllwg_sT-G9JWOvxqgTQaoEfWc1ieA3tv9djL4_HDBDSo5uUSIyhh5MJ_Sb2AMYowDoEwsAN3aVXB-jIp0SFJOeBLTV_yOojobC-f2k3DP2KXSfVPEWfJdpbdospR0SzNeOdE7rceTxBroZd1nEv6FqCmNI0V0k1UvU7zyggH_XRHyajYoH2orqMA4MfQG-6N3Atfs5jAC9sKLpsbqMFbZe09nMGUrVTioyR7FMiJEg7OTwY5YK5aa0' },
      { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD66RXvbnqltCZJZnTnYF78_IQeujJJ88OE8I2gNlMmTqVFoYFLnkOxeDZhLRJBIqvi91ex_ePqhdrJ2ZiJDiIT0tRTUFrAEzEP4wOKeUhDmGJod03pYsUyN0785A6mn6DMKgOJIgOI5-y1U8Hx6j7sCblsZiksk2GAx9BLoQ0lTlWHxXGwpeu7UqiKjH9oUXb8YnglJV9wHlGE5rnKqNrFzK-i6HtINZhtdbpeHkEB9ybeoxGY52Y2_LBhE68xTjUvM3f7WnI9DqM' }
    ],
    reporter: {
      name: 'Aayush S.',
      avatar: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBMzS0tNfRksiGFaINfll8CHBpYm-IroSuxFVQgxLW8KY2h3VCPp6rTGngSTf9dHPmhsCnmR55OrW0KpZNFMdy6WppyDj7ZJWKt95TPL8JnsSje2E1i8p0BdJPccvHhJKZvad5UhoQsWmAG__K5IFQrZZaxkqv66TP1R60zJNpbRHo-sRIIueb33bKMNiAE8RrJ77Es4_H3itzQaI92-O6tu1v5Uoi4vPEwKrdSxkFKUdcH5n1zt6TKpbBfpD5fHODHzIbO07K4RQ' }
    },
    location: {
      title: 'Near Garden of Dreams',
      address: 'Thamel Marg, Kathmandu 44600',
      mapPreview: { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZIUT2YAlTOnYAePziK3O5mEAkEHu3elN3yrgCSi-T7ibXTcnJmvzHhPks6ZxpWzGBOzJzbh6ObWi0C7uEwPuV1KJRl4yZnsYofEdbnqF0t_koIYSHolet73jRbJGAyox7e19bBTZLajUonZ1tPi3eLdKNjcg4W1im8uUKLD5mmqhbjatm5A9dJ7AeJ7NztFcAt0Ih0bxG7KTc6J4KJ4tQrrGhPgeJW-uVRU358nlqDuHJciRDaO2_93snhJQieDQLBU12TeHNnHI' }
    }
  };

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
          <MaterialIcons name="more-vert" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Image Carousel (Snap Effect) */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {report.images.map((img, index) => (
            <Image key={index} source={img} style={styles.heroImage} />
          ))}
        </ScrollView>

        <View style={styles.mainContainer}>
          {/* Title and Badge */}
          <View style={styles.titleRow}>
            <View>
              <View style={styles.nameHeader}>
                <Text style={styles.dogName}>{report.name}</Text>
                <View style={styles.criticalBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.criticalText}>{report.status}</Text>
                </View>
              </View>
              <Text style={styles.reportId}>#{report.id}</Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <MaterialIcons name="schedule" size={16} color={COLORS.textSub} />
            <Text style={styles.timeText}>Reported {report.time}</Text>
          </View>

          {/* Tag Row */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, styles.injuredTag]}>
              <MaterialIcons name="medical-services" size={14} color={COLORS.red} />
              <Text style={styles.injuredTagText}>Injured</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Mixed Breed</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Male</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>

          {/* Reporter Card */}
          <View style={styles.reporterCard}>
            <View style={styles.reporterInfo}>
              <Image source={report.reporter.avatar} style={styles.reporterAvatar} />
              <View>
                <Text style={styles.reporterLabel}>REPORTED BY</Text>
                <Text style={styles.reporterName}>{report.reporter.name}</Text>
              </View>
            </View>
            <Pressable style={styles.callButton}>
              <MaterialIcons name="call" size={20} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Location Card */}
          <View style={styles.locationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Pressable style={styles.directionBtn}>
                <Text style={styles.directionText}>Get Directions</Text>
                <MaterialIcons name="arrow-forward" size={14} color={COLORS.primary} />
              </Pressable>
            </View>
            
            <View style={styles.mapContainer}>
              <Image source={report.location.mapPreview} style={styles.mapImage} />
              <View style={styles.mapPin}>
                <View style={styles.pinOuter}>
                  <View style={styles.pinInner} />
                </View>
              </View>
            </View>

            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
              <View>
                <Text style={styles.addressTitle}>{report.location.title}</Text>
                <Text style={styles.addressSub}>{report.location.address}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Fixed Action Button */}
      <View style={styles.footerAction}>
         <Pressable style={styles.respondButton}>
            <Text style={styles.respondButtonText}>Respond to Report</Text>
         </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.backgroundLight 
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  imageCarousel: { height: 400 },
  heroImage: { width: width - 32, height: 380, borderRadius: 24, marginHorizontal: 16 },
  mainContainer: { paddingHorizontal: 20, marginTop: -20, backgroundColor: COLORS.backgroundLight, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  nameHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  dogName: { fontSize: 32, fontWeight: '900', color: COLORS.textMain },
  reportId: { fontSize: 18, fontWeight: '700', color: COLORS.textSub, marginTop: -4 },
  criticalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.white },
  criticalText: { color: COLORS.white, fontSize: 12, fontWeight: '900' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  timeText: { fontSize: 14, color: COLORS.textSub, fontWeight: '600' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder },
  tagText: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
  injuredTag: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', flexDirection: 'row', alignItems: 'center', gap: 4 },
  injuredTagText: { color: COLORS.red, fontWeight: '800', fontSize: 13 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
  descriptionText: { fontSize: 15, color: COLORS.textMain, lineHeight: 24, fontWeight: '500' },
  reporterCard: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: COLORS.white, padding: 16, borderRadius: 20, marginTop: 24,
    borderWidth: 1, borderColor: COLORS.cardBorder
  },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reporterAvatar: { width: 48, height: 48, borderRadius: 24 },
  reporterLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSub, letterSpacing: 1 },
  reporterName: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#37ec1320', justifyContent: 'center', alignItems: 'center' },
  locationSection: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  directionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  directionText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  mapContainer: { height: 160, borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  mapImage: { width: '100%', height: '100%', opacity: 0.8 },
  mapPin: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pinOuter: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#37ec1340', justifyContent: 'center', alignItems: 'center' },
  pinInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white },
  addressRow: { flexDirection: 'row', gap: 12 },
  addressTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
  addressSub: { fontSize: 14, color: COLORS.textSub, fontWeight: '500' },
  footerAction: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  respondButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', elevation: 5 },
  respondButtonText: { fontSize: 16, fontWeight: '900', color: COLORS.textMain },
});