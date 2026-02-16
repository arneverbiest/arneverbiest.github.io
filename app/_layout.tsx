import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, TextInput, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { doc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Platform } from 'react-native';

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [bugModalVisible, setBugModalVisible] = useState(false);
  const [sosModalVisible, setSosModalVisible] = useState(false);
  const [bugReport, setBugReport] = useState('');
  const [sendingBug, setSendingBug] = useState(false);
  const [emergencyPlan, setEmergencyPlan] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubPlan = onSnapshot(doc(db, "users", user.uid, "settings", "actionPlan"), (docSnap) => {
          if (docSnap.exists()) {
            setEmergencyPlan(docSnap.data());
          }
        });
        return () => unsubPlan();
      }
    });
    return unsubscribe;
  }, []);

  // DE KLIK-LOGICA VOOR DE SOS MODAL
  const handleSosStepPress = (s: string) => {
    const step = s.toLowerCase();
    
    // Sluit de modal voordat we navigeren voor een soepele ervaring
    setSosModalVisible(false);

    if (s.includes('📞')) {
      const contact = emergencyPlan?.contacts?.find((c: any) => s.includes(c.name));
      if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
    } 
    else if (step.includes('ademhaling')) router.push('../Relax/breathe');
    else if (step.includes('body scan')) router.push('../Relax/bodyscan');
    else if (step.includes('rots en water')) router.push('../Relax/rockwater');
    else if (step.includes('wandeling')) router.push('../Relax/silentwalk');
    else if (step.includes('grounding') || step.includes('5-4-3-2-1')) router.push('../Relax/grounding');
    else if (step.includes('safe haven')) router.push('../Relax/safehaven');
    else if (step.includes('urge surfing')) router.push('../Relax/urgesurf');
  };

  const sendBugReport = async () => {
    if (!bugReport.trim()) return;
    setSendingBug(true);
    try {
      await addDoc(collection(db, "bugs"), {
        userId: auth.currentUser?.uid || 'anon',
        userEmail: auth.currentUser?.email || 'Anoniem', // Belangrijk voor je admin lijst
        description: bugReport, // Veranderd van 'message' naar 'description'
        platform: Platform.OS,
        page: pathname,
        status: 'open', // Belangrijk: voorkomt de toUpperCase() crash!
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
      
      {/* Zwevende Knoppen Rechtsboven */}
      <View style={styles.headerButtons} pointerEvents="box-none">
        <TouchableOpacity style={styles.sosBtn} onPress={() => setSosModalVisible(true)}>
          <Text style={{ fontSize: 20 }}>🚨</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bugBtn} onPress={() => setBugModalVisible(true)}>
          <Ionicons name="bug" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* SOS MODAL MET KLIKBARE ACTIES */}
      <Modal animationType="fade" transparent visible={sosModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.sosModalBody}>
            <Text style={styles.modalTitle}>Noodplan 🚨</Text>
            <ScrollView style={{ maxHeight: 450 }}>
              {emergencyPlan?.copingOrder?.length > 0 ? (
                emergencyPlan.copingOrder.map((step: string, i: number) => (
                  <TouchableOpacity 
                    key={i} 
                    style={styles.sosStepRow} 
                    onPress={() => handleSosStepPress(step)}
                  >
                    <Text style={styles.sosStepText}>{i + 1}. {step}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity onPress={() => { setSosModalVisible(false); router.push('/log/plan'); }}>
                  <Text style={styles.noPlanText}>Nog geen noodplan. Klik hier om er een te maken.</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSosModalVisible(false)}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Sluiten</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BUG MODAL */}
      <Modal animationType="slide" transparent visible={bugModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Bug melden 🐞</Text>
            <TextInput style={styles.input} placeholder="Wat gaat er mis?" multiline value={bugReport} onChangeText={setBugReport} />
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancel} onPress={() => setBugModalVisible(false)}><Text>Annuleer</Text></TouchableOpacity>
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
  headerButtons: { position: 'absolute', top: 60, right: 20, flexDirection: 'row', gap: 12, zIndex: 9999 },
  sosBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  bugBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#64748B', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
  modalBody: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  sosModalBody: { backgroundColor: 'white', borderRadius: 25, padding: 20, borderTopWidth: 10, borderTopColor: '#EF4444' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sosStepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sosStepText: { fontSize: 17, fontWeight: '600', color: '#1E293B', flex: 1 },
  noPlanText: { color: '#3B82F6', textAlign: 'center', padding: 30, fontSize: 16 },
  closeBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  input: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 10 },
  send: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10 },
});