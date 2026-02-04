import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Check of deze import goed staat
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function FiveGEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Destructure parameters met fallback
  const editId = params.editId as string;
  const prefilledEvent = params.prefilledEvent as string;
  const prefilledFeeling = params.prefilledFeeling as string;

  const [gedachte, setGedachte] = useState('');
  const [gedrag, setGedrag] = useState('');
  const [gevolg, setGevolg] = useState('');
  const [helpend, setHelpend] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    // 1. Validatie check
    if (!gedachte || !gedrag || !gevolg) {
      Alert.alert("Incomplete analyse", "Vul de gedachte, het gedrag en het gevolg in.");
      return;
    }

    const user = auth.currentUser;
    
    // 2. ID check (als dit leeg is, gebeurt er niets)
    if (!user || !editId) {
      console.error("Missing User or EditId:", { user: !!user, editId });
      Alert.alert("Fout", "Sessie verlopen of ongeldig ID.");
      return;
    }

    setLoading(true);
    try {
      const logRef = doc(db, "users", user.uid, "logbookEntries", editId);
      
      await updateDoc(logRef, {
        gedachte: gedachte,
        gedrag: gedrag,
        gevolg: gevolg,
        helpend: helpend,
        type: '5G_Deep',
        updatedAt: serverTimestamp() 
      });

      // 3. NAVIGATIE FIX: We navigeren direct, de Alert is alleen ter info
      console.log("Update succesvol, navigeren naar logboek...");
      
      // Forceer navigatie
      router.dismissAll(); // Sluit eventuele modals
      router.push('/insight/Logbook'); 
      
    } catch (e) {
      console.error("Firestore Update Error:", e);
      Alert.alert("Fout", "Kon de wijzigingen niet opslaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F0F4F8'}}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 60}}>
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A2E44" />
          </TouchableOpacity>
          <Text style={styles.header}>Analyse Voltooien</Text>
        </View>

        <View style={styles.referenceCard}>
          <Text style={styles.refTitle}>📌 Terugblik op je notitie:</Text>
          <View style={styles.refSection}>
            <Text style={styles.refLabel}>GEBEURTENIS</Text>
            <Text style={styles.refValue}>{prefilledEvent || "Laden..."}</Text>
          </View>
          <View style={styles.refSection}>
            <Text style={styles.refLabel}>GEVOEL</Text>
            <Text style={styles.refValue}>{prefilledFeeling || "Laden..."}</Text>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldTitle}>2. Gedachte</Text>
          <TextInput style={styles.input} multiline value={gedachte} onChangeText={setGedachte} placeholder="Wat dacht je?" />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldTitle}>4. Gedrag</Text>
          <TextInput style={styles.input} multiline value={gedrag} onChangeText={setGedrag} placeholder="Wat deed je?" />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldTitle}>5. Gevolg</Text>
          <TextInput style={styles.input} multiline value={gevolg} onChangeText={setGevolg} placeholder="Wat was het resultaat?" />
        </View>

        <View style={styles.specialField}>
          <Text style={styles.specialTitle}>✨ Helpende Gedachte</Text>
          <TextInput style={styles.input} multiline value={helpend} onChangeText={setHelpend} placeholder="Helpende gedachte..." />
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Opslaan en Voltooien</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ... styles blijven hetzelfde als in het vorige bericht
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  backBtn: { marginRight: 15 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#1A2E44' },
  referenceCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#007AFF' },
  refTitle: { fontSize: 14, fontWeight: 'bold', color: '#7F8C8D', marginBottom: 15 },
  refSection: { marginBottom: 10 },
  refLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1 },
  refValue: { fontSize: 16, color: '#2C3E50', marginTop: 2 },
  fieldContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  fieldTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
  input: { fontSize: 15, textAlignVertical: 'top', minHeight: 60, color: '#2C3E50' },
  specialField: { backgroundColor: '#E8F6F3', padding: 15, borderRadius: 15, marginBottom: 25, borderWidth: 1, borderColor: '#1ABC9C' },
  specialTitle: { fontSize: 16, fontWeight: 'bold', color: '#16A085', marginBottom: 5 },
  saveBtn: { backgroundColor: '#007AFF', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});