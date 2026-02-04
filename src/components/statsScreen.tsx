import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;

const StatsScreen: React.FC = () => {
  const [chartData, setChartData] = useState<{ day: string, value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          const q = query(collection(db, "users", user.uid, "logbookEntries"), orderBy("createdAt", "desc"), limit(7));
          const snap = await getDocs(q);
          const logs = snap.docs.map(d => d.data());
          setChartData(logs.reverse().map(l => ({
            day: l.date ? l.date.split('/')[0] + '/' + l.date.split('/')[1] : '?',
            value: l.alcoholCraving || 0
          })));
        } finally { setLoading(false); }
      };
      fetchLogs();
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.header}>Statistieken 📊</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trek Verloop (Laatste 7 logs)</Text>
        {loading ? <ActivityIndicator color="#007AFF" /> : (
          <View style={styles.chartArea}>
            <View style={styles.barContainer}>
              {chartData.map((data, index) => (
                <View key={index} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: (data.value * 12) + 5, backgroundColor: data.value > 6 ? '#E74C3C' : '#3498DB' }]} />
                  <Text style={styles.barLabel}>{data.value}</Text>
                  <Text style={styles.dayLabel}>{data.day}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      
      {/* Ruimte voor toekomstige statistieken */}
      <View style={[styles.card, { marginTop: 20, opacity: 0.5 }]}>
        <Text>Toekomstige stats (bijv. Stemming)...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1A2E44' },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#7F8C8D', marginBottom: 20 },
  chartArea: { height: 160, justifyContent: 'flex-end' },
  barContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  barWrapper: { alignItems: 'center', width: (SCREEN_WIDTH - 80) / 7 },
  bar: { width: 14, borderRadius: 7, marginBottom: 5 },
  barLabel: { fontSize: 10, fontWeight: 'bold' },
  dayLabel: { fontSize: 9, color: '#95A5A6', marginTop: 5 }
});

export default StatsScreen;