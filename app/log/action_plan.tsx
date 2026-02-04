import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function ActionPlan() {
  const router = useRouter();
  const [userValues, setUserValues] = useState<{id: string, name: string}[]>([]);
  
  // Form State gebaseerd op de kolommen in je foto's
  const [selectedVal, setSelectedVal] = useState('');
  const [goal, setGoal] = useState('');
  const [barriers, setBarriers] = useState('');
  const [strategy, setStrategy] = useState('');
  const [support, setSupport] = useState('');

  useEffect(() => {
    fetchValues();
  }, []);

  const fetchValues = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDocs(collection(db, "users", user.uid, "tree"));
    setUserValues(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
  };

  const saveActionPlan = async () => {
    const user = auth.currentUser;
    if (!user || !goal) return Alert.alert("Fout", "Vul tenminste een doel in.");

    try {
      await addDoc(collection(db, "users", user.uid, "action_plans"), {
        createdAt: new Date().toISOString(),
        value: selectedVal,
        goal: goal,
        barriers: barriers,
        strategy: strategy,
        support: support,
        status: 'actief'
      });
      router.back();
    } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Nieuw Actieplan</Text>

        {/* Waarde Selectie (Kolom 1) */}
        <Text style={styles.label}>Op welke waarde is dit gebaseerd?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.valueRow}>
          {userValues.map(v => (
            <TouchableOpacity 
              key={v.id} 
              style={[styles.valueChip, selectedVal === v.name && styles.selectedChip]}
              onPress={() => setSelectedVal(v.name)}
            >
              <Text style={selectedVal === v.name ? styles.whiteText : styles.darkText}>{v.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Doel (Kolom 2) */}
        <Text style={styles.label}>Wat is je doel? Wat hoop je te bereiken?</Text>
        <TextInput style={styles.input} value={goal} onChangeText={setGoal} placeholder="Mijn doel is..." multiline />

        {/* Obstakels (Kolom 3) */}
        <Text style={styles.label}>Welke obstakels (gedachten/gevoelens) komen erbij kijken?</Text>
        <TextInput style={[styles.input, {height: 80}]} value={barriers} onChangeText={setBarriers} placeholder="Bijv: Angst, tijdsgebrek..." multiline />

        {/* Actie & Strategie (Kolom 4) */}
        <Text style={styles.label}>Actie & Strategie: Wat ga je doen op korte/lange termijn?</Text>
        <TextInput style={[styles.input, {height: 80}]} value={strategy} onChangeText={setStrategy} placeholder="Mijn plan is..." multiline />

        <TouchableOpacity style={styles.saveBtn} onPress={saveActionPlan}>
          <Text style={styles.saveBtnText}>Plan Opslaan</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 15, marginBottom: 5 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', textAlignVertical: 'top' },
  valueRow: { flexDirection: 'row', marginBottom: 10 },
  valueChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E2E8F0', marginRight: 8 },
  selectedChip: { backgroundColor: '#27AE60' },
  whiteText: { color: 'white', fontWeight: 'bold' },
  darkText: { color: '#1E293B' },
  saveBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});