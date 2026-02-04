import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const HelpModal = ({ visible, title, text, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalText}>{text}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={{color: '#fff', fontWeight: 'bold'}}>Ik snap het</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const GField = ({ title, value, setValue, placeholder, helpText }: any) => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.helpIcon}><Text style={styles.helpIconText}>?</Text></TouchableOpacity>
      </View>
      <TextInput style={styles.input} multiline value={value} onChangeText={setValue} placeholder={placeholder} placeholderTextColor="#95A5A6" />
      <HelpModal visible={showHelp} title={title} text={helpText} onClose={() => setShowHelp(false)} />
    </View>
  );
};

export default function FiveGSchema() {
  const router = useRouter();
  const [mode, setMode] = useState<'quick' | 'deep'>('quick');
  const [loading, setLoading] = useState(true);
  
  const [planOptions, setPlanOptions] = useState<string[]>([]);
  const [selectedCoping, setSelectedCoping] = useState<string[]>([]);
  
  const [craving, setCraving] = useState('');
  const [g, setG] = useState({ gebeurtenis: '', gedachte: '', gevoel: '', gedrag: '', gevolg: '', helpend: '' });

  useEffect(() => {
    const fetchNoodplan = async () => {
      const user = auth.currentUser;
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "actionPlan"));
        if (snap.exists()) {
          const data = snap.data();
          const combined = [
            ...(data.copingOrder || []),
            ...(data.contacts || []).map((c: any) => `📞 Bel ${c.name}`)
          ];
          setPlanOptions(combined);
        }
      }
      setLoading(false);
    };
    fetchNoodplan();
  }, []);

  const toggleCopingSelection = (item: string) => {
    setSelectedCoping(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!g.gebeurtenis) {
      Alert.alert("Oeps", "Vul even in wat er gebeurd is (Gebeurtenis).");
      return;
    }

    // Datum van vandaag genereren
    const today = new Date();
    const dateString = today.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    try {
      await addDoc(collection(db, "users", user.uid, "logbookEntries"), {
        ...g,
        alcoholCraving: parseInt(craving) || 0,
        gebruikteCoping: selectedCoping,
        // Type bepalen op basis van de geselecteerde tab
        type: mode === 'quick' ? '5G_Quick' : '5G_Deep',
        date: dateString, // De leesbare datum voor in de lijst
        createdAt: serverTimestamp(),
      });

      Alert.alert("Opgeslagen", mode === 'quick' ? "Korte log opgeslagen!" : "Volledige 5G analyse opgeslagen!");
      
      // Reset velden en ga terug
      setG({ gebeurtenis: '', gedachte: '', gevoel: '', gedrag: '', gevolg: '', helpend: '' });
      setCraving('');
      setSelectedCoping([]);
      router.replace('/insight/Logbook');
    } catch (e) { 
      console.error(e);
      Alert.alert("Fout", "Kon niet opslaan."); 
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{flex: 1, marginTop: 50}} />;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#F0F4F8'}}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 60}}>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, mode === 'quick' && styles.activeTab]} 
            onPress={() => setMode('quick')}
          >
            <Text style={styles.tabText}>Snel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, mode === 'deep' && styles.activeTab]} 
            onPress={() => setMode('deep')}
          >
            <Text style={styles.tabText}>Diep</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>{mode === 'quick' ? 'Snelle Check-in' : 'Diepe 5G Analyse'}</Text>

        {/* GEBEURTENIS: Altijd tonen, is de basis voor beide schema's */}
        <GField 
          title="1. Gebeurtenis" 
          value={g.gebeurtenis} 
          setValue={(v:string) => setG({...g, gebeurtenis: v})} 
          placeholder="Wat is er gebeurd?" 
          helpText="Beschrijf kort de situatie (waar ben je, met wie, wat gebeurt er?)." 
        />

        {mode === 'deep' && (
          <GField 
            title="2. Gedachte" 
            value={g.gedachte} 
            setValue={(v:string) => setG({...g, gedachte: v})} 
            placeholder="Wat denk je?" 
            helpText="Welke automatische gedachte heb je hierbij?" 
          />
        )}

        {/* GEVOEL: Altijd tonen */}
        <GField 
          title={mode === 'quick' ? "Hoe voel je je?" : "3. Gevoel"} 
          value={g.gevoel} 
          setValue={(v:string) => setG({...g, gevoel: v})} 
          placeholder="Bv. Trek, onrust, stress..." 
          helpText="Welke emotie ervaar je nu?" 
        />

        {mode === 'deep' && (
          <>
            <GField 
              title="4. Gedrag" 
              value={g.gedrag} 
              setValue={(v:string) => setG({...g, gedrag: v})} 
              placeholder="Wat heb je gedaan?" 
              helpText="Hoe reageerde je op de situatie?" 
            />
            <GField 
              title="5. Gevolg" 
              value={g.gevolg} 
              setValue={(v:string) => setG({...g, gevolg: v})} 
              placeholder="Wat was het resultaat?" 
              helpText="Wat gebeurde er daarna (met jezelf en de omgeving)?" 
            />
            <View style={styles.specialField}>
              <Text style={styles.specialTitle}>✨ Helpende Gedachte</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Wat zou je nu wel helpen om te denken?" 
                value={g.helpend} 
                onChangeText={(v) => setG({...g, helpend: v})} 
                multiline 
              />
            </View>
          </>
        )}

        {/* COPING SECTIE */}
        <View style={styles.copingContainer}>
          <Text style={styles.sectionLabel}>Plan van aanpak</Text>
          <Text style={styles.hintText}>Wat ga je nu doen of wat heeft geholpen?</Text>
          <View style={styles.chipWrapper}>
            {planOptions.length > 0 ? planOptions.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={[styles.copingChip, selectedCoping.includes(item) && styles.copingChipActive]} 
                onPress={() => toggleCopingSelection(item)}
              >
                <Text style={[styles.copingChipText, selectedCoping.includes(item) && styles.copingChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>Geen opties in je noodplan gevonden.</Text>
            )}
          </View>
        </View>

        <View style={styles.cravingSection}>
          <Text style={styles.cravingLabel}>Trek Score (0-10)</Text>
          <TextInput 
            style={styles.cravingInput} 
            value={craving} 
            onChangeText={setCraving} 
            keyboardType="numeric" 
            maxLength={2} 
            placeholder="0" 
          />
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
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A2E44' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'white', elevation: 2 },
  tabText: { fontWeight: 'bold', color: '#1A2E44' },
  
  fieldContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldTitle: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  helpIcon: { backgroundColor: '#E3F2FD', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  helpIconText: { color: '#007AFF', fontWeight: 'bold' },
  input: { fontSize: 15, marginTop: 5, textAlignVertical: 'top' },
  
  specialField: { backgroundColor: '#E8F6F3', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#1ABC9C' },
  specialTitle: { fontSize: 16, fontWeight: 'bold', color: '#16A085' },

  copingContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 1 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#34495E', marginBottom: 5 },
  hintText: { fontSize: 12, color: '#7F8C8D', marginBottom: 12, fontStyle: 'italic' },
  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  copingChip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  copingChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  copingChipText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  copingChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  emptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  cravingSection: { backgroundColor: '#FFF', padding: 15, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  cravingLabel: { fontWeight: 'bold', color: '#34495E' },
  cravingInput: { fontSize: 24, fontWeight: 'bold', color: '#007AFF', borderBottomWidth: 2, borderBottomColor: '#007AFF', width: 40, textAlign: 'center' },
  
  saveBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderRadius: 20, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalText: { textAlign: 'center', marginBottom: 20 },
  closeBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 10, width: '100%', alignItems: 'center' }
});