import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter ,router } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function DailyOverview() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchCheckins = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
          // Let op: zorg dat de collectie naam exact overeenkomt met je index (dailyCheckIns)
          const q = query(collection(db, "users", user.uid, "dailyCheckIns"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setCheckins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchCheckins();
    }, [])
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#007AFF" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>

              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
                <Text style={styles.header}>Week Analyse</Text>
              </View>
        <FlatList
          data={checkins}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.mainInfo}>
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.date}>{item.date}</Text>
                    <Text style={styles.subDate}>Dagelijkse check-in</Text>
                  </View>
                  <Text style={styles.mood}>{item.mood}</Text>
                </View>

                {/* TO-DO SECTIE */}
                {item.completedTasks && item.completedTasks.length > 0 ? (
                  <View style={styles.tasksWrapper}>
                    <Text style={styles.taskTitle}>Voltooide doelen:</Text>
                    {item.completedTasks.map((task: any, index: number) => (
                      <View key={index} style={styles.taskTag}>
                        <Ionicons name="checkmark" size={14} color="#27AE60" />
                        <Text style={styles.taskText}>{task.text}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noTasks}>Geen taken geregistreerd</Text>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Je hebt nog geen check-ins gedaan.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1E293B', marginBottom: 25, marginTop: 10 },
  row: { 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  mainInfo: { flex: 1 },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
    marginBottom: 15
  },
  date: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  subDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  mood: { fontSize: 32 },
  
  tasksWrapper: { marginTop: 5 },
  taskTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  taskTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0FDF4', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 10, 
    marginBottom: 6,
    alignSelf: 'flex-start'
  },
  taskText: { marginLeft: 6, color: '#166534', fontSize: 13 },
  noTasks: { fontSize: 12, color: '#CBD5E1', fontStyle: 'italic' },
  
  empty: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontStyle: 'italic' }
});