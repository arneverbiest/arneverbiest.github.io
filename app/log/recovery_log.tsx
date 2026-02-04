import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy, limit } from 'firebase/firestore';

const recoveryCategories = [
  { 
    id: 'motivatie', 
    title: '1. Motivatie', 
    questions: [
      { id: 'abstinentie', label: 'Ik koos deze week voor totale abstinentie', hint: 'Bijv: "Lukt goed" of "Moeilijk weekend"' },
      { id: 'noodplan', label: 'Ik heb mijn noodplan paraat en actueel', hint: 'Bijv: "CrisisBOX aangevuld"' },
      { id: 'steunfiguren', label: 'Mijn steunfiguren zijn betrokken geweest', hint: 'Bijv: "Gesprek met partner gehad"' },
      { id: 'acceptatie', label: 'Acceptatie van het proces deze week', hint: 'Bijv: "Rust gevonden in schema"' }
    ] 
  },
  { 
    id: 'bewustzijn', 
    title: '2. Bewustzijn', 
    questions: [
      { id: 'risicomanagement', label: 'Omgang met risico-situaties en triggers', hint: 'Bijv: "Feestje overgeslagen" of "Supermarkt route aangepast"' }
    ] 
  },
  { 
    id: 'actieve_verandering', 
    title: '3. Actieve verandering', 
    subSections: [
      {
        title: 'Persoonlijk herstel',
        questions: [
          { id: 'fysiek', label: 'Fysiek (Slaap, voeding, ritme)', hint: 'Bijv: "Vaste wektijd aangehouden"' },
          { id: 'mentaal', label: 'Mentaal en emotioneel welzijn', hint: 'Bijv: "Minder piekeren door mindfulness"' }
        ]
      },
      {
        title: 'Sociaal herstel',
        questions: [
          { id: 'thuissituatie', label: 'Tevredenheid over de thuissituatie', hint: 'Bijv: "Sfeer was ontspannen"' },
          { id: 'sociale_contacten', label: 'Kwaliteit van sociale contacten', hint: 'Bijv: "Nieuwe nuchtere vriend gesproken"' }
        ]
      },
      {
        title: 'Maatschappelijk herstel',
        questions: [
          { id: 'maatschappelijk', label: 'Evenwicht werk/vrije tijd & daginvulling', hint: 'Bijv: "Vrijwilligerswerk opgestart" of "LinkedIn bijgewerkt"' }
        ]
      }
    ]
  },
  { 
    id: 'welzijn', 
    title: '4. Algemene weekevaluatie', 
    questions: [
      { id: 'tevredenheid', label: 'Hoe tevreden ben je over deze week in totaal?', hasNote: false }
    ] 
  },
];

const ScorePicker = ({ value, onChange, disabled }: any) => (
  <View style={styles.scoreRow}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
      <TouchableOpacity
        key={num}
        disabled={disabled}
        style={[styles.scoreButton, value === num && styles.scoreButtonActive]}
        onPress={() => onChange(num)}
      >
        <Text style={[styles.scoreText, value === num && styles.scoreTextActive]}>{num}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function WeekEvaluation() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We checken of er deze week al een evaluatie is gedaan
    checkThisWeekLog();
  }, []);

  const checkThisWeekLog = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      const q = query(
        collection(db, "users", user.uid, "week_evaluations"), 
        where("timestamp", ">=", oneWeekAgo), 
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Optioneel: Je kunt de gebruiker de oude laten zien of een nieuwe laten maken
        // Voor nu vullen we hem niet in zodat ze elke week een nieuwe kunnen doen
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const saveLog = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "week_evaluations"), {
        scores,
        notes,
        timestamp: serverTimestamp(),
      });
      setIsLocked(true);
      Alert.alert("Opgeslagen", "Je weekevaluatie is succesvol verwerkt.");
      router.back();
    } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
  };

  if (loading) return <ActivityIndicator style={{flex:1}} color="#27AE60" />;

  const renderQuestion = (q: any) => (
    <View key={q.id} style={styles.questionContainer}>
      <Text style={styles.questionLabel}>{q.label}</Text>
      <ScorePicker 
        value={scores[q.id] || 0} 
        onChange={(v: number) => setScores({...scores, [q.id]: v})} 
        disabled={isLocked}
      />
      {/* Geen comment vak als hasNote expliciet false is */}
      {q.hasNote !== false && (
        <TextInput
          style={styles.noteInput}
          placeholder={q.hint || "Notitie voor deze week..."}
          value={notes[q.id] || ''}
          onChangeText={(t) => setNotes({...notes, [q.id]: t})}
          editable={!isLocked}
        />
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Weekevaluatie</Text>
          <Text style={styles.headerSubtitle}>Terugblik op je herstelproces</Text>
        </View>
      </View>

      {recoveryCategories.map((cat) => (
        <View key={cat.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{cat.title}</Text>
          {cat.questions?.map(renderQuestion)}
          {cat.subSections?.map(sub => (
            <View key={sub.title} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>{sub.title}</Text>
              {sub.questions.map(renderQuestion)}
            </View>
          ))}
        </View>
      ))}

      {!isLocked && (
        <TouchableOpacity style={styles.saveBtn} onPress={saveLog}>
          <Text style={styles.saveBtnText}>Weekevaluatie Voltooien</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { paddingTop: 60, padding: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 14, color: '#64748B' },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#27AE60', marginBottom: 15 },
  subSection: { marginTop: 15, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#CBD5E1' },
  subSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#475569', marginBottom: 10 },
  questionContainer: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  questionLabel: { fontSize: 14, color: '#1E293B', fontWeight: '600', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreButton: { width: 30, height: 30, backgroundColor: '#F8FAFC', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  scoreButtonActive: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  scoreText: { fontSize: 12, fontWeight: 'bold', color: '#64748B' },
  scoreTextActive: { color: 'white' },
  noteInput: { marginTop: 10, fontSize: 12, color: '#64748B', fontStyle: 'italic', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 4 },
  saveBtn: { backgroundColor: '#1E293B', margin: 25, padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});