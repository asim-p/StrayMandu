import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard // Import Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { auth } from '../src/config/firebase';
import * as Location from 'expo-location'; // Import Location for Geocoding

// Services
import LocationPicker, { LocationData } from '../src/components/LocationPicker';
import { uploadToCloudinary } from '../src/services/cloudinaryService';
import { saveDogReport, DogReportData } from '../src/services/reportService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  primary: '#37ec13', 
  primaryDark: '#2ed60e',
  backgroundLight: '#f6f8f6',
  surface: '#FFFFFF',
  textDark: '#121811',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  emergencyBg: '#FEF2F2',
  emergencyText: '#B91C1C',
  border: '#E5E7EB',
};

export default function ReportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<LocationData | null>(null);

  // --- Form State ---
  const [emergency, setEmergency] = useState(false);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Unknown'>('Unknown');
  const [color, setColor] = useState('');
  const [condition, setCondition] = useState<'Neutral' | 'Healthy' | 'Cruelty' |'Injured' | 'Aggressive' | 'Unknown'>('Unknown');
  const [characteristics, setCharacteristics] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // --- Search Logic ---
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    Keyboard.dismiss();

    try {
      const geocodedLocation = await Location.geocodeAsync(searchQuery);

      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];
        // This triggers the LocationPicker to move via props
        setSearchedLocation({ latitude, longitude });
        setLocation({ latitude, longitude }); // Also update form data immediately
      } else {
        Alert.alert('Not found', 'Could not find that location.');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // --- Image Logic ---
  const handleImagePick = () => {
    Alert.alert(
      'Upload Photo',
      'Choose a source',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setSelectedImages(prev => [...prev, result.assets[0].uri]);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setSelectedImages(prev => [...prev, result.assets[0].uri]);
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- Submission Logic ---
  const handleSubmit = async () => {
    if (!location) return Alert.alert('Location Missing', 'Please pick a location on the map.');
    if (!breed.trim()) return Alert.alert('Missing Info', 'Please specify a breed.');
    if (selectedImages.length === 0) return Alert.alert('Photo Required', 'Please upload a photo.');

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Auth Error', 'Please log in.');
        return;
      }

      const uploadPromises = selectedImages.map(uri => uploadToCloudinary(uri));
      const uploadedUrls = await Promise.all(uploadPromises);

      const reportData: DogReportData = {
        reporterId: currentUser.uid,
        emergency,
        name: name.trim() || undefined,
        breed: breed.trim(),
        location: { latitude: location.latitude, longitude: location.longitude },
        gender,
        color: color.trim(),
        characteristics: characteristics.trim(),
        condition,
        description: description.trim(),
        imageUrls: uploadedUrls,
        status: 'pending'
      };

      await saveDogReport(reportData);
      Alert.alert('Success', 'Report submitted!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const GenderCard = ({ type, icon, selected }: any) => (
    <Pressable 
      onPress={() => setGender(type)}
      style={[
        styles.genderCard, 
        selected && styles.genderCardSelected,
        selected && type === 'Male' ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' } : {},
        selected && type === 'Female' ? { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' } : {},
        selected && type === 'Unknown' ? { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' } : {},
      ]}
    >
      <MaterialIcons 
        name={icon} 
        size={24} 
        color={selected ? (type === 'Male' ? '#3B82F6' : type === 'Female' ? '#EC4899' : COLORS.primary) : COLORS.textLight} 
      />
      <Text style={[
        styles.genderText, 
        selected && { 
          color: type === 'Male' ? '#2563EB' : type === 'Female' ? '#DB2777' : '#15803D',
          fontWeight: '700'
        }
      ]}>
        {type}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.mainContainer}>
      
      {/* 1. HERO MAP SECTION */}
      <View style={styles.mapContainer}>
        {/* Pass searchedLocation to LocationPicker to trigger animation */}
        <LocationPicker 
          onLocationPicked={setLocation} 
          incomingLocation={searchedLocation}
        />
        
        {/* Gradient Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Report a Stray</Text>
            <View style={{ width: 40 }} /> 
          </View>
        </LinearGradient>

        {/* --- SEARCH BAR --- */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={COLORS.textGray} />
            <TextInput
              placeholder="Search location (e.g. Patan)"
              placeholderTextColor={COLORS.textGray}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
        </View>

        {/* Floating Pinpoint Label (Only show if not set yet, or just for visual flair) */}
        {!location && (
          <View style={styles.centerPinContainer}>
             <View style={styles.pulseCircle} />
             <View style={styles.pinIconBg}>
               <MaterialIcons name="pets" size={24} color="#fff" />
             </View>
             <View style={styles.pinLabel}>
               <Text style={styles.pinLabelText}>Pinpoint Location</Text>
             </View>
          </View>
        )}
      </View>

      {/* 2. FORM CONTENT */}
      <View style={styles.bottomSheetContainer}>
        <View style={styles.handleBarContainer}>
          <View style={styles.handleBar} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sheetTitle}>Dog Details</Text>
              <Text style={styles.sheetSubtitle}>Help us identify the stray dog.</Text>
            </View>

            {/* Emergency Alert Box */}
            <View style={styles.emergencyBox}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="emergency" size={18} color={COLORS.emergencyText} />
                  <Text style={styles.emergencyLabel}>Emergency?</Text>
                </View>
                <Text style={styles.emergencyHint}>Critical injury or immediate danger?</Text>
              </View>
              
              <View style={styles.switchContainer}>
                <Pressable 
                  onPress={() => setEmergency(false)}
                  style={[styles.switchBtn, !emergency && styles.switchBtnActive]}
                >
                  <Text style={[styles.switchText, !emergency && styles.switchTextActive]}>No</Text>
                </Pressable>
                <Pressable 
                  onPress={() => setEmergency(true)}
                  style={[styles.switchBtn, emergency && styles.switchBtnDanger]}
                >
                  <Text style={[styles.switchText, emergency && { color: '#fff' }]}>Yes</Text>
                </Pressable>
              </View>
            </View>

            {/* Form Fields... (Identical to previous) */}
            <View style={styles.rowGrid}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Name <Text style={styles.labelHint}>(if known)</Text></Text>
                <TextInput style={styles.inputField} placeholder="e.g. Bhunte" value={name} onChangeText={setName} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Breed</Text>
                <TextInput style={styles.inputField} placeholder="e.g. Mixed" value={breed} onChangeText={setBreed} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.rowGrid}>
                <GenderCard type="Male" icon="male" selected={gender === 'Male'} />
                <GenderCard type="Female" icon="female" selected={gender === 'Female'} />
                <GenderCard type="Unknown" icon="help-outline" selected={gender === 'Unknown'} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Color</Text>
              <TextInput style={styles.inputField} placeholder="e.g. Black with brown paws" value={color} onChangeText={setColor} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Characteristics</Text>
              <TextInput style={styles.inputField} placeholder="e.g. Limping, Collared" value={characteristics} onChangeText={setCharacteristics} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Condition</Text>
              <View style={styles.chipContainer}>
                {['Neutral', 'Healthy', 'Injured', 'Cruelty', 'Aggressive', 'Unknown'].map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCondition(c as any)}
                    style={[styles.chip, condition === c && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, condition === c && styles.chipTextSelected]}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dog Description</Text>
              <View style={{ position: 'relative' }}>
                <TextInput 
                  style={[styles.inputField, styles.textArea]} 
                  multiline 
                  placeholder="Describe size, visible injuries or unique marks..." 
                  value={description}
                  onChangeText={setDescription}
                />
                <MaterialIcons name="edit" size={18} color={COLORS.textLight} style={styles.textAreaIcon} />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Upload Photo</Text>
              <View style={styles.rowGrid}>
                <Pressable style={styles.photoAddBtn} onPress={handleImagePick}>
                  <View style={styles.photoIconCircle}>
                    <MaterialIcons name="add-a-photo" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.photoAddText}>Add Photo</Text>
                </Pressable>

                {selectedImages.map((uri, idx) => (
                  <View key={idx} style={styles.photoPreviewWrapper}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <Pressable style={styles.photoRemove} onPress={() => removeImage(idx)}>
                      <MaterialIcons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={{ height: 100 }} />
          </ScrollView>

          <LinearGradient
            colors={['rgba(246,248,246,0)', COLORS.backgroundLight]}
            style={styles.bottomGradient}
          >
            <Pressable 
              style={({pressed}) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                 <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Report</Text>
                </>
              )}
            </Pressable>
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  // --- Map Section ---
  mapContainer: {
    height: SCREEN_HEIGHT * 0.45, 
    width: '100%',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120, // Increased height to cover search bar area slightly if needed
    paddingTop: 48, 
    paddingHorizontal: 16,
    zIndex: 10,
    pointerEvents: 'box-none' // Allows touching through the transparent parts
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16, // Space between header and search bar
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },
  // --- Search Bar Styles ---
  searchBarContainer: {
    position: 'absolute',
    top: 100, // Positioned below the header
    left: 16,
    right: 16,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textDark,
  },
  
  // Center Pin
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -40 }], // Adjusted for map center
    alignItems: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  pulseCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
    position: 'absolute',
    top: 20,
  },
  pinIconBg: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    marginBottom: 8,
  },
  pinLabel: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  // --- Bottom Sheet (Unchanged mostly) ---
  bottomSheetContainer: {
    flex: 1,
    marginTop: -24, 
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
  },
  emergencyBox: {
    backgroundColor: COLORS.emergencyBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  emergencyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.emergencyText,
  },
  emergencyHint: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
    opacity: 0.8,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  switchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  switchBtnActive: {
    backgroundColor: '#F3F4F6',
  },
  switchBtnDanger: {
    backgroundColor: '#EF4444',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGray,
  },
  switchTextActive: {
    color: COLORS.textDark,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 4,
    marginBottom: 6,
  },
  labelHint: {
    fontWeight: '400',
    color: '#9CA3AF',
    fontSize: 10,
  },
  inputField: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 4,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genderCardSelected: {},
  genderText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGray,
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  chipTextSelected: {
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  textAreaIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  photoAddBtn: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(55, 236, 19, 0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(55, 236, 19, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(55, 236, 19, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoAddText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoPreviewWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    padding: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingTop: 40,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});