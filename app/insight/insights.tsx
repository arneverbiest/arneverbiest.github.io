import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NavHeader } from '@/src/components/NavHeader';

const screenWidth = Dimensions.get('window').width;

export default function InsightsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    topCoping: [] as any[],
    topFeelings: [] as any[],
    avgCraving: 0,
    totalLogs: 0,
    deepRatio: 0
  });

  useFocusEffect(
    useCallback(() => {
      const analyzeData = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setLoading(true);

        try {
          const q = query(collection(db, "users", user.uid, "logbookEntries"));
          const snap = await getDocs(q);
          const logs = snap.docs.map(doc => doc.data());

          // 1. Gemiddelde Craving
          const totalCraving = logs.reduce((acc, log) => acc + (log.alcoholCraving || 0), 0);
          const avgCraving = logs.length > 0 ? (totalCraving / logs.length).toFixed(1) : 0;

          // 2. Top Coping Acties
          const copingCounts: any = {};
          logs.forEach(log => {
            log.gebruikteCoping?.forEach((c: string) => {
              copingCounts[c] = (copingCounts[c] || 0) + 1;
            });
          });
          const sortedCoping = Object.entries(copingCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3);

          // 3. Top Gevoelens (Emotie Analyse)
          const feelingCounts: any = {};
          logs.forEach(log => {
            if (log.gevoel) {
              const f = log.gevoel.toLowerCase().trim();
              feelingCounts[f] = (feelingCounts[f] || 0) + 1;
            }
          });
          const sortedFeelings = Object.entries(feelingCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3);

          // 4. Ratio Snel vs Diep
          const deepLogs = logs.filter(l => l.type === '5G_Deep').length;
          const deepRatio = logs.length > 0 ? Math.round((deepLogs / logs.length) * 100) : 0;

          setStats({
            topCoping: sortedCoping,
            topFeelings: sortedFeelings,
            avgCraving: Number(avgCraving),
            totalLogs: logs.length,
            deepRatio
          });

        } catch (e) {
          console.error("Fout bij data analyse:", e);
        } finally {
          setLoading(false);
        }
      };

      analyzeData();
    }, [])
  );

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, marginTop: 50 }} color="#007AFF" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NavHeader title="" />
      <Text style={styles.header}>Jouw Inzichten 📊</Text>

      {/* Algemene Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#E74C3C" />
          <Text style={styles.statValue}>{stats.avgCraving}</Text>
          <Text style={styles.statLabel}>Gem. Trek</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="fitness" size={24} color="#27AE60" />
          <Text style={styles.statValue}>{stats.deepRatio}%</Text>
          <Text style={styles.statLabel}>Analyse Ratio</Text>
        </View>
      </View>

      {/* Top Coping */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛠 Wat helpt jou het beste?</Text>
        {stats.topCoping.length > 0 ? stats.topCoping.map(([name, count], i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.listText}>{name}</Text>
            <Text style={styles.listCount}>{count}x gebruikt</Text>
          </View>
        )) : <Text style={styles.emptyText}>Nog geen coping data beschikbaar.</Text>}
      </View>

      {/* Gevoelens Analyse */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎭 Veelvoorkomende Triggers</Text>
        <Text style={styles.subText}>Emoties die vaak voorafgaan aan trek:</Text>
        <View style={styles.feelingContainer}>
          {stats.topFeelings.map(([name, count], i) => (
            <View key={i} style={[styles.feelingTag, { opacity: 1 - i * 0.2 }]}>
              <Text style={styles.feelingTagText}>{name} ({count})</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Motivatie Card */}
      <View style={styles.motivationCard}>
        <Ionicons name="trophy" size={32} color="#F1C40F" />
        <Text style={styles.motivationTitle}>Lekker bezig!</Text>
        <Text style={styles.motivationText}>
          Je hebt al {stats.totalLogs} momenten vastgelegd. Elke analyse maakt je sterker tegen de trek.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1A2E44', marginBottom: 25 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statCard: { 
    backgroundColor: '#FFF', 
    width: (screenWidth - 50) / 2, 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A2E44', marginTop: 10 },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2E44', marginBottom: 15 },
  subText: { fontSize: 13, color: '#64748B', marginBottom: 15 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listText: { fontSize: 15, color: '#2C3E50', fontWeight: '500' },
  listCount: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' },
  feelingContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  feelingTag: { backgroundColor: '#E0E7FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25 },
  feelingTagText: { color: '#4338CA', fontWeight: 'bold', textTransform: 'capitalize' },
  motivationCard: { backgroundColor: '#1A2E44', padding: 25, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  motivationTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  motivationText: { color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  emptyText: { color: '#94A3B8', fontStyle: 'italic', textAlign: 'center' }
});