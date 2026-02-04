import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatsScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [daysClean, setDaysClean] = useState(0);
  const [totalRelaxed, setTotalRelaxed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mijlpalen voor nuchterheid
  const cleanMilestones = [
    { days: 1, label: 'Eerste Stap', icon: 'seed-outline', color: '#81C784' },
    { days: 7, label: 'Volhouder', icon: 'tree-outline', color: '#2E7D32' },
    { days: 30, label: 'Maand clean', icon: 'trophy-outline', color: '#FBC02D' },
  ];

  // Mijlpalen voor relaxatie
  const relaxMilestones = [
    { count: 1, label: 'Beginner', icon: 'leaf', color: '#A5D6A7' },
    { count: 10, label: 'Zen Zoeker', icon: 'meditation', color: '#81C784' },
    { count: 50, label: 'Zen Meester', icon: 'infinity', color: '#2E7D32' },
  ];

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Nuchterheid data
      const counterSnap = await getDoc(doc(db, "users", user.uid, "settings", "counter"));
      if (counterSnap.exists() && counterSnap.data().startDate) {
        const start = new Date(counterSnap.data().startDate);
        const diff = Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setDaysClean(diff >= 0 ? diff : 0);
      }

      // 2. Relaxatie data
      const relaxSnap = await getDoc(doc(db, "users", user.uid, "stats", "relaxStats"));
      if (relaxSnap.exists()) {
        setTotalRelaxed(relaxSnap.data().totalCompleted || 0);
      }

      // 3. Trek-historie (laatste 7 logs)
      const q = query(
        collection(db, "users", user.uid, "logbookEntries"), 
        orderBy("createdAt", "desc"), 
        limit(7)
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
    } catch (error) {
      console.error("Fout bij ophalen stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.header}>Mijn Voortgang 📈</Text>

      {/* SECTIE 1: NUCHTERHEID BADGES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nuchterheid Mijlpalen</Text>
        <View style={styles.badgeGrid}>
          {cleanMilestones.map((m) => {
            const isEarned = daysClean >= m.days;
            return (
              <View key={m.days} style={styles.badgeItem}>
                <View style={[styles.iconCircle, { backgroundColor: isEarned ? m.color : '#E0E0E0' }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={28} color={isEarned ? '#FFF' : '#9E9E9E'} />
                </View>
                <Text style={[styles.badgeLabel, { color: isEarned ? '#2C3E50' : '#9E9E9E' }]}>{m.label}</Text>
                <Text style={styles.badgeSub}>{daysClean}/{m.days} d.</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTIE 2: RELAXATIE BADGES */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Relaxatie Badges 🧘</Text>
        <View style={styles.badgeGrid}>
          {relaxMilestones.map((m) => {
            const isEarned = totalRelaxed >= m.count;
            return (
              <View key={m.count} style={styles.badgeItem}>
                <View style={[styles.iconCircle, { backgroundColor: isEarned ? m.color : '#E0E0E0' }]}>
                  <MaterialCommunityIcons name={m.icon as any} size={28} color={isEarned ? '#FFF' : '#9E9E9E'} />
                </View>
                <Text style={[styles.badgeLabel, { color: isEarned ? '#2C3E50' : '#9E9E9E' }]}>{m.label}</Text>
                <Text style={styles.badgeSub}>{totalRelaxed}/{m.count} sessies</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* SECTIE 3: TREK-INTENSITEIT */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trek-intensiteit (0-10)</Text>
        {history.length > 0 ? history.map((item) => (
          <View key={item.id} style={styles.statRow}>
            <Text style={styles.dateText}>{item.date}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.bar, { 
                width: `${(item.alcoholCraving || 0) * 10}%`, 
                backgroundColor: item.alcoholCraving > 7 ? '#E74C3C' : '#3498DB' 
              }]} />
            </View>
            <Text style={styles.scoreText}>{item.alcoholCraving}</Text>
          </View>
        )) : (
          <Text style={styles.emptyText}>Nog geen gegevens uit het logboek.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20, paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1A2E44', marginBottom: 25 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 15 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  badgeItem: { width: '30%', alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 55, height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  badgeLabel: { fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  badgeSub: { fontSize: 9, color: '#7F8C8D' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dateText: { width: 50, fontSize: 10, color: '#7F8C8D' },
  barContainer: { flex: 1, height: 10, backgroundColor: '#F0F4F8', borderRadius: 5, marginHorizontal: 10, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 5 },
  scoreText: { width: 15, fontWeight: 'bold', fontSize: 11 },
  emptyText: { fontStyle: 'italic', color: '#7F8C8D', textAlign: 'center' }
});