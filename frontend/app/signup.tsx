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
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/authService';
import { signOut } from 'firebase/auth';
import { auth, db } from '../src/config/firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import StyledAlert from '../src/components/Alert';

const COLORS = {
  primary: '#39E53D',
  backgroundLight: '#F5F7F6',
  surfaceLight: '#FFFFFF',
  textDark: '#121811',
  textGray: '#6B7280',
  textLightGray: '#9CA3AF',
  radioBorder: '#D1D5DB',
};

export default function Signup() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  
  const [userType, setUserType] = useState<'volunteer' | 'organization'>('volunteer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [volunteerCount, setVolunteerCount] = useState('');
  const [orgLocation, setOrgLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [alertState, setAlertState] = useState<{
    visible: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  const handleGetLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Denied', message: 'Location permission is required.', type: 'error' });
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setOrgLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    } catch (error) {
      setAlertState({ visible: true, title: 'Error', message: 'Could not fetch location.', type: 'error' });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSignup = async (): Promise<void> => {
    if (!name?.trim() || !email?.trim() || password.length < 6) {
      setAlertState({ visible: true, title: 'Missing Info', message: 'Please fill all required fields.', type: 'warning' });
      return;
    }
    if (password !== confirmPassword) {
      setAlertState({ visible: true, title: 'Error', message: 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const user = await authService.register(email.trim(), password);

      if (userType === 'volunteer') {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          userType: 'volunteer',
          createdAt: new Date().toISOString(),
        });
        await signOut(auth);
        router.replace('/login');
      } else {
        await setDoc(doc(db, "organizations", user.uid), {
          uid: user.uid,
          organizationName: name.trim(),
          email: email.trim().toLowerCase(),
          phoneNumber: phoneNumber?.trim(),
          numberOfVolunteers: parseInt(volunteerCount) || 0,
          address: { latitude: orgLocation?.lat, longitude: orgLocation?.lng },
          userType: 'organization',
          createdAt: new Date().toISOString(),
        });
        // Direct jump to OrgHome
        router.replace('/OrgHome');
      }
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Signup Failed', message: 'Registration error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { minHeight: height - 50 }]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerLeft}>
              <View style={styles.logoCircle}><MaterialIcons name="pets" size={20} color={COLORS.primary} /></View>
              <Text style={styles.appName}>StrayMandu</Text>
            </Pressable>
          </View>

          <View style={styles.mainContainer}>
            <Text style={styles.title}>{userType === 'volunteer' ? 'New Rescuer' : 'New Org'}</Text>
            
            <View style={styles.typeSelector}>
              <Pressable 
                onPress={() => setUserType('volunteer')}
                style={[styles.typeBtn, userType === 'volunteer' && styles.typeBtnActive]}
              >
                <Feather name="user" size={18} color={userType === 'volunteer' ? COLORS.primary : COLORS.textGray} />
                <Text style={[styles.typeBtnText, userType === 'volunteer' && styles.typeBtnTextActive]}>Volunteer</Text>
              </Pressable>
              <Pressable 
                onPress={() => setUserType('organization')}
                style={[styles.typeBtn, userType === 'organization' && styles.typeBtnActive]}
              >
                <MaterialIcons name="apartment" size={18} color={userType === 'organization' ? COLORS.primary : COLORS.textGray} />
                <Text style={[styles.typeBtnText, userType === 'organization' && styles.typeBtnTextActive]}>Organization</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                  <TextInput 
                    style={styles.input} 
                    value={name} 
                    onChangeText={setName} 
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <TextInput 
                    style={styles.input} 
                    value={email} 
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {userType === 'organization' && (
                <View style={styles.inputGroup}>
                   <Text style={styles.label}>Location</Text>
                   <Pressable style={[styles.locationBox, orgLocation && styles.locationBoxSelected]} onPress={handleGetLocation}>
                      <MaterialIcons name={orgLocation ? "check-circle" : "my-location"} size={20} color={orgLocation ? COLORS.primary : COLORS.textGray} />
                      <Text style={styles.locationTitle}>{orgLocation ? "Location Captured" : "Tap to Get Location"}</Text>
                   </Pressable>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <TextInput 
                    style={styles.input} 
                    secureTextEntry={!isPasswordVisible} 
                    value={password} 
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <MaterialIcons name={isPasswordVisible ? "visibility" : "visibility-off"} size={20} color={COLORS.textGray} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                  <TextInput 
                    style={styles.input} 
                    secureTextEntry={!isConfirmPasswordVisible} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                  />
                </View>
              </View>

              <Pressable style={styles.signupButton} onPress={handleSignup} disabled={loading}>
                {loading ? <ActivityIndicator color="#121811" /> : <Text style={styles.signupButtonText}>Create Account</Text>}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <StyledAlert visible={alertState.visible} title={alertState.title} message={alertState.message} type={alertState.type} onDismiss={() => setAlertState({ ...alertState, visible: false })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 30 },
  header: { paddingVertical: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(57, 229, 61, 0.1)', justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  mainContainer: { flex: 1, marginTop: 10 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textDark, marginBottom: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.radioBorder },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(57, 229, 61, 0.05)' },
  typeBtnText: { fontWeight: '600', color: COLORS.textGray },
  typeBtnTextActive: { color: COLORS.textDark },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 12, height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.radioBorder },
  inputWrapperFocused: { borderColor: COLORS.primary },
  input: { flex: 1, height: '100%' },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, backgroundColor: '#E5E7EB', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1 },
  locationBoxSelected: { backgroundColor: '#D1FAE5', borderColor: COLORS.primary, borderStyle: 'solid' },
  locationTitle: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  signupButton: { backgroundColor: COLORS.primary, height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  signupButtonText: { fontSize: 16, fontWeight: '700', color: '#121811' },
  footer: { marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontWeight: '700', color: COLORS.primary }
});