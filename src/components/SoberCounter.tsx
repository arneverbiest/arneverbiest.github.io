// src/components/SoberCounter.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'SoberStartDate';

// De interface zorgt ervoor dat het dashboard een seintje kan krijgen
interface SoberCounterProps {
  onDateChange?: (days: number) => void;
}

const SoberCounter: React.FC<SoberCounterProps> = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [daysSober, setDaysSober] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // inputDate start standaard op de datum van vandaag in JJJJ-MM-DD formaat
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadStoredDate();
  }, []);

  const loadStoredDate = async () => {
    try {
      const storedDate = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedDate) {
        const parsedDate = new Date(storedDate);
        setStartDate(parsedDate);
        updateDays(parsedDate);
      } else {
        // Als er nog niets is, zet op vandaag
        const today = new Date();
        setStartDate(today);
        updateDays(today);
      }
    } catch (e) {
      console.error("Fout bij laden van datum:", e);
    }
  };

  const updateDays = (date: Date) => {
    const today = new Date();
    // Bereken het verschil en zorg dat het niet negatief is
    const diffTime = Math.max(0, today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    setDaysSober(diffDays);
    return diffDays;
  };

  const handleSaveDate = async () => {
    // 1. Validatie van het formaat
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(inputDate)) {
      Alert.alert("Fout", "Gebruik het formaat JJJJ-MM-DD (bijv. 2024-01-31)");
      return;
    }

    const newDate = new Date(inputDate);
    
    // 2. Check of de datum geldig is
    if (isNaN(newDate.getTime())) {
      Alert.alert("Fout", "Dit is geen geldige datum.");
      return;
    }
    
    // 3. Check of de datum niet in de toekomst ligt
    if (newDate > new Date()) {
      Alert.alert("Fout", "De datum kan niet in de toekomst liggen.");
      return;
    }

    try {
      // Opslaan in geheugen
      await AsyncStorage.setItem(STORAGE_KEY, newDate.toISOString());
      setStartDate(newDate);
      
      // Bereken de nieuwe dagen
      const newDaysCount = updateDays(newDate);
      
      // Sluit het bewerkscherm
      setIsEditing(false);

      // GEEF DIRECT DOOR AAN HET DASHBOARD
      if (onDateChange) {
        onDateChange(newDaysCount);
      }
    } catch (e) {
      Alert.alert("Fout", "Kon de datum niet opslaan.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Dagen nuchter</Text>
      <Text style={styles.counterText}>{daysSober}</Text>
      
      <Text style={styles.subText}>
        Sinds {startDate.toLocaleDateString('nl-BE')}
      </Text>

      {isEditing ? (
        <View style={styles.editSection}>
          <Text style={styles.inputLabel}>Pas startdatum aan (JJJJ-MM-DD):</Text>
          <TextInput
            style={styles.input}
            value={inputDate}
            onChangeText={setInputDate}
            placeholder="2024-01-01"
            keyboardType="numeric"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.miniButton, styles.saveBtn]} onPress={handleSaveDate}>
              <Text style={styles.btnText}>Opslaan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniButton, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
              <Text style={styles.btnText}>Annuleer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
          <Text style={styles.editButtonText}>Startdatum wijzigen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 35,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  label: {
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  counterText: {
    fontSize: 85,
    fontWeight: '900',
    color: '#1A2E44',
  },
  subText: {
    fontSize: 15,
    color: '#7F8C8D',
    marginBottom: 25,
    backgroundColor: '#F8F9F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  editButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    backgroundColor: '#EBF5FB',
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 14,
  },
  editSection: {
    width: '100%',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 15,
    backgroundColor: '#FAFAFA',
    color: '#1A2E44',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniButton: {
    flex: 0.48,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: { backgroundColor: '#2ECC71' },
  cancelBtn: { backgroundColor: '#BDC3C7' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});

export default SoberCounter;
