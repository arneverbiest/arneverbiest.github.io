import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

interface ArchivedGoal {
  id: string;
  goal: string;
  category: string;
  completedHistory: { task: string; archivedAt: string }[];
}

export default function GrowthHistoryScreen() {
  const router = useRouter();
  const [archivedGoals, setArchivedGoals] = useState<ArchivedGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Haal alle matrix plannen op
      const q = query(collection(db, "users", user.uid, "goals_matrix"));
      const snap = await getDocs(q);
      
      const historyData: ArchivedGoal[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        // Alleen doelen tonen die daadwerkelijk een geschiedenis hebben
        if (data.completedHistory && data.completedHistory.length > 0) {
          historyData.push({
            id: doc.id,
            goal: data.goal,
            category: data.category,
            completedHistory: data.completedHistory.sort((a: any, b: any) => 
              new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
            )
          });
        }
      });
      setArchivedGoals(historyData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#27AE60" /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Groei-Historiek</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Jouw Overwinningen 🏆</Text>
          <Text style={styles.introText}>
            Elk afgevinkt stapje is een bewijs van je herstel. Kijk hoe ver je al gekomen bent.
          </Text>
        </View>

        {archivedGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nog geen gearchiveerde stapjes. Begin klein en vier je eerste succes!</Text>
          </View>
        ) : (
          archivedGoals.map((item) => (
            <View key={item.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.categoryLabel}>{item.category}</Text>
                <Text style={styles.mainGoalText}>{item.goal}</Text>
              </View>

              <View style={styles.historyList}>
                {item.completedHistory.map((history, index) => (
                  <View key={index} style={styles.historyItem}>
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.taskText}>{history.task}</Text>
                      <Text style={styles.dateText}>
                        Voltooid op {new Date(history.archivedAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginLeft: 15, color: '#1E293B' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  introCard: { backgroundColor: '#1E293B', padding: 20, borderRadius: 20, marginBottom: 25 },
  introTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  introText: { color: '#CBD5E1', fontSize: 14, lineHeight: 20 },

  goalCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  goalHeader: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15, marginBottom: 15 },
  categoryLabel: { fontSize: 10, fontWeight: 'bold', color: '#27AE60', textTransform: 'uppercase', marginBottom: 5 },
  mainGoalText: { fontSize: 16, fontWeight: 'bold', color: '#334155' },

  historyList: { paddingLeft: 5 },
  historyItem: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  checkCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  historyContent: { marginLeft: 12, flex: 1 },
  taskText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  dateText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  emptyState: { alignItems: 'center', marginTop: 50, paddingHorizontal: 40 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 15, lineHeight: 22 }
});