// src/components/ActionPlanScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTION_PLAN_KEY = 'RecoveryActionPlan';

interface ActionPlan {
  reasons: string;
  coping: string;
  contacts: string;
}

// --- HELP COMPONENT (BUITEN DE HOOFDFUNCTIE) ---
const PlanSection = ({ title, value, field, isEditing, setPlan, plan }: 
  { title: string, value: string, field: keyof ActionPlan, isEditing: boolean, setPlan: any, plan: ActionPlan }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {isEditing ? (
      <TextInput
        style={styles.input}
        multiline
        value={value}
        onChangeText={(text) => setPlan({ ...plan, [field]: text })}
        placeholder={`Typ hier je ${title.toLowerCase()}...`}
      />
    ) : (
      <Text style={styles.textDisplay}>{value || 'Nog niet ingevuld...'}</Text>
    )}
  </View>
);

const ActionPlanScreen: React.FC = () => {
  const [plan, setPlan] = useState<ActionPlan>({ reasons: '', coping: '', contacts: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACTION_PLAN_KEY);
      if (stored) setPlan(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const savePlan = async () => {
    try {
      await AsyncStorage.setItem(ACTION_PLAN_KEY, JSON.stringify(plan));
      setIsEditing(false);
      
      // Toon tijdelijke succesmelding
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000); 
    } catch (e) { 
      console.error(e); 
      Alert.alert("Fout", "Kon het plan niet opslaan.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Mijn Noodplan 🛡️</Text>
        
        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✅ Plan succesvol opgeslagen!</Text>
          </View>
        )}

        <PlanSection title="Mijn Redenen" value={plan.reasons} field="reasons" isEditing={isEditing} setPlan={setPlan} plan={plan} />
        <PlanSection title="Wat te doen bij trek?" value={plan.coping} field="coping" isEditing={isEditing} setPlan={setPlan} plan={plan} />
        <PlanSection title="Wie kan ik bellen?" value={plan.contacts} field="contacts" isEditing={isEditing} setPlan={setPlan} plan={plan} />

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: isEditing ? '#4CAF50' : '#007AFF' }]} 
          onPress={isEditing ? savePlan : () => setIsEditing(true)}
        >
          <Text style={styles.buttonText}>{isEditing ? 'Plan Opslaan' : 'Plan Aanpassen'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 8 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', minHeight: 60, textAlignVertical: 'top', fontSize: 16 },
  textDisplay: { fontSize: 16, color: '#333', fontStyle: 'italic' },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  toast: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, marginBottom: 15, alignItems: 'center' },
  toastText: { color: 'white', fontWeight: 'bold' }
});

export default ActionPlanScreen;