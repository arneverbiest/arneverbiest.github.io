import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, TextInput, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { doc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
        // Haal live het noodplan op voor de SOS-knop
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
      
      {/* Container voor knoppen rechtsboven */}
      <View style={styles.headerButtons} pointerEvents="box-none">
        <TouchableOpacity style={styles.sosBtn} onPress={() => setSosModalVisible(true)}>
          <Text style={{ fontSize: 20 }}>🚨</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bugBtn} onPress={() => setBugModalVisible(true)}>
          <Ionicons name="bug" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* SOS MODAL (BEKIJK MODUS) */}
      <Modal animationType="fade" transparent visible={sosModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.sosModalBody}>
            <Text style={styles.modalTitle}>Noodplan 🚨</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {emergencyPlan?.copingOrder?.length > 0 ? (
                emergencyPlan.copingOrder.map((step: string, i: number) => {
                  const isPhone = step.startsWith('📞');
                  return (
                    <TouchableOpacity 
                      key={i} 
                      disabled={!isPhone}
                      style={styles.sosStepRow}
                      onPress={() => {
                        if (isPhone) {
                          const contact = emergencyPlan.contacts?.find((c: any) => step.includes(c.name));
                          if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
                        }
                      }}
                    >
                      <Text style={[styles.sosStepText, isPhone && { color: '#007AFF' }]}>{i + 1}. {step}</Text>
                      {isPhone && <Ionicons name="call" size={20} color="#007AFF" />}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <TouchableOpacity onPress={() => { setSosModalVisible(false); router.push('/log/plan'); }}>
                  <Text style={styles.noPlanText}>Nog geen noodplan. Tik hier om er een te maken.</Text>
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
  headerButtons: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 9999,
  },
  sosBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#EF4444', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5 
  },
  bugBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#64748B', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5 
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  modalBody: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  sosModalBody: { backgroundColor: 'white', borderRadius: 25, padding: 20, borderTopWidth: 8, borderTopColor: '#EF4444' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  sosStepRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sosStepText: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  noPlanText: { color: '#3B82F6', textAlign: 'center', padding: 20 },
  closeBtn: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  input: { backgroundColor: '#F1F5F9', borderRadius: 10, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 10 },
  send: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10 },
});