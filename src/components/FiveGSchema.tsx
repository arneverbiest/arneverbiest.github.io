// src/components/FiveGSchema.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_ENTRIES_KEY = 'RecoveryLogEntries';

interface LogEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  alcoholCraving: number;
}

interface GFieldProps {
    title: string;
    value: string;
    setValue: (text: string) => void;
}

// HELP COMPONENT BUITEN DE FUNCTIE
const GField: React.FC<GFieldProps> = ({ title, value, setValue }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={3}
        value={value}
        onChangeText={setValue}
        placeholder={`Beschrijf de ${title.toLowerCase()}...`}
      />
    </View>
);

const FiveGSchema: React.FC = () => {
  const [gebeurtenis, setGebeurtenis] = useState('');
  const [gedachten, setGedachten] = useState('');
  const [gevoelens, setGevoelens] = useState('');
  const [gedrag, setGedrag] = useState('');
  const [gevolg, setGevolg] = useState('');
  const [craving, setCraving] = useState('');
  const [showToast, setShowToast] = useState(false);

  const resetForm = () => {
    setGebeurtenis(''); setGedachten(''); setGevoelens(''); setGedrag(''); setGevolg(''); setCraving('');
  }

  const handleSave = async () => {
    // 1. Check op lege velden
    if (!gebeurtenis || !gedachten || !gevoelens || !gedrag || !gevolg || !craving) {
        Alert.alert('Invoerfout', 'Vul a.u.b. alle velden in.');
        return;
    }

    // 2. Validatie: Is craving een getal?
    const cravingValue = parseInt(craving, 10);
    if (isNaN(cravingValue)) {
        Alert.alert('Foutieve Invoer', 'Bij verlangen mag je enkel cijfers invullen.');
        return;
    }

    if (cravingValue < 0 || cravingValue > 10) {
        Alert.alert('Foutieve Invoer', 'Het verlangen moet tussen 0 en 10 liggen.');
        return;
    }
    
    const combinedContent = `--- 5G Reflectie ---\n1. Gebeurtenis: ${gebeurtenis}\n2. Gedachten: ${gedachten}\n3. Gevoelens: ${gevoelens}\n4. Gedrag: ${gedrag}\n5. Gevolg: ${gevolg}`;

    const newLogEntry: LogEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('nl-BE'),
        title: `5G: ${gebeurtenis.substring(0, 20)}...`,
        content: combinedContent,
        alcoholCraving: cravingValue,
    };

    try {
      const storedEntries = await AsyncStorage.getItem(LOG_ENTRIES_KEY);
      const entries = storedEntries ? JSON.parse(storedEntries) : [];
      await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify([...entries, newLogEntry]));
      
      setShowToast(true);
      resetForm();
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      Alert.alert('Fout', 'Kon de gegevens niet opslaan.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Analyseer met het 5G-Schema</Text>
        
        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✅ 5G succesvol toegevoegd aan logboek!</Text>
          </View>
        )}

        <GField title="1. Gebeurtenis" value={gebeurtenis} setValue={setGebeurtenis} />
        <GField title="2. Gedachten" value={gedachten} setValue={setGedachten} />
        <GField title="3. Gevoelens" value={gevoelens} setValue={setGevoelens} />
        <GField title="4. Gedrag" value={gedrag} setValue={setGedrag} />
        <GField title="5. Gevolg" value={gevolg} setValue={setGevolg} />

        <View style={styles.fieldContainer}>
            <Text style={styles.title}>6. Verlangen (Cijfer 0-10)</Text>
            <TextInput
                style={styles.input}
                value={craving}
                onChangeText={setCraving}
                placeholder="Vul een getal in..."
                keyboardType="numeric"
            />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Opslaan in Logboek</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  fieldContainer: { marginBottom: 15, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#007AFF' },
  input: { fontSize: 14, minHeight: 40, textAlignVertical: 'top' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  toast: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  toastText: { color: 'white', fontWeight: 'bold' }
});

export default FiveGSchema;