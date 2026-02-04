import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Alle beschikbare coping opties (gebaseerd op je Relax-sectie)
const ALL_COPING_OPTIONS = [
  '🌬️ Ademhaling', '🌬️ Sober', '🌬️ Gevoelsurfen', 
  '🌬️ Veilige Haven', '🌬️ 5-4-3-2-1', '🚶 Wandelen', 
  '💤 Bodyscan', '💎 Rots & Water', '🌸 Zintuigentuin'
];

// Help Modal Component
const HelpModal = ({ visible, title, text, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalText}>{text}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={{color: '#fff', fontWeight: 'bold'}}>Ik snap het</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Herbruikbaar G-veld component
const GField = ({ title, value, setValue, placeholder, helpText }: any) => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpIcon}>
          <Text style={styles.helpIconText}>?</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        multiline
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#95A5A6"
      />
      <HelpModal visible={showHelp} title={title} text={helpText} onClose={() => setShowHelp(false)} />
    </View>
  );
};

export default function FiveGSchema() {
  const [g, setG] = useState({ 
    gebeurtenis: '', gedachte: '', gevoel: '', 
    gedrag: '', gevolg: '', helpend: '' 
  });
  const [selectedCoping, setSelectedCoping] = useState<string[]>([]);
  const [craving, setCraving] = useState('');
  const [noodplanSteps, setNoodplanSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Haal het noodplan op als herinnering
  useEffect(() => {
    const fetchNoodplan = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
          if (snap.exists()) setNoodplanSteps(snap.data().copingOrder || []);
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    };
    fetchNoodplan();
  }, []);

  const toggleCoping = (option: string) => {
    setSelectedCoping(prev => 
      prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]
    );
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const cravingNum = parseInt(craving);
    if (!g.gebeurtenis || !g.gedachte) {
      Alert.alert("Incompleet", "Vul tenminste de gebeurtenis en de gedachte in.");
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "logbookEntries"), {
        ...g,
        selectedCoping,
        alcoholCraving: cravingNum || 0,
        date: new Date().toLocaleDateString('nl-BE'),
        createdAt: serverTimestamp(),
        type: '5G_Deep'
      });
      
      Alert.alert("Opgeslagen", "Je analyse en actieplan staan in je logboek.");
      setG({ gebeurtenis: '', gedachte: '', gevoel: '', gedrag: '', gevolg: '', helpend: '' });
      setCraving('');
      setSelectedCoping([]);
    } catch (e) {
      Alert.alert("Fout", "Opslaan mislukt.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{flex:1}} />;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F0F4F8'}}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 60}}>
        <Text style={styles.header}>Diepe 5G Analyse</Text>
        
        <GField title="1. Gebeurtenis" value={g.gebeurtenis} setValue={(v:string) => setG({...g, gebeurtenis: v})} placeholder="Wie, wat, waar, wanneer?" helpText="Beschrijf objectief wat er gebeurde." />
        <GField title="2. Gedachten" value={g.gedachte} setValue={(v:string) => setG({...g, gedachte: v})} placeholder="Wat dacht je?" helpText="Welke automatische gedachte kwam op?" />
        <GField title="3. Gevoelens" value={g.gevoel} setValue={(v:string) => setG({...g, gevoel: v})} placeholder="Wat voelde je?" helpText="Benoem emoties en lichamelijke sensaties." />
        <GField title="4. Gedrag" value={g.gedrag} setValue={(v:string) => setG({...g, gedrag: v})} placeholder="Wat heb je gedaan?" helpText="Beschrijf je actie op dat moment." />
        <GField title="5. Gevolg" value={g.gevolg} setValue={(v:string) => setG({...g, gevolg: v})} placeholder="Wat was het resultaat?" helpText="Resultaat op korte en lange termijn." />

        <View style={styles.specialField}>
          <Text style={styles.specialTitle}>✨ De Helpende Gedachte</Text>
          <TextInput style={styles.input} placeholder="Welke nieuwe gedachte zou je helpen?" value={g.helpend} onChangeText={(v) => setG({...g, helpend: v})} multiline />
        </View>

        {/* NIEUWE COPING SECTIE */}
        <View style={styles.copingSection}>
          <Text style={styles.fieldTitle}>6. Coping & Actie</Text>
          <Text style={styles.hintTextSmall}>Welke technieken ga je nu inzetten?</Text>
          
          <View style={styles.chipContainer}>
            {ALL_COPING_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option} 
                onPress={() => toggleCoping(option)}
                style={[styles.chip, selectedCoping.includes(option) && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedCoping.includes(option) && styles.chipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {noodplanSteps.length > 0 && (
            <View style={styles.noodplanReminder}>
              <Text style={styles.reminderTitle}>💡 Herinnering uit je noodplan:</Text>
              {noodplanSteps.map((step, i) => (
                <Text key={i} style={styles.reminderText}>• {step}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={styles.cravingSection}>
          <Text style={styles.cravingLabel}>Hoe sterk was de trek? (0-10)</Text>
          <View style={styles.inputWrapper}>
            <TextInput style={styles.cravingInput} value={craving} onChangeText={setCraving} keyboardType="numeric" maxLength={2} placeholder="-" />
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Analyse Opslaan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 20, color: '#1A2E44' },
  fieldContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  fieldTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  helpIcon: { backgroundColor: '#E3F2FD', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  helpIconText: { color: '#007AFF', fontWeight: 'bold' },
  input: { fontSize: 15, color: '#2C3E50', textAlignVertical: 'top', minHeight: 50 },
  
  specialField: { backgroundColor: '#E8F6F3', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1ABC9C' },
  specialTitle: { fontSize: 16, fontWeight: 'bold', color: '#16A085', marginBottom: 5 },
  hintTextSmall: { fontSize: 12, color: '#7F8C8D', marginBottom: 10, fontStyle: 'italic' },

  // Coping Styles
  copingSection: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  chip: { borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { color: '#475569', fontSize: 13 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  
  noodplanReminder: { marginTop: 15, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#007AFF' },
  reminderTitle: { fontSize: 12, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  reminderText: { fontSize: 12, color: '#64748B' },

  cravingSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 25, elevation: 1, alignItems: 'center' },
  cravingLabel: { fontSize: 15, fontWeight: '600', color: '#34495E', marginBottom: 5 },
  inputWrapper: { borderBottomWidth: 3, borderBottomColor: '#007AFF', width: 60 },
  cravingInput: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#007AFF' },

  saveBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 3 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 20, alignItems: 'center', width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#007AFF' },
  modalText: { textAlign: 'center', lineHeight: 24, marginBottom: 20, color: '#555', fontSize: 16 },
  closeBtn: { backgroundColor: '#007AFF', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 10 }
});