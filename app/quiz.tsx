import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth } from '../firebaseConfig'; 
import { doc, setDoc, collection, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { PHASE1_QUESTIONS, VALUE_QUESTIONS, CategoryType } from '../src/constants/questions';

export default function QuizScreen() {
  const router = useRouter();
  
  // Quiz Status
  const [phase, setPhase] = useState<1 | 2>(1);
  const [qIndex, setQIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Scores
  const [catScores, setCatScores] = useState<Record<CategoryType, number>>({
    ZELF: 0, VERBINDING: 0, PRESTATIE: 0, HARMONIE: 0, DYNAMIEK: 0
  });
  const [valScores, setValScores] = useState<Record<string, number>>({});

  // FASE 2: Dynamische selectie op basis van behoeften
  const filteredValueQuestions = useMemo(() => {
    if (phase === 1) return [];

    console.log("Fase 2 vragen aan het genereren...");
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

  // Huidige vragenlijst bepalen
  const currentQuestionsList = phase === 1 ? PHASE1_QUESTIONS : filteredValueQuestions;
  const currentQuestion = currentQuestionsList[qIndex];

  const handleAnswer = (points: number) => {
    if (!currentQuestion) return;

    if (phase === 1) {
      // Fase 1: Categorie scores bijwerken
      const cat = currentQuestion.cat as CategoryType;
      setCatScores(prev => ({ ...prev, [cat]: prev[cat] + points }));

      if (qIndex < PHASE1_QUESTIONS.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        setQIndex(0);
        setPhase(2);
      }
    } else {
      // Fase 2: Waarde scores bijwerken
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

    // Gebruik window.confirm voor web stabiliteit, Alert voor mobiel
    const msg = `Klaar! Jouw top 7 waarden zijn:\n\n${final7.join(', ')}\n\nWil je deze planten?`;
    
    if (typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(msg)) saveToFirebase(final7);
    } else {
      Alert.alert("Quiz Voltooid", msg, [{ text: "Planten", onPress: () => saveToFirebase(final7) }]);
    }
  };

  const saveToFirebase = async (values: string[]) => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      console.log("Bezig met opslaan naar Firebase...");
      
      const batch = writeBatch(db);

      // 1. Update hoofdbehoefte in user profiel
      const mainNeed = Object.entries(catScores).sort((a, b) => b[1] - a[1])[0][0];
      const userRef = doc(db, "users", user.uid);
      batch.set(userRef, { mainNeed, quizCompleted: true }, { merge: true });

      // 2. Verwijder eerst oude boom (optioneel, maar schoon)
      const treeColl = collection(db, "users", user.uid, "tree");
      const oldDocs = await getDocs(treeColl);
      oldDocs.forEach((d) => batch.delete(d.ref));

      // 3. Voeg de nieuwe 7 waarden toe
      values.forEach((val) => {
        const id = val.toLowerCase().replace(/\s/g, '_');
        const docRef = doc(db, "users", user.uid, "tree", id);
        batch.set(docRef, {
          name: val,
          level: 1,
          xp: 0,
          category: VALUE_QUESTIONS.find(q => q.value === val)?.cat || "ZELF",
          lastFed: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log("✅ Opslaan geslaagd!");
      router.replace('/tree'); 
    } catch (e) {
      console.error("❌ Firebase error:", e);
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

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Text>Vraag laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.questionText}>{currentQuestion.text}</Text>
        
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
  loadingText: { marginTop: 20, fontSize: 16, color: '#64748B', fontWeight: '500' }
});