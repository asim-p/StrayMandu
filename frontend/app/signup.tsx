import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/authService'; 
import { db } from '../src/config/firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location'; // IMPORT LOCATION SERVICE
import StyledAlert from '../src/components/Alert';

// Theme colors
const COLORS = {
  primary: '#39E53D',
  backgroundLight: '#F5F7F6',
  surfaceLight: '#FFFFFF',
  textDark: '#121811',
  textGray: '#6B7280',
  textLightGray: '#9CA3AF',
  radioBorder: '#D1D5DB',
  googleBorder: '#E5E7EB',
};

// --- Custom Component for User Type Selection ---
interface UserTypeSelectorProps {
    selectedType: 'volunteer' | 'organization';
    onSelect: (type: 'volunteer' | 'organization') => void;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ selectedType, onSelect }) => (
    <View style={typeStyles.selectorContainer}>
        <Text style={styles.label}>Sign up as</Text>
        <View style={typeStyles.optionsWrapper}>
            <Pressable 
                style={[typeStyles.option, selectedType === 'volunteer' && typeStyles.optionActive]}
                onPress={() => onSelect('volunteer')}
            >
                <Feather name="users" size={20} color={selectedType === 'volunteer' ? COLORS.primary : COLORS.textGray} />
                <Text style={[typeStyles.optionText, selectedType === 'volunteer' && typeStyles.optionTextActive]}>Volunteer</Text>
            </Pressable>

            <Pressable 
                style={[typeStyles.option, selectedType === 'organization' && typeStyles.optionActive]}
                onPress={() => onSelect('organization')}
            >
                <MaterialIcons name="apartment" size={20} color={selectedType === 'organization' ? COLORS.primary : COLORS.textGray} />
                <Text style={[typeStyles.optionText, selectedType === 'organization' && typeStyles.optionTextActive]}>Organization</Text>
            </Pressable>
        </View>
    </View>
);

export default function Signup() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  
  // Shared Fields
  const [name, setName] = useState(''); // Acts as "Full Name" or "Org Name"
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Organization Specific Fields
  const [volunteerCount, setVolunteerCount] = useState('');
  const [orgLocation, setOrgLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // UI States
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [volCountFocused, setVolCountFocused] = useState(false);

  const [alertState, setAlertState] = useState<{
    visible: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  // --- LOCATION HANDLER ---
  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Denied', message: 'Permission to access location was denied', type: 'error' });
        setIsLocating(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setOrgLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      setAlertState({ visible: true, title: 'Location Set', message: 'Address coordinates captured successfully.', type: 'success' });
    } catch (error) {
      setAlertState({ visible: true, title: 'Error', message: 'Could not fetch location.', type: 'error' });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSignup = async (): Promise<void> => {
    // 1. Common Validation
    if (!name?.trim()) {
      setAlertState({ visible: true, title: 'Name Required', message: `Please enter your ${userType === 'organization' ? 'organization' : 'full'} name.`, type: 'warning' });
      return;
    }
    if (!email?.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setAlertState({ visible: true, title: 'Invalid Email', message: 'Please enter a valid email address.', type: 'warning' });
      return;
    }
    if (password.length < 6) {
      setAlertState({ visible: true, title: 'Password Error', message: 'Password must be at least 6 characters.', type: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      setAlertState({ visible: true, title: 'Password Error', message: 'Passwords do not match!', type: 'warning' });
      return;
    }

    // 2. Organization Specific Validation
    if (userType === 'organization') {
      if (!phoneNumber?.trim()) {
        setAlertState({ visible: true, title: 'Phone Required', message: 'Organizations must provide a phone number.', type: 'warning' });
        return;
      }
      if (!volunteerCount?.trim()) {
        setAlertState({ visible: true, title: 'Volunteer Count', message: 'Please enter the number of volunteers.', type: 'warning' });
        return;
      }
      if (!orgLocation) {
        setAlertState({ visible: true, title: 'Address Required', message: 'Please capture your organization location.', type: 'warning' });
        return;
      }
    }

    try {
      setLoading(true);
      
      // 3. Create Auth User
      const user = await authService.register(email.trim(), password);

      // 4. Store in FIRESTORE based on Type
      if (userType === 'volunteer') {
        // --- SAVE TO 'USERS' COLLECTION ---
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber?.trim() || '',
          userType: 'volunteer',
          photoURL: "",
          createdAt: new Date().toISOString(),
        });

      } else {
        // --- SAVE TO 'ORGANIZATIONS' COLLECTION ---
        await setDoc(doc(db, "organizations", user.uid), {
          uid: user.uid,
          organizationName: name.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber?.trim(), // Required for Orgs
          numberOfVolunteers: parseInt(volunteerCount) || 0,
          address: {
            latitude: orgLocation?.lat,
            longitude: orgLocation?.lng,
          },
          // Initialize stats
          monthlyRescues: 0,
          totalRescues: 0,
          
          userType: 'organization',
          photoURL: "",
          createdAt: new Date().toISOString(),
        });
      }

      setAlertState({
        visible: true,
        title: 'Welcome!',
        message: 'Account created successfully!',
        type: 'success',
      });

      setTimeout(() => {
        router.replace('/home');
      }, 1500);

    } catch (err: any) {
      console.error('Signup error:', err);
      let friendlyMessage = "Unable to create account. Please try again.";
      if (err.includes("email-already-in-use")) {
        friendlyMessage = "This email is already registered.";
      }
      setAlertState({ visible: true, title: 'Signup Failed', message: friendlyMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.backgroundLight} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { minHeight: height - 50 }]} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerLeft}>
              <View style={styles.logoCircle}><MaterialIcons name="pets" size={20} color={COLORS.primary} /></View>
              <Text style={styles.appName}>StrayMandu</Text>
            </Pressable>
          </View>

          <View style={styles.mainContainer}>
            <View style={styles.welcomeSection}>
              <Text style={styles.title}>
                {userType === 'volunteer' ? 'Join as Volunteer' : 'Register Organization'}
              </Text>
              <Text style={styles.subtitle}>
                {userType === 'volunteer' 
                  ? 'Create an account and start making a difference.' 
                  : 'Register your rescue group to coordinate efficiently.'}
              </Text>
            </View>

            <View style={styles.formContainer}>
              <UserTypeSelector selectedType={userType} onSelect={setUserType} />
                
              {/* --- Name Input --- */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{userType === 'volunteer' ? 'Full Name' : 'Organization Name'}</Text>
                <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                  <Feather name={userType === 'volunteer' ? "user" : "briefcase"} size={20} color={nameFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder={userType === 'volunteer' ? "Your Name" : "Rescue Group Name"} 
                    value={name} 
                    onChangeText={setName} 
                    onFocus={() => setNameFocused(true)} 
                    onBlur={() => setNameFocused(false)} 
                  />
                </View>
              </View>

              {/* --- Email Input --- */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="alternate-email" size={20} color={emailFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="contact@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} />
                </View>
              </View>
              
              {/* --- Phone Input --- */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number {userType === 'volunteer' ? '(Optional)' : '(Required)'}</Text>
                <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
                  <Feather name="phone" size={20} color={phoneFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="98xxxxxxxx" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" onFocus={() => setPhoneFocused(true)} onBlur={() => setPhoneFocused(false)} />
                </View>
              </View>

              {/* --- ORGANIZATION ONLY FIELDS --- */}
              {userType === 'organization' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Number of Volunteers</Text>
                    <View style={[styles.inputWrapper, volCountFocused && styles.inputWrapperFocused]}>
                      <MaterialIcons name="groups" size={20} color={volCountFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input} 
                        placeholder="e.g. 15" 
                        value={volunteerCount} 
                        onChangeText={setVolunteerCount} 
                        keyboardType="number-pad" 
                        onFocus={() => setVolCountFocused(true)} 
                        onBlur={() => setVolCountFocused(false)} 
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Permanent Address</Text>
                    <Pressable 
                      style={[styles.locationBox, orgLocation && styles.locationBoxSelected]}
                      onPress={handleGetLocation}
                    >
                      {isLocating ? (
                        <ActivityIndicator color={COLORS.primary} />
                      ) : orgLocation ? (
                        <View style={styles.locationContent}>
                          <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
                          <View>
                             <Text style={styles.locationTitle}>Location Set</Text>
                             <Text style={styles.locationSub}>Lat: {orgLocation.lat.toFixed(4)}, Lng: {orgLocation.lng.toFixed(4)}</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.locationContent}>
                          <View style={styles.mapPlaceholderIcon}>
                             <MaterialIcons name="add-location-alt" size={24} color={COLORS.textGray} />
                          </View>
                          <View>
                            <Text style={styles.locationTitle}>Tap to set location</Text>
                            <Text style={styles.locationSub}>We use your current GPS location</Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </View>
                </>
              )}

              {/* --- Password Input --- */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="lock-outline" size={20} color={passwordFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} />
                  <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={COLORS.textLightGray} />
                  </Pressable>
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                  <MaterialIcons name="lock-outline" size={20} color={confirmPasswordFocused ? COLORS.primary : COLORS.textLightGray} style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} onFocus={() => setConfirmPasswordFocused(true)} onBlur={() => setConfirmPasswordFocused(false)} />
                  <Pressable onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} style={styles.eyeIcon}>
                    <MaterialIcons name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} size={20} color={COLORS.textLightGray} />
                  </Pressable>
                </View>
              </View>

              <Pressable 
                style={({ pressed }) => [styles.signupButton, pressed && styles.buttonPressed, loading && { opacity: 0.6 }]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#121811" />
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.push('/login')}><Text style={styles.loginText}>Log in</Text></Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StyledAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onDismiss={() => setAlertState({ ...alertState, visible: false })}
      />
    </SafeAreaView>
  );
}

// --- STYLES ---

const typeStyles = StyleSheet.create({
    selectorContainer: { marginBottom: 16, gap: 8 },
    optionsWrapper: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    option: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, paddingHorizontal: 10, borderRadius: 16,
        borderWidth: 1.5, borderColor: COLORS.radioBorder, backgroundColor: COLORS.surfaceLight,
        gap: 8, elevation: 1,
    },
    optionActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(57, 229, 61, 0.1)' },
    optionText: { fontSize: 15, fontWeight: '600', color: COLORS.textGray },
    optionTextActive: { color: COLORS.textDark }
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(57, 229, 61, 0.1)', justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 20, fontWeight: '700', color: COLORS.textDark, letterSpacing: -0.5 },
  mainContainer: { flex: 1, justifyContent: 'center', maxWidth: 450, alignSelf: 'center', width: '100%' },
  welcomeSection: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textGray, textAlign: 'center', lineHeight: 20, maxWidth: '90%' },
  formContainer: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight,
    borderRadius: 16, height: 56, paddingHorizontal: 16, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: '#FFFFFF' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: COLORS.textDark, height: '100%' },
  eyeIcon: { padding: 4 },
  
  // New Location Box Styles
  locationBox: {
    height: 80, backgroundColor: '#F3F4F6', borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#D1D5DB'
  },
  locationBoxSelected: {
    backgroundColor: '#ECFDF5', borderColor: COLORS.primary, borderStyle: 'solid'
  },
  locationContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mapPlaceholderIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center'},
  locationTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textDark },
  locationSub: { fontSize: 12, color: COLORS.textGray },

  signupButton: {
    flexDirection: 'row', backgroundColor: COLORS.primary, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, elevation: 6,
  },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  signupButtonText: { fontSize: 18, fontWeight: '700', color: '#121811' },
  footer: { marginTop: 24, flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  footerText: { fontSize: 14, color: COLORS.textGray },
  loginText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textDecorationLine: 'underline' },
});