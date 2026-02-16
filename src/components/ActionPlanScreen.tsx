import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ActionPlanScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customTool, setCustomTool] = useState('');
  const [plan, setPlan] = useState({
    motivation: '',
    copingOrder: [] as string[],
    contacts: [] as { name: string, phone: string }[]
  });

  const relaxExercises = [
    "4-7-8 Ademhaling", "Body Scan", "5-4-3-2-1 Methode",
    "Rots en Water", "Stille wandeling", "Grounding",
    "Safe Haven", "Urge Surfing"
  ];

  useEffect(() => {
    const loadPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlan({
            motivation: data.motivation || '',
            copingOrder: Array.isArray(data.copingOrder) ? data.copingOrder : [],
            contacts: Array.isArray(data.contacts) ? data.contacts : []
          });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadPlan();
  }, []);

  const handleStepPress = (s: string) => {
    if (isEditing) return;
    const step = s.toLowerCase();
    if (s.includes('📞')) {
      const contact = plan.contacts.find(c => s.includes(c.name));
      if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
    } else if (step.includes('ademhaling')) router.push('../Relax/breathe');
    else if (step.includes('body scan')) router.push('../Relax/bodyscan');
    else if (step.includes('rots en water')) router.push('../Relax/rockwater');
    else if (step.includes('wandeling')) router.push('../Relax/silentwalk');
    else if (step.includes('grounding') || step.includes('5-4-3-2-1')) router.push('../Relax/grounding');
    else if (step.includes('safe haven')) router.push('../Relax/safehaven');
    else if (step.includes('urge surfing')) router.push('../Relax/urgesurf');
  };

  const savePlan = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "settings", "actionPlan"), { ...plan, updatedAt: serverTimestamp() }, { merge: true });
      setIsEditing(false);
      Alert.alert("Opgeslagen", "Noodplan bijgewerkt.");
    } catch (e) { Alert.alert("Fout", "Mislukt."); } finally { setSaving(false); }
  };

  const addStep = (text: string) => {
    // Voorkom dubbele toevoeging
    if (plan.copingOrder.includes(text)) return;
    setPlan(prev => ({ ...prev, copingOrder: [...prev.copingOrder, text] }));
  };

  const removeStep = (index: number) => {
    const newSteps = [...plan.copingOrder];
    newSteps.splice(index, 1);
    setPlan({ ...plan, copingOrder: newSteps });
  };

  const addContact = () => setPlan(prev => ({ ...prev, contacts: [...prev.contacts, { name: '', phone: '' }] }));

  const updateContact = (val: string, index: number, field: 'name' | 'phone') => {
    const newContacts = [...plan.contacts];
    newContacts[index] = { ...newContacts[index], [field]: val };
    setPlan({ ...plan, contacts: newContacts });
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#EF4444" size="large" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.header}>Mijn noodplan</Text>
      </View>
      {/* 1. MOTIVATIE */}
      <View style={styles.section}>
        <Text style={styles.label}>1. Motivatie</Text>
        {isEditing ? (
          <TextInput style={styles.input} multiline value={plan.motivation} onChangeText={(t) => setPlan({ ...plan, motivation: t })} placeholder="Waarom blijf je nuchter?" />
        ) : (
          <View style={styles.displayCard}><Text style={styles.displayText}>{plan.motivation || "Geen motivatie ingevuld."}</Text></View>
        )}
      </View>

      {/* 2. STAPPENPLAN */}
      <View style={styles.section}>
        <Text style={styles.label}>2. Acties bij trek</Text>
        {plan.copingOrder.map((step, i) => (
          <TouchableOpacity key={i} style={styles.stepItem} onPress={() => handleStepPress(step)} disabled={isEditing}>
            <Text style={styles.stepText}>{i + 1}. {step}</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => removeStep(i)}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* BEWERK SECTIES (enkel zichtbaar bij edit) */}
      {isEditing && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>3. Oefeningen (max. 1x)</Text>
            <View style={styles.chipRow}>
              {relaxExercises.map((ex, i) => {
                const isAdded = plan.copingOrder.includes(`🧘 ${ex}`);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, isAdded && styles.chipDisabled]}
                    onPress={() => addStep(`🧘 ${ex}`)}
                    disabled={isAdded}
                  >
                    <Text style={[styles.chipText, isAdded && { color: '#94A3B8' }]}>{isAdded ? 'Toegevoegd' : `+ ${ex}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>4. Eigen hulpmiddel</Text>
            <View style={styles.addOwnRow}>
              <TextInput
                style={styles.ownInput}
                placeholder="Bijv. Wandelen met de hond"
                value={customTool}
                onChangeText={setCustomTool}
              />
              <TouchableOpacity
                style={styles.addIconBtn}
                onPress={() => { if (customTool) { addStep(customTool); setCustomTool(''); } }}
              >
                <Ionicons name="add-circle" size={40} color="#1E293B" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>5. Contactpersonen</Text>
            {plan.contacts.map((c, i) => (
              <View key={i} style={styles.contactRow}>
                <TextInput style={[styles.contactInput, { flex: 2 }]} placeholder="Naam" value={c.name} onChangeText={(v) => updateContact(v, i, 'name')} />
                <TextInput style={[styles.contactInput, { flex: 3 }]} placeholder="Telefoon" keyboardType="phone-pad" value={c.phone} onChangeText={(v) => updateContact(v, i, 'phone')} />
                <TouchableOpacity onPress={() => { if (c.name) addStep(`📞 Bel ${c.name}`); }}>
                  <Ionicons name="call-outline" size={24} color="#27AE60" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addContact}><Text style={styles.addBtnText}>+ Contact toevoegen</Text></TouchableOpacity>
          </View>
        </>
      )}

      {/* KNOPPEN ONDERAAN */}
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={styles.saveBtn} onPress={savePlan} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Plan Opslaan</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelBtnText}>Annuleren</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtnLarge} onPress={() => setIsEditing(true)}>
            <MaterialCommunityIcons name="pencil" size={20} color="white" />
            <Text style={styles.saveBtnText}>Noodplan Aanpassen</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', marginTop: 50, marginBottom: 25 },
  section: { marginBottom: 25 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#475569' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 15, fontSize: 16, elevation: 1, minHeight: 80 },
  displayCard: { backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 1 },
  displayText: { fontSize: 16, color: '#1E293B' },
  stepItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 8, elevation: 1 },
  stepText: { fontSize: 15, color: '#1E293B', flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#E2E8F0', padding: 10, borderRadius: 20 },
  chipDisabled: { backgroundColor: '#F1F5F9', opacity: 0.6 },
  chipText: { fontSize: 12, color: '#475569' },
  addOwnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ownInput: { flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 12, elevation: 1 },
  contactRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  contactInput: { backgroundColor: 'white', padding: 12, borderRadius: 10, elevation: 1 },
  addBtn: { padding: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12 },
  addBtnText: { color: '#64748B', fontSize: 14 },
  editBtnLarge: { backgroundColor: '#64748B', padding: 18, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  saveBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontWeight: 'bold' },
  addIconBtn: { padding: 0 }
});