import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const moodToScore: Record<string, number> = { '😔': 2, '😐': 5, '🙂': 8, '😁': 10 };

export default function WeekOverview() {
  const [currentLog, setCurrentLog] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [matrixTasks, setMatrixTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const categories = [
    { id: 'motivatie', label: '1. Motivatie', tags: ['abstinentie', 'noodplan', 'steunfiguren', 'acceptatie'], matrixTags: ['Verslaving'] },
    { id: 'bewustzijn', label: '2. Bewustzijn', tags: ['risicomanagement'], matrixTags: ['Verslaving'] },
    { id: 'persoonlijk', label: '3. Persoonlijk Herstel', tags: ['fysiek', 'mentaal'], matrixTags: ['Gezondheid'] },
    { id: 'sociaal_maatschappelijk', label: '4. Sociaal & Maatschappelijk', tags: ['thuissituatie', 'sociale_contacten', 'maatschappelijk'], matrixTags: ['Thuissituatie', 'Werk/Daginvulling', 'Vrije tijd', 'Sociaal'] },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weekSnap = await getDocs(query(collection(db, "users", user.uid, "week_evaluations"), orderBy("timestamp", "desc"), limit(1)));
      if (!weekSnap.empty) setCurrentLog(weekSnap.docs[0].data());

      const dailySnap = await getDocs(query(
        collection(db, "users", user.uid, "daily_logs"),
        where("timestamp", ">=", sevenDaysAgo),
        orderBy("timestamp", "desc")
      ));
      
      const dailyData = dailySnap.docs.map(d => ({
        ...d.data(),
        formattedDate: d.data().timestamp?.toDate().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })
      }));
      setDailyLogs(dailyData);

      const matrixSnap = await getDocs(query(collection(db, "users", user.uid, "goals_matrix"), where("status", "==", "actief")));
      setMatrixTasks(matrixSnap.docs.map(d => ({ 
        id: d.id, 
        category: d.data().category, 
        subTasks: d.data().subTasks || [] 
      })));

    } catch (e) { console.error("Data ophalen mislukt:", e); }
    finally { setLoading(false); }
  };

  const calculateAvgMood = () => {
    if (dailyLogs.length === 0) return 0;
    const total = dailyLogs.reduce((acc, log) => acc + (moodToScore[log.mood] || 0), 0);
    return total / dailyLogs.length;
  };

  const getCompletedTasksCount = (matrixTags: string[]) => {
    const allCompletedIds = dailyLogs.flatMap(log => log.selectedTasks || []).map(t => t.id);
    const categoryTaskIds = matrixTasks.filter(t => matrixTags.includes(t.category)).map(t => t.id);
    return allCompletedIds.filter(id => categoryTaskIds.includes(id)).length;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>Week Analyse</Text>
      </View>

      <View style={styles.dashboardRow}>
        <View style={[styles.statBox, { backgroundColor: '#1E293B' }]}>
          <Text style={styles.statLabel}>ALGEMENE SCORE</Text>
          <Text style={styles.statValue}>{currentLog?.scores?.['tevredenheid'] || '-'}</Text>
          <Text style={styles.statSub}>Weekevaluatie</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: '#007AFF' }]}>
          <Text style={styles.statLabel}>GEM. STEMMING</Text>
          <Text style={styles.statValue}>{calculateAvgMood().toFixed(1)}</Text>
          <Text style={styles.statSub}>Dagelijkse mood</Text>
        </View>
      </View>

      {/* NIEUW: DAGELIJKS LOGBOEK OVERZICHT */}
      <Text style={styles.subHeader}>Dagelijks Logboek (Laatste 7 dagen)</Text>
      <View style={styles.historyContainer}>
        {dailyLogs.length > 0 ? dailyLogs.map((log, index) => (
          <View key={index} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <Text style={styles.historyDate}>{log.formattedDate}</Text>
              <Text style={styles.historyEmoji}>{log.mood}</Text>
            </View>
            <View style={styles.completedTasksList}>
              {log.selectedTasks && log.selectedTasks.length > 0 ? (
                log.selectedTasks.map((task: any, i: number) => (
                  <View key={i} style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
                    <Text style={styles.completedBadgeText}>{task.title || task.displayTitle}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTasksHistory}>Geen taken geregistreerd.</Text>
              )}
            </View>
          </View>
        )) : <Text style={styles.noTasks}>Nog geen dagelijkse logs gevonden.</Text>}
      </View>

      <Text style={styles.subHeader}>Prestaties per Thema</Text>

      {categories.map((cat) => {
        const completedCount = getCompletedTasksCount(cat.matrixTags);
        const openTasks = matrixTasks.filter(t => cat.matrixTags.includes(t.category)).flatMap(t => t.subTasks);

        return (
          <View key={cat.id} style={styles.categoryCard}>
            <View style={styles.catHeader}>
              <View>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.taskCountText}>
                  <Ionicons name="checkmark-done" size={14} color="#27AE60" /> {completedCount} taken volbracht
                </Text>
              </View>
            </View>

            <View style={styles.subScoresContainer}>
              {cat.tags.map(tag => (
                <View key={tag} style={styles.subScoreRow}>
                  <Text style={styles.subScoreLabel}>{tag.charAt(0).toUpperCase() + tag.slice(1).replace('_', ' ')}</Text>
                  <Text style={styles.subScoreValue}>{currentLog?.scores?.[tag] || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#1E293B' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  dashboardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '48%', borderRadius: 20, padding: 15, elevation: 4 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  statSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginTop: 10, marginBottom: 15 },
  
  // History Styles
  historyContainer: { marginBottom: 20 },
  historyCard: { backgroundColor: 'white', borderRadius: 15, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 13, fontWeight: '600', color: '#64748B', textTransform: 'capitalize' },
  historyEmoji: { fontSize: 22 },
  completedTasksList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DCFCE7' },
  completedBadgeText: { fontSize: 11, color: '#166534', marginLeft: 4 },
  noTasksHistory: { fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' },

  categoryCard: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16, elevation: 2 },
  catHeader: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10 },
  catLabel: { fontSize: 11, fontWeight: 'bold', color: '#27AE60', textTransform: 'uppercase' },
  taskCountText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  subScoresContainer: { paddingVertical: 10 },
  subScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subScoreLabel: { fontSize: 12, color: '#64748B' },
  subScoreValue: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  noTasks: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginVertical: 10 }
});