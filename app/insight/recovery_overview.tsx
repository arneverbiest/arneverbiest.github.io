import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WeekOverview() {
  const [currentLog, setCurrentLog] = useState<any>(null);
  const [prevLog, setPrevLog] = useState<any>(null);
  const [matrixTasks, setMatrixTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // De categorieën exact gekoppeld aan jouw Matrix-thema's
  const categories = [
    { 
      id: 'motivatie', 
      label: '1. Motivatie', 
      tags: ['abstinentie', 'noodplan', 'steunfiguren', 'acceptatie'], 
      matrixTags: ['Verslaving'] 
    },
    { 
      id: 'bewustzijn', 
      label: '2. Bewustzijn', 
      tags: ['risicomanagement'], 
      matrixTags: ['Verslaving'] 
    },
    { 
      id: 'persoonlijk', 
      label: '3. Persoonlijk Herstel', 
      tags: ['fysiek', 'mentaal'], 
      matrixTags: ['Gezondheid'] 
    },
    { 
      id: 'sociaal_maatschappelijk', 
      label: '4. Sociaal & Maatschappelijk', 
      tags: ['thuissituatie', 'sociale_contacten', 'maatschappelijk'], 
      matrixTags: ['Thuissituatie', 'Werk/Daginvulling', 'Vrije tijd', 'Sociaal'] 
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Haal de laatste 2 weekevaluaties op uit Firestore
      const logsSnap = await getDocs(query(
        collection(db, "users", user.uid, "week_evaluations"), 
        orderBy("timestamp", "desc"),
        limit(2)
      ));
      
      if (!logsSnap.empty) {
        setCurrentLog(logsSnap.docs[0].data());
        if (logsSnap.docs.length > 1) {
          setPrevLog(logsSnap.docs[1].data());
        }
      }

      // 2. Haal alle actieve Matrix-doelen op
      const matrixSnap = await getDocs(query(
        collection(db, "users", user.uid, "goals_matrix"), 
        where("status", "==", "actief")
      ));
      const tasks = matrixSnap.docs.map(d => ({
        category: d.data().category, // bijv. "Verslaving" of "Gezondheid"
        subTasks: d.data().subTasks || []
      }));
      setMatrixTasks(tasks);

    } catch (e) {
      console.error("Fout bij ophalen data:", e);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvg = (scoreMap: any, tags: string[]) => {
    if (!scoreMap) return 0;
    let total = 0, count = 0;
    tags.forEach(tag => {
      if (scoreMap[tag]) {
        total += scoreMap[tag];
        count++;
      }
    });
    return count > 0 ? total / count : 0;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  // Algemene Score Berekening
  const currentTotalScore = currentLog?.scores?.['tevredenheid'] || 0;
  const prevTotalScore = prevLog?.scores?.['tevredenheid'] || 0;
  const generalTasks = matrixTasks.filter(t => t.category === 'Persoonlijk').flatMap(t => t.subTasks);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>Week Analyse</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ALGEMENE SCORE SECTIE */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>ALGEMENE TEVREDENHEID</Text>
          <View style={styles.avgRow}>
            <Text style={styles.hugeScore}>{currentTotalScore > 0 ? currentTotalScore : '-'}</Text>
            {prevTotalScore > 0 && (
              <View style={[styles.trendBadge, { backgroundColor: currentTotalScore >= prevTotalScore ? '#E8F5E9' : '#FFEBEE' }]}>
                 <Ionicons name={currentTotalScore >= prevTotalScore ? 'arrow-up' : 'arrow-down'} size={14} color={currentTotalScore >= prevTotalScore ? '#27AE60' : '#E74C3C'} />
                 <Text style={{ fontWeight: 'bold', color: currentTotalScore >= prevTotalScore ? '#27AE60' : '#E74C3C', marginLeft: 4 }}>
                   {prevTotalScore}
                 </Text>
              </View>
            )}
          </View>
          <View style={styles.todoSection}>
            <Text style={styles.todoTitle}>Focus (Matrix: Persoonlijk):</Text>
            {generalTasks.length > 0 ? generalTasks.slice(0, 2).map((t, i) => (
              <Text key={i} style={styles.todoText} numberOfLines={1}>• {t}</Text>
            )) : <Text style={styles.noTasks}>Geen persoonlijke doelen.</Text>}
          </View>
        </View>

        <Text style={styles.subHeader}>Resultaten per thema</Text>

        {/* CATEGORIE KAARTEN */}
        {categories.map((cat) => {
          const avgScore = calculateAvg(currentLog?.scores, cat.tags);
          const prevAvg = calculateAvg(prevLog?.scores, cat.tags);
          // Filter de matrixTasks op basis van de array matrixTags (bijv. 'Verslaving' voor motivatie)
          const tasks = matrixTasks.filter(t => cat.matrixTags.includes(t.category)).flatMap(t => t.subTasks);

          return (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={styles.catHeader}>
                <View>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <View style={styles.avgRow}>
                    <Text style={styles.avgScore}>{avgScore > 0 ? avgScore.toFixed(1) : '-'}</Text>
                    {prevAvg > 0 && <Text style={styles.prevText}> vs {prevAvg.toFixed(1)}</Text>}
                  </View>
                </View>
              </View>

              {/* Onderliggende individuele scores */}
              <View style={styles.subScoresContainer}>
                {cat.tags.map(tag => (
                  <View key={tag} style={styles.subScoreRow}>
                    <Text style={styles.subScoreLabel}>{tag.charAt(0).toUpperCase() + tag.slice(1).replace('_', ' ')}</Text>
                    <Text style={[styles.subScoreValue, currentLog?.scores?.[tag] >= 8 ? styles.good : currentLog?.scores?.[tag] <= 4 ? styles.bad : null]}>
                      {currentLog?.scores?.[tag] || '-'}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Gekoppelde To-do's */}
              <View style={styles.todoSection}>
                <Text style={styles.todoTitle}>To-do's ({cat.matrixTags.join(', ')}):</Text>
                {tasks.length > 0 ? (
                  tasks.slice(0, 3).map((task, i) => (
                    <View key={i} style={styles.todoItem}>
                      <Ionicons name="chevron-forward" size={12} color="#27AE60" />
                      <Text style={styles.todoText} numberOfLines={1}>{task}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noTasks}>Geen actieve doelen gevonden.</Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', elevation: 2 },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#1E293B' },
  scrollContent: { padding: 16 },
  
  // Algemene Kaart
  totalCard: { backgroundColor: '#1E293B', borderRadius: 24, padding: 20, marginBottom: 25, elevation: 4 },
  totalLabel: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1 },
  hugeScore: { fontSize: 48, fontWeight: 'bold', color: 'white' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 15, alignSelf: 'center' },

  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },

  // Categorie Kaart
  categoryCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16, elevation: 2 },
  catHeader: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  catLabel: { fontSize: 11, fontWeight: 'bold', color: '#27AE60', textTransform: 'uppercase' },
  avgRow: { flexDirection: 'row', alignItems: 'baseline' },
  avgScore: { fontSize: 32, fontWeight: 'bold', color: '#1E293B' },
  prevText: { fontSize: 14, color: '#94A3B8', marginLeft: 8 },

  subScoresContainer: { paddingVertical: 10 },
  subScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subScoreLabel: { fontSize: 13, color: '#64748B' },
  subScoreValue: { fontSize: 14, fontWeight: 'bold', color: '#334155' },
  good: { color: '#27AE60' },
  bad: { color: '#E74C3C' },

  todoSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  todoTitle: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 5, textTransform: 'uppercase' },
  todoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  todoText: { fontSize: 12, color: '#475569', marginLeft: 5 },
  noTasks: { fontSize: 11, fontStyle: 'italic', color: '#CBD5E1' }
});