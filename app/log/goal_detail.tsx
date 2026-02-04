import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where, limit, updateDoc, doc } from 'firebase/firestore';

const ALL_VALUES_LIST = ["Aandacht", "Eerlijkheid", "Macht", "Stabiliteit", "Aanpassen", "Empathie", "Milieubewust", "Structuur", "Acceptatie", "Enthousiasme", "Mindful", "Tactvol", "Afwisseling", "Erkenning", "Moed", "Tevredenheid", "Altruïsme", "Excelleren", "Nauwkeurigheid", "Toewijding", "Ambitieus", "Familie", "Nederigheid", "Traditie", "Assertiviteit", "Flexibiliteit", "Nieuwsgierigheid", "Trouw", "Attent", "Gastvrijheid", "Nut", "Uitdaging", "Authenticiteit", "Geduld", "Ontspanning", "Veiligheid", "Autonomie", "Gelijkwaardigheid", "Ontwikkeling", "Verantwoordelijkheid", "Avontuurlijkheid", "Georganiseerd", "Openheid", "Verbeelding", "Balans", "Gezag", "Oprechtheid", "Verbinding", "Behulpzaamheid", "Gezelligheid", "Optimisme", "Verdraagzaamheid", "Bekwaamheid", "Gezondheid", "Originaliteit", "Vergeving", "Bemoedigend", "Groei", "Passie", "Vertrouwen", "Bescheidenheid", "Hoffelijkheid", "Plezier", "Verwondering", "Beschermen", "Hoop", "Plichtsgetrouw", "Vriendschap", "Vrijgevigheid", "Betrouwbaarheid", "Humor", "Professionaliteit", "Vrijheid", "Bewustzijn", "Ijverig", "Rationaliteit", "Waardering", "Bijdragen", "Innovatief", "Rechtvaardigheid", "Warmte", "Comfort", "Integriteit", "Wederkerig", "Compassie", "Intimiteit", "Roem", "Welvaart", "Compromis", "Inzet", "Romantiek", "Wijsheid", "Creativiteit", "Inzicht", "Rust", "Zelfbeheersing", "Dankbaarheid", "Kennis", "Samenwerking", "Zelfkennis", "Discipline", "Kracht", "Schoonheid", "Zelfwaardering", "Dienstbaarheid", "Kunst", "Seksualiteit", "Zinvolheid", "Diepgang", "Kwaliteit", "Sociaal", "Zorgzaamheid", "Doelgerichtheid", "Leiderschap", "Solidariteit", "Duurzaamheid", "Liefde", "Spanning", "Eenvoud", "Loyaliteit", "Spiritualiteit"];

const THEME_CONTEXT: any = {
  "Verslaving": { goal: "Bijv: Ik gebruik de komende 30 dagen geen middelen.", step: "Bijv: Sponsor bellen...", barrier: "Bijv: Oude vrienden.", strategy: "Bijv: 'Nee' zeggen.", support: "Bijv: De AA-groep..." },
  "Gezondheid": { goal: "Bijv: Ik ga 3x per week hardlopen.", step: "Bijv: Schoenen klaarzetten...", barrier: "Bijv: Slecht weer.", strategy: "Bijv: Binnen trainen.", support: "Bijv: Loop-app..." },
  "Thuissituatie": { goal: "Bijv: Elke avond 15 min opruimen.", step: "Bijv: Timer zetten...", barrier: "Bijv: Moeheid.", strategy: "Bijv: Direct bij thuiskomst.", support: "Bijv: Partner..." },
  "Sociaal": { goal: "Bijv: Elke zondag familie bellen.", step: "Bijv: Agenda-item...", barrier: "Bijv: Gespreksangst.", strategy: "Bijv: Vragen opschrijven.", support: "Bijv: Beste vriend..." },
  "default": { goal: "Wat is je SMART doel?", step: "Kleine stap...", barrier: "Wat zit tegen?", strategy: "Wat doe je dan?", support: "Wie helpt?" }
};

export default function GoalDetail() {
  const { catId, catTitle } = useLocalSearchParams();
  const router = useRouter();
  const context = THEME_CONTEXT[catTitle as string] || THEME_CONTEXT.default;

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'read'>('edit');
  const [existingDocId, setExistingDocId] = useState<string | null>(null);

  const [goal, setGoal] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [barriers, setBarriers] = useState('');
  const [strategy, setStrategy] = useState('');
  const [support, setSupport] = useState('');
  const [subTasks, setSubTasks] = useState<string[]>([]); 
  const [currentTaskInput, setCurrentTaskInput] = useState('');
  
  const [treeValues, setTreeValues] = useState<string[]>([]);
  const [showValueModal, setShowValueModal] = useState(false);
  const [showSmartInfo, setShowSmartInfo] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchTreeValues();
      await checkExistingPlan();
      setLoading(false);
    };
    initialize();
  }, []);

  const fetchTreeValues = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, "users", user.uid, "tree"));
      setTreeValues(snap.docs.map(doc => doc.data().name));
    } catch (e) { console.error(e); }
  };

  const checkExistingPlan = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "goals_matrix"),
        where("category", "==", catTitle),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setExistingDocId(querySnapshot.docs[0].id);
        setGoal(data.goal || '');
        setSelectedValues(data.linkedValues || []);
        setBarriers(data.barriers || '');
        setStrategy(data.strategy || '');
        setSupport(data.support || '');
        setSubTasks(data.subTasks || []);
        setViewMode('read'); // Als het bestaat, zet op vast
      }
    } catch (e) { console.error("Fout bij ophalen plan:", e); }
  };

  const toggleValue = (val: string) => {
    if (viewMode === 'read') return;
    setSelectedValues(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const addSubTask = async () => {
    if (currentTaskInput.trim() === '') return;
    const newTasks = [...subTasks, currentTaskInput.trim()];
    setSubTasks(newTasks);
    setCurrentTaskInput('');

    // Als we in read-modus zijn, update direct de database zodat het naar WeeklyFocus gaat
    if (viewMode === 'read' && existingDocId) {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid, "goals_matrix", existingDocId), {
          subTasks: newTasks
        });
      }
    }
  };

  const removeSubTask = async (index: number) => {
    const newTasks = [...subTasks];
    newTasks.splice(index, 1);
    setSubTasks(newTasks);

    if (viewMode === 'read' && existingDocId) {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid, "goals_matrix", existingDocId), {
          subTasks: newTasks
        });
      }
    }
  };

  const handleExecutePlan = async () => {
    const user = auth.currentUser;
    if (!user || !goal) return Alert.alert("Oeps", "Vul tenminste je hoofddoel in.");
    
    try {
      const planData = {
        category: catTitle,
        categoryId: catId,
        goal,
        linkedValues: selectedValues,
        barriers,
        strategy,
        support,
        subTasks: subTasks, 
        completedHistory: [],
        createdAt: new Date().toISOString(),
        status: 'actief'
      };

      if (existingDocId) {
        await updateDoc(doc(db, "users", user.uid, "goals_matrix", existingDocId), planData);
      } else {
        const docRef = await addDoc(collection(db, "users", user.uid, "goals_matrix"), planData);
        setExistingDocId(docRef.id);
      }
      
      setViewMode('read');
      Alert.alert("Plan Geactiveerd", "Je doel staat vast.");
    } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#27AE60" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={styles.catLabel}>{catTitle}</Text>
            <Text style={styles.title}>Actieplan Matrix</Text>
          </View>
          {viewMode === 'read' && (
            <TouchableOpacity onPress={() => setViewMode('edit')} style={styles.smallEditBtn}>
               <Ionicons name="create-outline" size={18} color="#64748B" />
               <Text style={styles.smallEditBtnText}>Bewerk</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.coachCard}>
          <TouchableOpacity style={styles.coachHeader} onPress={() => setShowSmartInfo(!showSmartInfo)}>
            <Ionicons name="bulb" size={20} color="#F1C40F" /><Text style={styles.coachHeaderText}>SMART Doelen Hulp</Text>
            <Ionicons name={showSmartInfo ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
          </TouchableOpacity>
          {showSmartInfo && (
            <View style={styles.coachContent}>
              <View style={styles.smartList}>
                <Text style={styles.smartItem}>✅ <Text style={{fontWeight: 'bold'}}>S</Text>pecifiek • ✅ <Text style={{fontWeight: 'bold'}}>M</Text>eetbaar • ✅ <Text style={{fontWeight: 'bold'}}>A</Text>cceptabel • ✅ <Text style={{fontWeight: 'bold'}}>R</Text>ealistisch • ✅ <Text style={{fontWeight: 'bold'}}>T</Text>ijdsgebonden</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>1. Wat is je concrete doel?</Text>
          {viewMode === 'edit' ? (
            <TextInput style={styles.textArea} placeholder={context.goal} value={goal} onChangeText={setGoal} multiline />
          ) : (
            <View style={styles.fixedBox}><Text style={styles.fixedText}>{goal}</Text></View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>2. Gekoppelde waarden</Text>
          <View style={styles.chipContainer}>
            {selectedValues.map((v) => (
              <TouchableOpacity key={v} disabled={viewMode === 'read'} style={[styles.chip, styles.chipActive]} onPress={() => toggleValue(v)}>
                <Text style={styles.chipTextActive}>{v}</Text>
              </TouchableOpacity>
            ))}
            {viewMode === 'edit' && (
              <>
                {treeValues.filter(v => !selectedValues.includes(v)).map((v) => (
                  <TouchableOpacity key={v} style={styles.chip} onPress={() => toggleValue(v)}><Text style={styles.chipText}>{v}</Text></TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addValueBtn} onPress={() => setShowValueModal(true)}><Ionicons name="add" size={18} color="#27AE60" /></TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>3. Stapjes (To-Do's)</Text>
          {subTasks.map((task, index) => (
            <View key={index} style={styles.taskRowFixed}>
              <View style={styles.taskNumber}><Text style={styles.taskNumberText}>{index + 1}</Text></View>
              <Text style={styles.taskTextFixed}>{task}</Text>
              <TouchableOpacity onPress={() => removeSubTask(index)}><Ionicons name="trash-outline" size={20} color="#E74C3C" /></TouchableOpacity>
            </View>
          ))}
          <View style={styles.taskRow}>
            <View style={[styles.taskNumber, {backgroundColor: '#94A3B8'}]}><Text style={styles.taskNumberText}>+</Text></View>
            <TextInput style={styles.taskInput} placeholder={context.step} value={currentTaskInput} onChangeText={setCurrentTaskInput} onSubmitEditing={addSubTask} blurOnSubmit={false} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>4. Obstakels & Strategie</Text>
          {viewMode === 'edit' ? (
            <>
              <TextInput style={[styles.textArea, {height: 60}]} placeholder={context.barrier} value={barriers} onChangeText={setBarriers} multiline />
              <View style={{height: 10}} />
              <TextInput style={[styles.textArea, {height: 60}]} placeholder={context.strategy} value={strategy} onChangeText={setStrategy} multiline />
            </>
          ) : (
            <View style={styles.fixedBox}>
              <Text style={styles.fixedLabel}>Obstakel:</Text><Text style={styles.fixedText}>{barriers || "Geen"}</Text>
              <View style={styles.smallDivider} /><Text style={styles.fixedLabel}>Strategie:</Text><Text style={styles.fixedText}>{strategy || "Geen"}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>5. Wie of wat heb je nodig?</Text>
          {viewMode === 'edit' ? (
            <TextInput style={styles.input} placeholder={context.support} value={support} onChangeText={setSupport} />
          ) : (
            <View style={styles.fixedBox}><Text style={styles.fixedText}>{support}</Text></View>
          )}
        </View>

        {viewMode === 'edit' && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleExecutePlan}>
            <Text style={styles.saveBtnText}>Plan Uitvoeren & Opslaan</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL VOOR WAARDEN */}
      <Modal visible={showValueModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extra waarden</Text>
              <TouchableOpacity onPress={() => setShowValueModal(false)}><Ionicons name="close" size={24} color="#1E293B" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {ALL_VALUES_LIST.map((val) => (
                <TouchableOpacity key={val} style={[styles.modalChip, selectedValues.includes(val) && styles.chipActive]} onPress={() => toggleValue(val)}>
                  <Text style={[styles.chipText, selectedValues.includes(val) && styles.chipTextActive]}>{val}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowValueModal(false)}><Text style={styles.closeModalBtnText}>Klaar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginTop: 40, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 15 },
  catLabel: { fontSize: 12, color: '#27AE60', fontWeight: 'bold', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  smallEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 6, borderRadius: 8 },
  smallEditBtnText: { fontSize: 12, marginLeft: 4, color: '#64748B' },
  coachCard: { backgroundColor: 'white', borderRadius: 15, padding: 15, marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#F1C40F' },
  coachHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coachHeaderText: { flex: 1, marginLeft: 10, fontWeight: 'bold' },
  coachContent: { marginTop: 10 },
  smartList: { marginTop: 5 },
  smartItem: { fontSize: 12, color: '#475569' },
  section: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  textArea: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 80, textAlignVertical: 'top' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  fixedBox: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  fixedText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  fixedLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase' },
  smallDivider: { height: 1, backgroundColor: '#CBD5E1', marginVertical: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, backgroundColor: '#E2E8F0', marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: '#27AE60' },
  chipText: { color: '#475569', fontSize: 12 },
  chipTextActive: { color: 'white', fontSize: 12, fontWeight: '600' },
  addValueBtn: { padding: 6, borderRadius: 15, borderWidth: 1, borderColor: '#27AE60', marginBottom: 6 },
  taskRowFixed: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  taskTextFixed: { flex: 1, fontSize: 14, color: '#334155' },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  taskNumber: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  taskNumberText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  taskInput: { flex: 1, backgroundColor: 'white', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  modalChip: { padding: 10, borderRadius: 15, backgroundColor: '#F1F5F9', margin: 4 },
  closeModalBtn: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeModalBtnText: { color: 'white', fontWeight: 'bold' }
});