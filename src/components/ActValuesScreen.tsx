// src/components/ActValuesScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We gebruiken een nieuwe key om conflicten met oude, kapotte data te voorkomen
const VALUES_STORAGE_KEY = 'ACT_VALUES_FINAL_VERSION';

interface ValueItem {
  id: string;
  title: string;
  description: string;
}

const ActValuesScreen: React.FC = () => {
  const [values, setValues] = useState<ValueItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Laad de waarden zodra het scherm start
  useEffect(() => {
    loadValues();
  }, []);

  const loadValues = async () => {
    try {
      const stored = await AsyncStorage.getItem(VALUES_STORAGE_KEY);
      if (stored !== null) {
        setValues(JSON.parse(stored));
        console.log("Data geladen:", JSON.parse(stored));
      }
    } catch (e) {
      console.error("Fout bij laden:", e);
    }
  };

  const addValue = async () => {
    // Check of er iets is ingevuld
    if (newTitle.trim() === '') {
      Alert.alert("Oeps", "Vul minimaal een titel in.");
      return;
    }

    const newItem: ValueItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDesc.trim(),
    };

    try {
      // 1. Maak de nieuwe lijst
      const updatedValues = [...values, newItem];
      
      // 2. Update de UI (State)
      setValues(updatedValues);
      
      // 3. Sla op in AsyncStorage
      await AsyncStorage.setItem(VALUES_STORAGE_KEY, JSON.stringify(updatedValues));
      
      console.log("Nieuwe waarde toegevoegd:", newItem);

      // 4. Reset het formulier
      setNewTitle('');
      setNewDesc('');
      setIsAdding(false);
    } catch (e) {
      console.error("Opslaan mislukt:", e);
      Alert.alert("Fout", "Kon de waarde niet opslaan.");
    }
  };

  const deleteValue = async (id: string) => {
    const performDelete = async () => {
      try {
        const updatedValues = values.filter(v => v.id !== id);
        setValues(updatedValues);
        await AsyncStorage.setItem(VALUES_STORAGE_KEY, JSON.stringify(updatedValues));
      } catch (e) {
        console.error("Verwijderen mislukt:", e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Deze waarde verwijderen?")) {
        await performDelete();
      }
    } else {
      Alert.alert("Verwijderen", "Weet je het zeker?", [
        { text: "Annuleer", style: "cancel" },
        { text: "Verwijder", style: "destructive", onPress: performDelete }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.header}>Mijn Kompas 🧭</Text>
          <Text style={styles.subHeader}>Wat geeft jouw leven betekenis?</Text>
        </View>

        {/* LIJST MET KAARTEN */}
        <View style={styles.valuesGrid}>
          {values.length === 0 && !isAdding && (
            <Text style={styles.emptyText}>Nog geen waarden toegevoegd. Begin met je eerste!</Text>
          )}
          
          {values.map((item) => (
            <View key={item.id} style={styles.valueCard}>
              <TouchableOpacity 
                style={styles.deleteBadge} 
                onPress={() => deleteValue(item.id)}
              >
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.valueTitle}>{item.title}</Text>
              <Text style={styles.valueDesc}>{item.description}</Text>
            </View>
          ))}
        </View>

        {/* FORMULIER */}
        {isAdding ? (
          <View style={styles.addCard}>
            <Text style={styles.inputLabel}>Titel van je waarde</Text>
            <TextInput
              style={styles.inputTitle}
              placeholder="bv. Familie of Gezondheid"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Text style={styles.inputLabel}>Omschrijving</Text>
            <TextInput
              style={styles.inputDesc}
              placeholder="Waarom is dit belangrijk?"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={addValue}>
                <Text style={styles.btnText}>Opslaan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsAdding(false)}>
                <Text style={styles.btnText}>Annuleer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
            <Text style={styles.addButtonText}>+ Voeg waarde toe</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
  container: { padding: 20, paddingBottom: 60 },
  headerSection: { marginBottom: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1A2E44' },
  subHeader: { fontSize: 16, color: '#7F8C8D' },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  valueCard: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  deleteBadge: { position: 'absolute', right: -5, top: -5, backgroundColor: '#E74C3C', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  valueTitle: { fontSize: 18, fontWeight: 'bold', color: '#8E44AD', marginBottom: 5 },
  valueDesc: { fontSize: 13, color: '#34495E' },
  emptyText: { textAlign: 'center', width: '100%', color: '#95A5A6', marginTop: 20 },
  addButton: { borderWidth: 2, borderColor: '#8E44AD', borderStyle: 'dashed', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#8E44AD', fontWeight: 'bold' },
  addCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginTop: 10, elevation: 4 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#95A5A6', marginBottom: 5 },
  inputTitle: { borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 15, fontSize: 16, padding: 5 },
  inputDesc: { borderBottomWidth: 1, borderBottomColor: '#EEE', fontSize: 14, minHeight: 50, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  btn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtn: { backgroundColor: '#2ECC71' },
  cancelBtn: { backgroundColor: '#BDC3C7' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});

export default ActValuesScreen;