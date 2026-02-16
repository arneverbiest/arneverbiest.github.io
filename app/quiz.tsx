import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig'; 
import { doc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
import { PHASE1_QUESTIONS, VALUE_QUESTIONS, CategoryType } from '../src/constants/questions';
import { NavHeader } from '@/src/components/NavHeader';

export default function QuizScreen() {
  const router = useRouter();
  
  // Quiz Status
  const [phase, setPhase] = useState<1 | 2>(1);
  const [qIndex, setQIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Resultaat Modal
  const [showResult, setShowResult] = useState(false);
  const [finalValues, setFinalValues] = useState<string[]>([]);
  
  // Scores
  const [catScores, setCatScores] = useState<Record<CategoryType, number>>({
    ZELF: 0, VERBINDING: 0, PRESTATIE: 0, HARMONIE: 0, DYNAMIEK: 0
  });
  const [valScores, setValScores] = useState<Record<string, number>>({});

  // FASE 2: Dynamische selectie op basis van behoeften
  const filteredValueQuestions = useMemo(() => {
    if (phase === 1) return [];

    const sortedCats = (Object.entries(catScores) as [CategoryType, number][])
      .sort((a, b) => b[1] - a[1]);

    const mainCat = sortedCats[0][0];
    const subCat = sortedCats[1][0];
    const others = sortedCats.slice(2).map(c => c[0]);

    const getQs = (cat: CategoryType, count: number) => 
      VALUE_QUESTIONS.filter(q => q.cat === cat)
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

    const selection = [
      ...getQs(mainCat, 18),
      ...getQs(subCat, 10),
      ...getQs(others[0] as CategoryType, 4),
      ...getQs(others[1] as CategoryType, 4),
      ...getQs(others[2] as CategoryType, 4),
    ];

    return selection.sort(() => Math.random() - 0.5);
  }, [phase]);

  const currentQuestionsList = phase === 1 ? PHASE1_QUESTIONS : filteredValueQuestions;
  const currentQuestion = currentQuestionsList[qIndex];

  const handleAnswer = (points: number) => {
    if (!currentQuestion) return;

    if (phase === 1) {
      const cat = currentQuestion.cat as CategoryType;
      setCatScores(prev => ({ ...prev, [cat]: prev[cat] + points }));

      if (qIndex < PHASE1_QUESTIONS.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        setQIndex(0);
        setPhase(2);
      }
    } else {
      const val = (currentQuestion as any).value;
      if (val) {
        setValScores(prev => ({ ...prev, [val]: (prev[val] || 0) + points }));
      }

      if (qIndex < filteredValueQuestions.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        finishQuiz();
      }
    }
  };

  const finishQuiz = () => {
    const final7 = Object.entries(valScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name]) => name);

    if (final7.length === 0) {
      Alert.alert("Fout", "Geen waarden gevonden. Probeer de quiz opnieuw.");
      return;
    }

    setFinalValues(final7);
    setShowResult(true);
  };

  const saveToFirebase = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setShowResult(false);
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      const mainNeed = Object.entries(catScores).sort((a, b) => b[1] - a[1])[0][0];
      
      const userRef = doc(db, "users", user.uid);
      
      // Cruciaal: Hier markeren we de onboarding als volledig afgerond
      batch.set(userRef, { 
        mainNeed, 
        quizCompleted: true,
        onboardingComplete: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Verwijder eventuele oude bomen als de gebruiker de quiz opnieuw doet
      const treeColl = collection(db, "users", user.uid, "tree");
      const oldDocs = await getDocs(treeColl);
      oldDocs.forEach((d) => batch.delete(d.ref));

      // Voeg de nieuwe 7 bomen toe
      finalValues.forEach((val) => {
        const id = val.toLowerCase().replace(/\s/g, '_');
        const docRef = doc(db, "users", user.uid, "tree", id);
        batch.set(docRef, {
          name: val,
          level: 1,
          xp: 0,
          category: VALUE_QUESTIONS.find(q => q.value === val)?.cat || "ZELF",
          lastFed: new Date().toISOString(),
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      router.replace('/(tabs)/tree'); 
    } catch (e) {
      console.error(e);
      Alert.alert("Fout bij opslaan", "Controleer je internetverbinding.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text style={styles.loadingText}>Je waarden worden omgezet in bomen...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader title="Waarden Quiz" />
      
      <View style={styles.header}>
        <Text style={styles.stepText}>STAP {phase} VAN 2</Text>
        <Text style={styles.phaseTitle}>{phase === 1 ? "Ontdek je Behoeften" : "Bepaal je Waarden"}</Text>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { 
            width: `${((qIndex + 1) / currentQuestionsList.length) * 100}%` 
          }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.questionText}>{currentQuestion?.text || "Vraag laden..."}</Text>
        
        <View style={styles.optionList}>
          {[
            { t: 'Helemaal waar', p: 4 },
            { t: 'Grotendeels waar', p: 3 },
            { t: 'Beetje waar', p: 2 },
            { t: 'Niet waar', p: 1 }
          ].map((opt) => (
            <TouchableOpacity 
              key={opt.t} 
              style={styles.optionBtn} 
              onPress={() => handleAnswer(opt.p)}
            >
              <Text style={styles.optionText}>{opt.t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* RESULTAAT MODAL */}
      <Modal visible={showResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🌳</Text>
            <Text style={styles.modalTitle}>Jouw resultaat</Text>
            <Text style={styles.modalSub}>Op basis van je antwoorden passen deze 7 waarden het beste bij je:</Text>
            
            <View style={styles.resultList}>
              {finalValues.map((v, i) => (
                <View key={i} style={styles.resultItem}>
                  <Text style={styles.resultItemText}>• {v}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveToFirebase}>
              <Text style={styles.saveBtnText}>Plant mijn tuin</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => { 
                setShowResult(false); 
                setPhase(1); 
                setQIndex(0); 
                setValScores({}); 
              }}
            >
              <Text style={styles.cancelBtnText}>Opnieuw doen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20, justifyContent: 'center' },
  header: { marginBottom: 30, marginTop: 40 },
  stepText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textAlign: 'center', letterSpacing: 1 },
  phaseTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', textAlign: 'center', marginBottom: 15 },
  progressBg: { width: '100%', height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#27AE60' },
  card: { backgroundColor: 'white', padding: 25, borderRadius: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
  questionText: { fontSize: 20, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 35, lineHeight: 28 },
  optionList: { gap: 12 },
  optionBtn: { backgroundColor: '#F1F5F9', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  optionText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#1E293B' },
  loadingText: { marginTop: 20, fontSize: 16, color: '#64748B', fontWeight: '500', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 25, alignItems: 'center' },
  modalEmoji: { fontSize: 50, marginBottom: 10 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  modalSub: { textAlign: 'center', color: '#64748B', marginBottom: 20 },
  resultList: { width: '100%', marginBottom: 25 },
  resultItem: { paddingVertical: 5 },
  resultItemText: { fontSize: 18, fontWeight: '600', color: '#334155' },
  saveBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 15, width: '100%', alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 15 },
  cancelBtnText: { color: '#94A3B8', fontWeight: 'bold' }
});