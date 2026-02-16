import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavHeader } from '../components/NavHeader';
import { useRouter } from 'expo-router';

const DEFAULT_RELAX = [
  '🌬️ Ademhaling', '🌬️ Sober', '🌬️ Gevoelsurfen',
  '🌬️ Veilige haven', '🌬️ 5-4-3-2-1', '🚶 Mindful Wandelen',
  '💤 Bodyscan', '💎 Rots & Water'
];
const router = useRouter();

export default function ActionPlanScreen() {
  const [plan, setPlan] = useState({
    reasons: '',
    copingOrder: [] as string[],
    contacts: [] as { name: string, phone: string }[],
    customPool: [] as string[],
  });
  
  const [isEditing, setIsEditing] = useState(true);
  const [loading, setLoading] = useState(true);

  const [newToolInput, setNewToolInput] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => { loadPlan(); }, []);

const loadPlan = async () => {
const user = auth.currentUser;
if (!user) return;
try {
  // We halen data op uit het hoofd-document (waar onboarding opslaat)
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();
      const planData = data.emergencyPlan;
      
      setPlan({
        reasons: planData.motivation || '',
        copingOrder: planData.toolbox || [],
        contacts: planData.contacts || [],
        customPool: planData.extraTools || [],
      });
      setIsEditing(false);
    }
  } catch (e) { 
    console.error("Laadfout:", e); 
  } finally {
    setLoading(false);
  }
};

 const savePlan = async () => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    // Opslaan op de centrale plek
    await setDoc(doc(db, "users", user.uid), {
      emergencyPlan: {
        motivation: plan.reasons,
        toolbox: plan.copingOrder,
        contacts: plan.contacts,
        extraTools: plan.customPool
      }
    }, { merge: true });
    setIsEditing(false);
    Alert.alert("Opgeslagen", "Je noodplan is bijgewerkt.");
  } catch (e) { 
    Alert.alert("Fout", "Opslaan mislukt."); 
  }
};

  // 1. VOEG TOE AAN POOL (Coping OF Contact)
  const addToPool = (type: 'tool' | 'contact') => {
    if (type === 'tool' && newToolInput.trim()) {
      const tool = newToolInput.trim();
      if (!(plan.customPool || []).includes(tool)) {
        setPlan(prev => ({
          ...prev,
          customPool: [...(prev.customPool || []), tool]
        }));
        setNewToolInput('');
      }
    } else if (type === 'contact' && newName.trim() && newPhone.trim()) {
      const contactLabel = `📞 ${newName.trim()}`;
      // We slaan het contact op in de customPool als een string voor de keuze-balk
      // En voegen de data toe aan de contacts array voor de bel-functie
      if (!(plan.customPool || []).includes(contactLabel)) {
        setPlan(prev => ({
          ...prev,
          customPool: [...(prev.customPool || []), contactLabel],
          contacts: [...(prev.contacts || []), { name: newName.trim(), phone: newPhone.trim() }]
        }));
        setNewName(''); setNewPhone('');
      }
    }
  };

  // 2. SELECTEER UIT POOL
  const selectFromPool = (item: string) => {
    if (!(plan.copingOrder || []).includes(item)) {
      setPlan(prev => ({ ...prev, copingOrder: [...(prev.copingOrder || []), item] }));
    }
  };

  const moveTool = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...plan.copingOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setPlan({ ...plan, copingOrder: newOrder });
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#27AE60" /></View>;

  // Combineer alles voor de keuze-balk
  const fullPool = [...DEFAULT_RELAX, ...(plan.customPool || [])];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <NavHeader title="Noodplan" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Mijn Noodplan 🚨</Text>

        {isEditing ? (
          <View style={styles.editBox}>
            <Text style={styles.label}>1. Mijn Motivatie:</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              multiline value={plan.reasons}
              onChangeText={(t) => setPlan({ ...plan, reasons: t })}
              placeholder="Waarom doe je dit?"
            />

            <Text style={styles.label}>2. Tool of Contact toevoegen aan vijver:</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Bijv: Wandelen..."
                value={newToolInput}
                onChangeText={setNewToolInput}
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => addToPool('tool')}>
                <MaterialCommunityIcons name="plus" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={[styles.row, { marginTop: 10 }]}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Naam" value={newName} onChangeText={setNewName} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tel" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#27AE60' }]} onPress={() => addToPool('contact')}>
                <MaterialCommunityIcons name="account-plus" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>3. Jouw Gereedschapskist (tik om in plan te zetten):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionScroll}>
              {fullPool.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionChip, (plan.copingOrder || []).includes(s) && styles.selectedChip]}
                  onPress={() => selectFromPool(s)}
                >
                  <Text style={[styles.suggestionText, (plan.copingOrder || []).includes(s) && { color: 'white' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>4. De volgorde van jouw stappenplan:</Text>
            <View style={styles.stepContainer}>
              {(plan.copingOrder || []).map((tool, i) => (
                <View key={i} style={styles.activeStepRow}>
                  <TouchableOpacity onPress={() => setPlan(prev => ({ ...prev, copingOrder: prev.copingOrder.filter((_, idx) => idx !== i) }))}>
                    <MaterialCommunityIcons name="minus-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                  <Text style={styles.stepTextItem}>{i + 1}. {tool}</Text>
                  <TouchableOpacity onPress={() => moveTool(i, 'up')}><MaterialCommunityIcons name="chevron-up" size={26} color="#64748B" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => moveTool(i, 'down')}><MaterialCommunityIcons name="chevron-down" size={26} color="#64748B" /></TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={savePlan}>
              <Text style={styles.saveBtnText}>Plan Opslaan & Activeren</Text>
            </TouchableOpacity>
          </View>
        ) : (
/* WEERGAVE MODUS */
<View style={styles.viewCard}>
  <Text style={styles.motivationText}>"{plan.reasons || 'Mijn motivatie...'}"</Text>
  <View style={styles.divider} />
  <Text style={styles.sectionTitle}>MIJN STAPPENPLAN (Klik om te openen):</Text>
  
  {plan.copingOrder.map((s, i) => {
    const isPhone = s.startsWith('📞');
    const isBreathing = s.includes('Ademhaling');
    const isSober = s.includes('Sober');
    const isUrgeSurfing = s.includes('Gevoelsurfen');
    const isSafeHaven = s.includes('Veilige haven');
    const isGrounding = s.includes('5-4-3-2-1');
    const isSilentwalk = s.includes('Mindful Wandelen');
    const isBodyscan = s.includes('Bodyscan');
    const isRotsWater = s.includes('Rots & Water');

    // Voeg hier eventueel meer checks toe voor andere pagina's

    const handlePress = () => {
      if (isPhone) {
        const contact = plan.contacts.find(c => s.includes(c.name));
        if (contact) Linking.openURL(`tel:${contact.phone}`);
      } else if (isBreathing) {
        router.push('../Relax/breathe'); // Zorg dat router is geïmporteerd via useRouter()
      } else if (isSober) {
        router.push('../Relax/sober');
      } 
      else if (isBodyscan) {
        router.push('../Relax/bodyscan');
      } 
      else if (isRotsWater) {
        router.push('../Relax/rockwater');
      } 
      else if (isSilentwalk) {
        router.push('../Relax/silentwalk');
      } 
      else if (isGrounding) {
        router.push('../../Relax/grounding');
      } 
      else if (isSafeHaven) {
        router.push('../../Relax/safehaven');
      } 
      else if (isUrgeSurfing) {
        router.push('../../Relax/urgesurf');
      } 
      // Voeg hier je andere routes toe
    };



    return (
      <TouchableOpacity 
        key={i} 
        style={[styles.stepRow, (isPhone || isBreathing || isSober) && styles.interactiveStep]} 
        onPress={handlePress}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={[styles.stepText, isPhone && { color: '#007AFF' }]}>
            {i + 1}. {s}
          </Text>
          {(isPhone || isBreathing || isSober) && (
            <MaterialCommunityIcons name="arrow-right-circle" size={18} color="#94A3B8" />
          )}
        </View>
      </TouchableOpacity>
    );
  })}

  <TouchableOpacity style={styles.editModeBtn} onPress={() => setIsEditing(true)}>
    <Text style={{ color: 'white', fontWeight: 'bold' }}>Plan Aanpassen</Text>
  </TouchableOpacity>
</View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginVertical: 10, color: '#1E293B' },
  editBox: { gap: 8 },
  label: { fontWeight: 'bold', color: '#64748B', marginTop: 12, fontSize: 12, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { backgroundColor: '#007AFF', width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  suggestionScroll: { flexDirection: 'row', marginVertical: 8 },
  suggestionChip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF', marginRight: 8 },
  selectedChip: { backgroundColor: '#007AFF' },
  suggestionText: { color: '#007AFF', fontSize: 12, fontWeight: '600' },
  stepContainer: { marginVertical: 5 },
  activeStepRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 8, borderRadius: 10, marginBottom: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  stepTextItem: { flex: 1, marginLeft: 10, fontWeight: '600', color: '#1E293B' },
  saveBtn: { backgroundColor: '#27AE60', padding: 16, borderRadius: 12, marginTop: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  viewCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 4, borderLeftWidth: 6, borderLeftColor: '#E74C3C' },
  motivationText: { fontStyle: 'italic', textAlign: 'center', fontSize: 16, color: '#475569', marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginBottom: 10, letterSpacing: 1 },
  stepRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  stepText: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
  editModeBtn: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  interactiveStep: { backgroundColor: '#E0F2FE' },
});