import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, Platform, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig';
import { doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { VALUE_QUESTIONS } from '../src/constants/questions';

// --- SUB-COMPONENTEN ---

const StepDate = ({ date, setDate }: any) => {
  const handleDateChange = (val: string) => {
    if (!val) {
      setDate(new Date());
      return;
    }
    const selected = new Date(val);
    const today = new Date();
    // Beveiliging tegen ongeldige data of toekomst
    if (isNaN(selected.getTime()) || selected > today) {
      setDate(today);
    } else {
      setDate(selected);
    }
  };

  return (
    <View style={styles.content}>
      <Text style={styles.title}>Wanneer begon je herstel?</Text>
      <Text style={styles.subtitle}>Je kunt geen datum in de toekomst kiezen.</Text>
      <input 
        type="date" 
        style={styles.webInput} 
        max={new Date().toISOString().split('T')[0]} 
        value={date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
        onChange={(e) => handleDateChange(e.target.value)} 
      />
    </View>
  );
};

const StepEmergencyDetailed = ({ plan, setPlan }: any) => {
  const [newTool, setNewTool] = useState('');
  const [newName, setNewName] = useState('');
  const [newTel, setNewTel] = useState('');

  const addExtraTool = () => {
    if (!newTool.trim()) return;
    setPlan({ ...plan, extraTools: [...(plan.extraTools || []), newTool.trim()] });
    setNewTool('');
  };

  const addContact = () => {
    if (!newName.trim()) return;
    setPlan({ 
      ...plan, 
      contacts: [...(plan.contacts || []), { name: newName.trim(), tel: newTel.trim() }] 
    });
    setNewName(''); setNewTel('');
  };

  const standardTools = ["Ademhaling", "Sober", "Gevoelsurfen", "5-4-3-2-1", "Wandelen"];

  return (
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.title}>Mijn Noodplan 🚨</Text>
      
      <Text style={styles.label}>MIJN MOTIVATIE</Text>
      <TextInput 
        style={styles.textAreaSmall} 
        placeholder="Waarom is dit belangrijk voor je?" 
        value={plan.motivation} 
        onChangeText={(t) => setPlan({ ...plan, motivation: t })} 
        multiline 
      />

      <Text style={styles.label}>EIGEN STRATEGIEËN TOEVOEGEN</Text>
      <View style={styles.inputRow}>
        <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder="Bijv: Gitaar spelen..." value={newTool} onChangeText={setNewTool} />
        <TouchableOpacity style={styles.addBtn} onPress={addExtraTool}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
      </View>
      <View style={styles.chipGrid}>
        {plan.extraTools?.map((t: string, i: number) => <Text key={i} style={styles.userChip}>• {t}</Text>)}
      </View>

      <Text style={styles.label}>NOODCONTACTEN</Text>
      <View style={styles.inputRow}>
        <TextInput style={[styles.inputSmall, { flex: 1.5 }]} placeholder="Naam" value={newName} onChangeText={setNewName} />
        <TextInput style={[styles.inputSmall, { flex: 1 }]} placeholder="Tel" value={newTel} onChangeText={setNewTel} />
        <TouchableOpacity style={styles.addBtn} onPress={addContact}><Text style={styles.addBtnText}>+</Text></TouchableOpacity>
      </View>
      {plan.contacts?.map((c: any, i: number) => (
        <View key={i} style={styles.contactItem}><Text style={{fontSize: 13}}>👤 {c.name} - {c.tel}</Text></View>
      ))}

      <Text style={styles.label}>STANDAARD GEREEDSCHAPSKIST</Text>
      <View style={styles.chipGrid}>
        {standardTools.map(tool => (
          <TouchableOpacity 
            key={tool} 
            style={[styles.toolChip, plan.toolbox?.includes(tool) && styles.chipActive]} 
            onPress={() => {
              const current = plan.toolbox || [];
              setPlan({ ...plan, toolbox: current.includes(tool) ? current.filter((t:any) => t !== tool) : [...current, tool] });
            }}
          >
            <Text style={[styles.chipTxt, plan.toolbox?.includes(tool) && styles.activeTxt]}>{tool}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const StepNotifications = ({ mActive, setMActive, eActive, setEActive, mTime, setMTime, eTime, setETime }: any) => (
  <View style={styles.content}>
    <Text style={styles.title}>Wanneer wil je een check-in?</Text>
    <View style={styles.row}>
      <View style={styles.checkCard}>
        <Text style={styles.cardLabel}>Ochtend</Text>
        <Switch value={mActive} onValueChange={setMActive} trackColor={{true: '#4ADE80'}} />
        {mActive && <TextInput style={styles.timeInput} value={mTime} onChangeText={setMTime} placeholder="08:00" />}
      </View>
      <View style={styles.checkCard}>
        <Text style={styles.cardLabel}>Avond</Text>
        <Switch value={eActive} onValueChange={setEActive} trackColor={{true: '#4ADE80'}} />
        {eActive && <TextInput style={styles.timeInput} value={eTime} onChangeText={setETime} placeholder="20:00" />}
      </View>
    </View>
  </View>
);

// --- MAIN ONBOARDING COMPONENT ---

export default function OnboardingModal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [selectionMethod, setSelectionMethod] = useState<'quiz' | 'manual' | null>(null);

  // States
  const [recoveryStartDate, setRecoveryStartDate] = useState(new Date());
  const [noodplan, setNoodplan] = useState({ motivation: '', extraTools: [], contacts: [], toolbox: [] });
  const [morningActive, setMorningActive] = useState(true);
  const [eveningActive, setEveningActive] = useState(true);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:00');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});

  const finishAll = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, "users", user.uid), {
        recoveryStartDate: Timestamp.fromDate(recoveryStartDate),
        emergencyPlan: noodplan,
        settings: { morningEnabled: morningActive, eveningEnabled: eveningActive, checkInMorning: morningTime, checkInEvening: eveningTime },
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      selectedValues.forEach(val => {
        const id = val.toLowerCase().replace(/\s/g, '_');
        batch.set(doc(db, "users", user.uid, "tree", id), { name: val, level: 1, xp: 0, lastFed: serverTimestamp() });
      });

      await batch.commit();
      router.replace('/'); 
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const renderStep = () => {
    switch(step) {
      case 1: return <StepDate date={recoveryStartDate} setDate={setRecoveryStartDate} />;
      case 2: return <StepEmergencyDetailed plan={noodplan} setPlan={setNoodplan} />;
      case 3: return <StepNotifications mActive={morningActive} setMActive={setMorningActive} eActive={eveningActive} setEActive={setEveningActive} mTime={morningTime} setMTime={setMorningTime} eTime={eveningTime} setETime={setEveningTime} />;
      case 4: return (
        <View style={styles.content}>
          <Text style={styles.title}>Wil je je waarden selecteren?</Text>
          <TouchableOpacity style={styles.btnGreen} onPress={() => { setSelectionMethod('quiz'); setStep(5); }}><Text style={styles.btnTextWhite}>Doe de Quiz</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => { setSelectionMethod('manual'); setStep(5); }}><Text style={styles.btnTextBlack}>Handmatig Selecteren</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(6)} style={{marginTop: 20}}><Text style={styles.skipLink}>Sla dit over</Text></TouchableOpacity>
        </View>
      );
      case 5: 
        if (selectionMethod === 'manual') {
          return (
            <View style={styles.content}>
              <Text style={styles.title}>Kies 7 Waarden</Text>
              <ScrollView contentContainerStyle={styles.chipGrid} style={{maxHeight: 300}}>
                {Array.from(new Set(VALUE_QUESTIONS.map(v => v.value))).sort().map(v => (
                  <TouchableOpacity key={v} style={[styles.chip, selectedValues.includes(v) && styles.chipActive]} onPress={() => setSelectedValues(prev => prev.includes(v) ? prev.filter(x => x !== v) : (prev.length < 7 ? [...prev, v] : prev))}>
                    <Text style={[styles.chipTxt, selectedValues.includes(v) && styles.activeTxt]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        } else {
          return (
            <View style={styles.content}>
              <Text style={styles.quizHeader}>Vraag {quizIndex + 1}/15</Text>
              <Text style={styles.quizQuestion}>{VALUE_QUESTIONS[quizIndex]?.text}</Text>
              {[4, 2, 0].map(p => (
                <TouchableOpacity key={p} style={styles.optionBtn} onPress={() => {
                  const val = VALUE_QUESTIONS[quizIndex].value;
                  const newScores = { ...quizScores, [val]: (quizScores[val] || 0) + p };
                  setQuizScores(newScores);
                  if (quizIndex < 14) setQuizIndex(quizIndex + 1);
                  else {
                    setSelectedValues(Object.entries(newScores).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([n]) => n));
                    setStep(6);
                  }
                }}>
                  <Text style={styles.optionTxt}>{p === 4 ? 'Helemaal waar' : p === 2 ? 'Beetje waar' : 'Niet waar'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        }
      case 6: return (
        <View style={styles.content}>
          <Text style={styles.title}>Klaar voor de start!</Text>
          <Text style={styles.subtitle}>Je gegevens zijn veilig opgeslagen.</Text>
          <TouchableOpacity style={styles.btnGreen} onPress={finishAll}>
            {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.btnTextWhite}>START MIJN REIS</Text>}
          </TouchableOpacity>
        </View>
      );
      default: return null;
    }
  };

  return (
    <View style={styles.screen}>
      <Modal visible={true} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.stepCircle}><Text style={styles.stepCircleText}>{step}</Text></View>
            {renderStep()}
            <View style={styles.footer}>
              {step > 1 && step < 6 && <TouchableOpacity onPress={() => setStep(step - 1)}><Text style={styles.navText}>Terug</Text></TouchableOpacity>}
              <View style={{flex: 1}} />
              {step < 4 && <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(step + 1)}><Text style={styles.btnTextWhite}>Volgende</Text></TouchableOpacity>}
              {step === 5 && selectionMethod === 'manual' && (
                <TouchableOpacity style={[styles.nextBtn, selectedValues.length < 7 && styles.disabled]} onPress={() => setStep(6)} disabled={selectedValues.length < 7}>
                  <Text style={styles.btnTextWhite}>Klaar ({selectedValues.length}/7)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '95%', maxWidth: 500, backgroundColor: 'white', borderRadius: 25, padding: 20, maxHeight: '90%' },
  stepCircle: { position: 'absolute', top: 20, left: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  stepCircleText: { color: '#A855F7', fontWeight: 'bold', fontSize: 12 },
  content: { width: '100%', alignItems: 'center', marginTop: 30 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#1A202C', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#718096', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#4A5568', alignSelf: 'flex-start', marginTop: 15, marginBottom: 5, textTransform: 'uppercase' },
  webInput: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', fontSize: 16 },
  inputSmall: { backgroundColor: '#F7FAFC', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  inputRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10 },
  addBtn: { backgroundColor: '#A855F7', width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  textAreaSmall: { backgroundColor: '#F7FAFC', width: '100%', borderRadius: 8, padding: 10, height: 60, textAlignVertical: 'top' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  toolChip: { padding: 8, borderRadius: 20, backgroundColor: '#EBF8FF', borderWidth: 1, borderColor: '#BEE3F8' },
  chip: { padding: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#EDF2F7' },
  chipActive: { backgroundColor: '#48BB78' },
  chipTxt: { fontSize: 12, color: '#2D3748' },
  userChip: { backgroundColor: '#FAF5FF', color: '#6B46C1', padding: 4, paddingHorizontal: 10, borderRadius: 12, fontSize: 12, borderWidth: 1, borderColor: '#E9D8FD' },
  activeTxt: { color: 'white', fontWeight: 'bold' },
  contactItem: { backgroundColor: '#F7FAFC', padding: 10, borderRadius: 8, marginTop: 5, width: '100%', borderWidth: 1, borderColor: '#EDF2F7' },
  btnGreen: { backgroundColor: '#48BB78', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnOutline: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0', marginTop: 10 },
  btnTextWhite: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnTextBlack: { color: '#4A5568', fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  checkCard: { flex: 1, backgroundColor: '#F7FAFC', padding: 15, borderRadius: 15, alignItems: 'center' },
  cardLabel: { fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  timeInput: { fontSize: 18, fontWeight: 'bold', color: '#2F855A', marginTop: 10 },
  footer: { flexDirection: 'row', marginTop: 25, width: '100%', alignItems: 'center' },
  nextBtn: { backgroundColor: '#48BB78', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 10 },
  navText: { color: '#A0AEC0', fontWeight: 'bold' },
  quizHeader: { fontSize: 12, color: '#A855F7', fontWeight: 'bold', marginBottom: 5 },
  quizQuestion: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#2D3748' },
  optionBtn: { padding: 14, backgroundColor: '#F7FAFC', width: '100%', borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  optionTxt: { fontWeight: '600', color: '#4A5568' },
  skipLink: { color: '#A0AEC0', textDecorationLine: 'underline', fontSize: 14 },
  disabled: { opacity: 0.5 }
});