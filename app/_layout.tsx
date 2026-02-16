import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [bugModalVisible, setBugModalVisible] = useState(false);
  const [bugReport, setBugReport] = useState('');
  const [sendingBug, setSendingBug] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Als er geen gebruiker is, stuur ze naar login (optioneel, afhankelijk van je flow)
        // router.replace('/login'); 
      } else {
        // De gedwongen check op onboardingComplete is hier verwijderd.
        // De gebruiker mag nu vrij navigeren naar de tabs.
      }
    });
    return unsubscribe;
  }, []);

  const sendBugReport = async () => {
    if (!bugReport.trim()) return;
    setSendingBug(true);
    try {
      await addDoc(collection(db, "bugs"), {
        userId: auth.currentUser?.uid || 'anon',
        message: bugReport,
        page: pathname,
        createdAt: serverTimestamp(),
      });
      setBugReport('');
      setBugModalVisible(false);
      Alert.alert("Bedankt!", "Bug gemeld.");
    } catch (e) {
      Alert.alert("Fout", "Mislukt.");
    } finally {
      setSendingBug(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      
      {/* Zwevende Bug Button */}
      <TouchableOpacity style={styles.bugBtn} onPress={() => setBugModalVisible(true)}>
        <Ionicons name="bug" size={24} color="white" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent={true} visible={bugModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Bug melden 🐞</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Wat gaat er mis?" 
              multiline 
              value={bugReport} 
              onChangeText={setBugReport} 
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancel} onPress={() => setBugModalVisible(false)}>
                <Text>Annuleer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.send} onPress={sendBugReport} disabled={sendingBug}>
                {sendingBug ? <ActivityIndicator color="white" /> : <Text style={{color: 'white'}}>Verstuur</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bugBtn: { position: 'absolute', top: 60, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: '#64748B', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBody: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 10 },
  send: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10 },
});