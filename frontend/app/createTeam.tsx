import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, 
  ScrollView, StatusBar, Modal, KeyboardAvoidingView, Platform, 
  TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- FIREBASE IMPORTS ---
// Ensure these paths match your project structure
import { db, auth } from '../src/config/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DESIGN = {
  primary: '#37ec13',
  bgLight: '#f6f8f6',
  textMain: '#121811',
  textSub: '#688961',
  white: '#FFFFFF',
  danger: '#FF4444',
  border: '#E8EBE8'
};

const FOCUS_OPTIONS = [
  { id: 'rescue', label: 'Rescue', icon: 'bus-side' as const },
  { id: 'medical', label: 'Medical', icon: 'medical-bag' as const },
  { id: 'fire', label: 'Fire-Safe', icon: 'fire' as const },
  { id: 'food', label: 'Logistics', icon: 'truck-delivery' as const },
  { id: 'other', label: 'Other', icon: 'dots-horizontal' as const },
];

export default function CreateTeam() {
  const router = useRouter();
  
  // Form States
  const [teamName, setTeamName] = useState('');
  const [teamFocus, setTeamFocus] = useState('rescue');
  const [members, setMembers] = useState<{name: string, phone: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // --- LOGIC: ADD MEMBER TO LOCAL LIST ---
  const handleAddMember = () => {
    if (newName.trim() && newPhone.trim()) {
      setMembers([...members, { name: newName.trim(), phone: newPhone.trim() }]);
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);
      Keyboard.dismiss();
    } else {
      Alert.alert("Error", "Please fill in both name and phone number.");
    }
  };

  // --- LOGIC: SAVE TO FIREBASE ---
  // --- LOGIC: SAVE TO FIREBASE ---
  const handleCreateTeam = async () => {
    // 1. Validation
    if (!teamName.trim()) return Alert.alert("Missing Info", "Team name is required.");
    
    // Filter out empty rows (where user clicked add but didn't type)
    const validMembers = members.filter(m => m.name.trim() !== "" && m.phone.trim() !== "");
    
    if (validMembers.length === 0) return Alert.alert("Missing Members", "Add at least one member.");

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You must be logged in to create a team.");

      // 2. Prepare Data
      const teamData = {
        name: teamName.trim(),
        focus: teamFocus,
        members: validMembers, // Stores array of {name, phone}
        orgId: user.uid,       // Links to the Organization
        createdAt: serverTimestamp(),
        status: 'active'
      };

      // 3. Write to Firestore 'teams' collection
      await addDoc(collection(db, "teams"), teamData);
      
      Alert.alert("Success", "Team created successfully!", [
        { text: "Done", onPress: () => router.back() } // Go back to list
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Failed to create team", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={DESIGN.textMain} />
        </Pressable>
        <Text style={styles.headerTitle}>Create New Team</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* TEAM NAME */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. Kathmandu Rescue Unit"
            placeholderTextColor="#999"
            value={teamName}
            onChangeText={setTeamName}
          />
        </View>

        {/* TEAM FOCUS PICKER */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Team Focus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.focusScroll}>
            {FOCUS_OPTIONS.map((item) => (
              <Pressable 
                key={item.id} 
                onPress={() => setTeamFocus(item.id)}
                style={[styles.focusCard, teamFocus === item.id && styles.focusCardActive]}
              >
                <View style={[styles.focusIconCircle, teamFocus === item.id && styles.focusIconCircleActive]}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={24} 
                    color={teamFocus === item.id ? '#000' : DESIGN.textSub} 
                  />
                </View>
                <Text style={[styles.focusText, teamFocus === item.id && styles.focusTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* MEMBER SECTION */}
        <View style={styles.inputGroup}>
          <View style={styles.memberHeader}>
            <Text style={styles.label}>Team Members</Text>
            <Text style={styles.memberCount}>{members.length} added</Text>
          </View>
          
          <Pressable style={styles.addPlaceholder} onPress={() => setShowAddModal(true)}>
            <View style={styles.addCircle}>
              <MaterialIcons name="person-add" size={24} color={DESIGN.primary} />
            </View>
            <Text style={styles.addPlaceholderText}>Add a team member</Text>
          </Pressable>

          <View style={styles.memberList}>
            {members.map((m, idx) => (
              <View key={idx} style={styles.memberRow}>
                <View style={styles.avatar}><MaterialIcons name="person" size={20} color={DESIGN.textSub} /></View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberPhone}>{m.phone}</Text>
                </View>
                <Pressable onPress={() => setMembers(members.filter((_, i) => i !== idx))}>
                  <MaterialIcons name="remove-circle" size={24} color={DESIGN.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ADD MEMBER MODAL */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Member</Text>
                  <Pressable onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                    <MaterialIcons name="close" size={24} color={DESIGN.textMain} />
                  </Pressable>
                </View>
                
                <Text style={styles.modalLabel}>Full Name</Text>
                <TextInput style={styles.modalInput} placeholder="Name" value={newName} onChangeText={setNewName} />
                
                <Text style={styles.modalLabel}>Phone Number</Text>
                <TextInput style={styles.modalInput} placeholder="98XXXXXXXX" keyboardType="phone-pad" value={newPhone} onChangeText={setNewPhone} />
                
                <Pressable style={styles.confirmBtn} onPress={handleAddMember}>
                  <Text style={styles.confirmBtnText}>Add to List</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FOOTER BUTTON */}
      <View style={styles.footer}>
        <Pressable 
          style={[styles.createBtn, { opacity: (teamName && members.length > 0 && !loading) ? 1 : 0.6 }]}
          onPress={handleCreateTeam}
          disabled={loading || !teamName || members.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <>
              <Text style={styles.createBtnText}>Create Team</Text>
              <MaterialIcons name="check-circle" size={20} color="black" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.bgLight },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: DESIGN.white, borderBottomWidth: 1, borderBottomColor: DESIGN.border },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  iconBtn: { padding: 4 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  inputGroup: { marginBottom: 28 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: DESIGN.textMain },
  input: { height: 56, backgroundColor: DESIGN.white, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, elevation: 1 },
  
  focusScroll: { paddingRight: 20 },
  focusCard: { width: 90, height: 100, backgroundColor: DESIGN.white, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1.5, borderColor: DESIGN.border },
  focusCardActive: { borderColor: DESIGN.primary, backgroundColor: '#37ec1308' },
  focusIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f7f5', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  focusIconCircleActive: { backgroundColor: DESIGN.primary },
  focusText: { fontSize: 12, fontWeight: '700', color: DESIGN.textSub },
  focusTextActive: { color: DESIGN.textMain },

  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  memberCount: { fontSize: 13, color: DESIGN.primary, fontWeight: '700' },
  addPlaceholder: { flexDirection: 'row', alignItems: 'center', backgroundColor: DESIGN.white, padding: 14, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: DESIGN.primary },
  addCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#37ec1315', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  addPlaceholderText: { fontSize: 15, fontWeight: '700' },
  memberList: { marginTop: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: DESIGN.white, padding: 12, borderRadius: 16, marginBottom: 10, elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f4f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700' },
  memberPhone: { fontSize: 13, color: DESIGN.textSub },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%' },
  modalContent: { backgroundColor: DESIGN.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { backgroundColor: '#f5f5f5', padding: 8, borderRadius: 20 },
  modalLabel: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  modalInput: { height: 54, backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, fontSize: 16, borderWidth: 1, borderColor: DESIGN.border },
  confirmBtn: { backgroundColor: DESIGN.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontWeight: '800', fontSize: 16 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: DESIGN.bgLight, borderTopWidth: 1, borderTopColor: DESIGN.border },
  createBtn: { backgroundColor: DESIGN.primary, height: 58, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  createBtnText: { fontSize: 18, fontWeight: '800' }
});