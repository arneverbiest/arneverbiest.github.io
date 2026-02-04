import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, updateDoc, writeBatch } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const [days, setDays] = useState(0);
  const [activeMatrixTasks, setActiveMatrixTasks] = useState<any[]>([]);
  
  // Veranderd naar Array voor meerdere selecties
  const [selectedTasks, setSelectedTasks] = useState<{id: string, text: string}[]>([]);
  
  const [mood, setMood] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
  const displayName = user?.email ? user.email.split('@')[0] : 'Gebruiker';

  useFocusEffect(
    useCallback(() => {
      const initDashboard = async () => {
        setLoading(true);
        await fetchCounter();
        await loadActiveMatrixTasks();
        await checkIfAlreadyCheckedIn();
        setLoading(false);
      };
      initDashboard();
    }, [])
  );

  const fetchCounter = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid, "settings", "counter"));
      if (snap.exists() && snap.data().startDate) {
        const startDate = new Date(snap.data().startDate);
        const today = new Date();
        const diffDays = Math.floor(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        setDays(diffDays);
      }
    } catch (e) { console.error(e); }
  };

  const loadActiveMatrixTasks = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "todos"), 
        where("completed", "==", false),
        limit(10)
      );
      const snap = await getDocs(q);
      const tasks = snap.docs.map(d => ({ 
        id: d.id, 
        displayTitle: d.data().task || d.data().text || "Naamloze taak" 
      }));
      setActiveMatrixTasks(tasks);
    } catch (e) { console.error("Fout bij laden Matrix taken:", e); }
  };

  const checkIfAlreadyCheckedIn = async () => {
    if (!user) return;
    const todayStr = new Date().toLocaleDateString('nl-BE');
    try {
      const q = query(collection(db, "users", user.uid, "dailyCheckIns"), where("date", "==", todayStr), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasCheckedIn(true);
        // Voor de weergave achteraf tonen we de opgeslagen tekst
        const data = snap.docs[0].data();
        setSelectedTasks(data.completedTasks || []);
      } else {
        setHasCheckedIn(false);
      }
    } catch (e) { console.error(e); }
  };

  const toggleTask = (id: string, text: string) => {
    setSelectedTasks(prev => {
      const isSelected = prev.find(t => t.id === id);
      if (isSelected) {
        return prev.filter(t => t.id !== id);
      } else {
        return [...prev, { id, text }];
      }
    });
  };

  const submitCheckIn = async () => {
    if (!user || !mood) {
      Alert.alert("Oeps", "Kies even hoe je je voelt!");
      return;
    }

    try {
      // Gebruik een Batch om alle taken tegelijk te updaten
      const batch = writeBatch(db);
      
      selectedTasks.forEach(task => {
        const ref = doc(db, "users", user.uid, "todos", task.id);
        batch.update(ref, { 
          completed: true, 
          completedAt: serverTimestamp() 
        });
      });

      // Sla de check-in op
      const checkInRef = collection(db, "users", user.uid, "dailyCheckIns");
      await addDoc(checkInRef, {
        mood,
        completedTasks: selectedTasks, // Slaat de hele lijst op
        date: new Date().toLocaleDateString('nl-BE'),
        createdAt: serverTimestamp()
      });

      await batch.commit();
      setHasCheckedIn(true);
      Alert.alert("Top!", "Je check-in is opgeslagen.");
    } catch (e) { 
      Alert.alert("Fout", "Er ging iets mis."); 
      console.error(e);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>Welkom terug,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
          <Ionicons name="person-circle-outline" size={45} color="#007AFF" />
        </View>

        <View style={styles.counterCard}>
          <Text style={styles.dayText}>{days}</Text>
          <Text style={styles.counterSub}>{days === 1 ? 'Dag' : 'Dagen'} Clean</Text>
        </View>

        {!hasCheckedIn ? (
          <View style={styles.checkInCard}>
            <Text style={styles.checkInTitle}>Dagelijkse Check-in ☀️</Text>
            
            <Text style={styles.label}>Hoe voel je je op dit moment?</Text>
            <View style={styles.moodRow}>
              {['😔', '😐', '🙂', '😁'].map(m => (
                <TouchableOpacity key={m} onPress={() => setMood(m)} 
                  style={[styles.moodBtn, mood === m && styles.selectedMood]}>
                  <Text style={{fontSize: 28}}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Welke taken heb je vandaag volbracht?</Text>
            <Text style={styles.subLabel}>(Geen selectie is ook oké)</Text>
            
            {activeMatrixTasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {activeMatrixTasks.map(task => {
                  const isSelected = selectedTasks.some(t => t.id === task.id);
                  return (
                    <TouchableOpacity 
                      key={task.id} 
                      onPress={() => toggleTask(task.id, task.displayTitle)}
                      style={[styles.taskOption, isSelected && styles.selectedTaskOption]}
                    >
                      <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={22} 
                        color={isSelected ? "#FFF" : "#007AFF"} 
                      />
                      <Text style={[styles.taskText, isSelected && styles.selectedTaskText]}>
                        {task.displayTitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push('/log/recovery_log')} style={styles.emptyTasks}>
                <Text style={styles.smallHint}>Geen actieve taken gevonden.</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.submitBtn, !mood && { opacity: 0.5 }]} 
              onPress={submitCheckIn}
            >
              <Text style={styles.submitBtnText}>Check-in Voltooien</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={32} color="#2ECC71" style={{marginBottom: 10}} />
            <Text style={styles.doneText}>Geregistreerd! ✨</Text>
            <View style={{marginTop: 10, alignItems: 'center'}}>
              <Text style={styles.doneSub}>
                {selectedTasks.length > 0 
                  ? `Je hebt ${selectedTasks.length} taak/taken afgerond.` 
                  : "Vandaag een rustdag qua Matrix-taken."}
              </Text>
              {selectedTasks.map((t, i) => (
                <Text key={i} style={styles.completedTaskTag}>• {t.text || (t as any).focusGoal}</Text>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 16, color: '#7F8C8D' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1A2E44', textTransform: 'capitalize' },
  counterCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 30, alignItems: 'center', elevation: 4, marginBottom: 20 },
  dayText: { fontSize: 72, fontWeight: '900', color: '#007AFF' },
  counterSub: { fontSize: 18, color: '#7F8C8D', fontWeight: 'bold', textTransform: 'uppercase' },
  checkInCard: { backgroundColor: '#FFF', padding: 25, borderRadius: 30, elevation: 3 },
  checkInTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1A2E44' },
  label: { fontSize: 15, color: '#34495E', marginBottom: 4, fontWeight: '600' },
  subLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 15 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  moodBtn: { padding: 12, borderRadius: 20, backgroundColor: '#F8F9FA', borderWidth: 2, borderColor: 'transparent' },
  selectedMood: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  tasksContainer: { marginBottom: 20 },
  taskOption: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, backgroundColor: '#F8F9FA', marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  selectedTaskOption: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  taskText: { marginLeft: 10, color: '#34495E', fontSize: 14, flex: 1 },
  selectedTaskText: { color: '#FFF', fontWeight: '500' },
  submitBtn: { backgroundColor: '#2ECC71', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  emptyTasks: { padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 15, marginBottom: 20 },
  smallHint: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
  doneCard: { backgroundColor: '#E8F6F3', padding: 25, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: '#2ECC71' },
  doneText: { color: '#16A085', fontWeight: 'bold', fontSize: 16 },
  doneSub: { color: '#16A085', fontSize: 14, textAlign: 'center' },
  completedTaskTag: { color: '#16A085', fontSize: 12, fontStyle: 'italic', marginTop: 2 }
});