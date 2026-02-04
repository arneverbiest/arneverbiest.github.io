import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { VALUE_QUESTIONS } from '../src/constants/questions';

export default function OnboardingScreen() {
  const router = useRouter();
  const [isManual, setIsManual] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Unieke lijst van alle waarden uit onze dataset halen
  const allAvailableValues = Array.from(new Set(VALUE_QUESTIONS.map(q => q.value))).sort();

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      setSelectedValues(prev => prev.filter(item => item !== val));
    } else {
      setSelectedValues(prev => [...prev, val]);
    }
  };

  const saveManualSelection = async () => {
    if (selectedValues.length < 7) {
      Alert.alert("Keuze vereist", `Selecteer nog minimaal ${7 - selectedValues.length} waarden om door te gaan.`);
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      selectedValues.forEach(val => {
        const id = val.toLowerCase().replace(/\s/g, '_');
        const docRef = doc(db, "users", user.uid, "tree", id);
        batch.set(docRef, {
          name: val,
          level: 1,
          xp: 0,
          category: VALUE_QUESTIONS.find(q => q.value === val)?.cat || "ZELF",
          lastFed: new Date().toISOString()
        });
      });
      await batch.commit();
      router.replace('/tree');
    } catch (e) {
      console.error(e);
      Alert.alert("Fout", "Kon waarden niet opslaan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  if (isManual) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kies jouw fundament</Text>
        <Text style={styles.subtitle}>Selecteer minimaal 7 waarden ({selectedValues.length} geselecteerd)</Text>
        
        <ScrollView contentContainerStyle={styles.chipContainer}>
          {allAvailableValues.map(val => {
            const isSelected = selectedValues.includes(val);
            return (
              <TouchableOpacity 
                key={val} 
                style={[styles.chip, isSelected && styles.chipSelected]} 
                onPress={() => toggleValue(val)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setIsManual(false)}>
            <Text>Terug</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveBtn, selectedValues.length < 7 && styles.btnDisabled]} 
            onPress={saveManualSelection}
          >
            <Text style={styles.saveBtnText}>Start mijn tuin</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.welcomeHero}>
        <Text style={styles.heroTitle}>Welkom bij je Innerlijke Tuin</Text>
        <Text style={styles.heroDesc}>Hoe wil je jouw waarden ontdekken?</Text>
      </View>

      <View style={styles.choiceContainer}>
        <TouchableOpacity style={styles.choiceCard} onPress={() => router.push('/quiz')}>
          <Text style={styles.icon}>🧠</Text>
          <Text style={styles.choiceTitle}>Doe de Waarden-Quiz</Text>
          <Text style={styles.choiceDesc}>Ontdek via 60 vragen welke behoeften en waarden echt bij je passen.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.choiceCard} onPress={() => setIsManual(true)}>
          <Text style={styles.icon}>🌿</Text>
          <Text style={styles.choiceTitle}>Zelf Selecteren</Text>
          <Text style={styles.choiceDesc}>Kies handmatig de waarden die jij op dit moment belangrijk vindt.</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeHero: { marginTop: 60, marginBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  heroDesc: { fontSize: 16, color: '#64748B', marginTop: 10 },
  choiceContainer: { gap: 20 },
  choiceCard: { backgroundColor: 'white', padding: 25, borderRadius: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  icon: { fontSize: 40, marginBottom: 15 },
  choiceTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  choiceDesc: { fontSize: 14, color: '#64748B', marginTop: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#64748B', marginBottom: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingBottom: 100 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
  chipSelected: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  chipText: { color: '#475569', fontWeight: '500' },
  chipTextSelected: { color: 'white' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  backBtn: { flex: 1, padding: 18, alignItems: 'center', borderRadius: 15 },
  saveBtn: { flex: 2, backgroundColor: '#27AE60', padding: 18, borderRadius: 15, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#CBD5E1' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});