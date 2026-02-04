import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { db, auth } from '../../firebaseConfig'; 
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// De lijst met standaard relaxatie-opties
const RELAX_SESSIONS = [
  '🌬️ Ademhaling', '🌬️ Sober', '🌬️ Gevoelsurfen', 
  '🌬️ Veilige haven', '🌬️ 5-4-3-2-1', '🚶 Mindful Wandelen', 
  '💤 Bodyscan', '💎 Rots & Water'
];

export default function ActionPlanScreen() {
  const [plan, setPlan] = useState({ reasons: '', copingOrder: [] as string[], contacts: [] as {name: string, phone: string}[] });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [customTool, setCustomTool] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => { loadPlan(); }, []);

  const loadPlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
      if (snap.exists()) setPlan(snap.data() as any);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const savePlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "settings", "actionPlan"), { ...plan, updatedAt: serverTimestamp() });
      setIsEditing(false);
      Alert.alert("🛡️ Plan Actief", "Je noodplan is bijgewerkt.");
    } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
  };

  const addTool = (toolName: string) => {
    if (toolName.trim() && !plan.copingOrder.includes(toolName.trim())) {
      setPlan(prev => ({ ...prev, copingOrder: [...prev.copingOrder, toolName.trim()] }));
      setCustomTool('');
    }
  };

  const removeTool = (index: number) => {
    setPlan(prev => ({ ...prev, copingOrder: prev.copingOrder.filter((_, i) => i !== index) }));
  };

  const addContact = () => {
    if (newName && newPhone) {
      setPlan(prev => ({ ...prev, contacts: [...prev.contacts, { name: newName, phone: newPhone }] }));
      setNewName(''); setNewPhone('');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Mijn Noodplan 🚨</Text>

        {isEditing ? (
          <View style={styles.editBox}>
            <Text style={styles.label}>Mijn Motivatie:</Text>
            <TextInput 
              style={[styles.input, {height: 60}]} 
              multiline 
              value={plan.reasons} 
              onChangeText={(t) => setPlan({...plan, reasons: t})} 
              placeholder="Waarom wil je nuchter blijven?" 
            />

            <Text style={styles.label}>Kies uit Relaxatie-oefeningen:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
              {RELAX_SESSIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => addTool(s)}>
                  <Text style={styles.suggestionText}>{s}</Text>
                  <MaterialCommunityIcons name="plus-circle" size={16} color="#007AFF" style={{marginLeft: 5}} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Of voeg eigen hulpmiddel toe:</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Bijv: Koud douchen..." value={customTool} onChangeText={setCustomTool} />
              <TouchableOpacity style={styles.addBtn} onPress={() => addTool(customTool)}>
                <MaterialCommunityIcons name="plus" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipContainer}>
              {plan.copingOrder.map((tool, i) => (
                <TouchableOpacity key={i} style={styles.activeChip} onPress={() => removeTool(i)}>
                  <Text style={styles.activeChipText}>{tool}  ✕</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Hulppersonen:</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Naam" value={newName} onChangeText={setNewName} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="Tel" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
              <TouchableOpacity style={styles.addBtn} onPress={addContact}>
                <MaterialCommunityIcons name="account-plus" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={savePlan}>
              <Text style={styles.saveBtnText}>Plan Opslaan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.viewCard}>
            <Text style={styles.motivationText}>"{plan.reasons || 'Mijn motivatie...'}"</Text>
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>MIJN ACTIESTAPPEN:</Text>
            {plan.copingOrder.map((s, i) => (
              <View key={i} style={styles.stepRow}><Text style={styles.stepText}>• {s}</Text></View>
            ))}
            
            {plan.contacts.map((c, i) => (
              <TouchableOpacity key={i} style={styles.stepRow} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                <Text style={[styles.stepText, {color: '#007AFF'}]}>📞 Bel {c.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.editModeBtn} onPress={() => setIsEditing(true)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>Plan Aanpassen</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#1E293B' },
  editBox: { gap: 10 },
  label: { fontWeight: 'bold', color: '#64748B', marginTop: 10, fontSize: 13 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  row: { flexDirection: 'row', gap: 8 },
  addBtn: { backgroundColor: '#007AFF', width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  // Suggestie Styles
  suggestionScroll: { flexDirection: 'row', marginBottom: 5 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF', marginRight: 8, marginTop: 5 },
  suggestionText: { color: '#007AFF', fontSize: 12, fontWeight: '600' },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 15 },
  activeChip: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  activeChipText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  saveBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  viewCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 4, borderLeftWidth: 6, borderLeftColor: '#E74C3C' },
  motivationText: { fontStyle: 'italic', textAlign: 'center', fontSize: 16, color: '#475569', marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginBottom: 10, letterSpacing: 1 },
  stepRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  stepText: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
  editModeBtn: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginTop: 30, alignItems: 'center' }
});