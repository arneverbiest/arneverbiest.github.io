import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, writeBatch } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
  const router = useRouter();
  
  // States voor teller en onboarding
  const [days, setDays] = useState<number | null>(null);
  const [hasDateSet, setHasDateSet] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // States voor Check-in
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<{id: string, text: string}[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
  const displayName = user?.email ? user.email.split('@')[0] : 'Gebruiker';
  const todayStr = new Date().toLocaleDateString('nl-BE');

  useFocusEffect(
    useCallback(() => {
      const initDashboard = async () => {
        if (!user) return;
        setLoading(true);
        await Promise.all([
          fetchCounter(),
          loadActiveTasks(),
          checkIfAlreadyCheckedIn()
        ]);
        setLoading(false);
      };
      initDashboard();
    }, [user])
  );

  const fetchCounter = async () => {
    try {
      const actionPlanRef = doc(db, "users", user!.uid, "settings", "actionPlan");
      const counterRef = doc(db, "users", user!.uid, "settings", "counter");
      const [snap1, snap2] = await Promise.all([getDoc(actionPlanRef), getDoc(counterRef)]);
      
      let dateString = null;
      if (snap1.exists() && snap1.data().lastDrinkDate) dateString = snap1.data().lastDrinkDate;
      else if (snap2.exists() && snap2.data().startDate) dateString = snap2.data().startDate;

      if (dateString) {
        const startDate = new Date(dateString);
        const today = new Date();
        startDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const diffDays = Math.floor(Math.abs(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        setDays(diffDays);
        setHasDateSet(true);
      } else {
        setHasDateSet(false);
      }
    } catch (e) { console.error("Counter error:", e); }
  };

  const saveInitialDate = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && user) {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        await setDoc(doc(db, "users", user.uid, "settings", "actionPlan"), {
          lastDrinkDate: dateStr
        }, { merge: true });
        setHasDateSet(true);
        fetchCounter();
      } catch (e) { Alert.alert("Fout", "Kon datum niet opslaan."); }
    }
  };

  const loadActiveTasks = async () => {
    try {
      const q = query(collection(db, "users", user!.uid, "todos"), where("completed", "==", false), limit(3));
      const snap = await getDocs(q);
      setActiveTasks(snap.docs.map(d => ({ id: d.id, text: d.data().task || d.data().text || "Taak" })));
    } catch (e) { console.error(e); }
  };

  const checkIfAlreadyCheckedIn = async () => {
    try {
      const q = query(collection(db, "users", user!.uid, "dailyCheckIns"), where("date", "==", todayStr), limit(1));
      const snap = await getDocs(q);
      setHasCheckedIn(!snap.empty);
    } catch (e) { console.error(e); }
  };

  const submitCheckIn = async () => {
    if (!mood) return Alert.alert("Hoi!", "Hoe voel je je vandaag?");
    try {
      const batch = writeBatch(db);
      selectedTasks.forEach(t => batch.update(doc(db, "users", user!.uid, "todos", t.id), { completed: true, completedAt: serverTimestamp() }));
      await addDoc(collection(db, "users", user!.uid, "dailyCheckIns"), { mood, completedTasks: selectedTasks, date: todayStr, createdAt: serverTimestamp() });
      await batch.commit();
      setHasCheckedIn(true);
      Alert.alert("Top!", "Je check-in is opgeslagen.");
    } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color="#007AFF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Welkom terug,</Text>
            <Text style={styles.headerTitle}>{displayName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* TELLER OF ONBOARDING */}
        {!hasDateSet ? (
          <View style={styles.setupCard}>
            <Ionicons name="calendar-outline" size={40} color="#007AFF" />
            <Text style={styles.setupTitle}>Stel je startdatum in</Text>
            <Text style={styles.setupSub}>Wanneer was je laatste drankje?</Text>
            <TouchableOpacity style={styles.setupBtn} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.setupBtnText}>Kies een datum</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={saveInitialDate}
              />
            )}
          </View>
        ) : (
          <View style={styles.counterSection}>
            <Text style={styles.counterValue}>{days}</Text>
            <Text style={styles.counterLabel}>DAGEN ALCOHOLVRIJ</Text>
          </View>
        )}

        {/* CHECK-IN CARD */}
        {!hasCheckedIn ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dagelijkse Check-in</Text>
            
            <Text style={styles.sectionLabel}>Hoe is je mood?</Text>
            <View style={styles.moodGrid}>
              {['😔', '😐', '🙂', '😁'].map(m => (
                <TouchableOpacity key={m} onPress={() => setMood(m)} style={[styles.moodBox, mood === m && styles.moodSelected]}>
                  <Text style={{fontSize: 26}}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTasks.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Doelen bereikt?</Text>
                {activeTasks.map(t => {
                  const isSel = selectedTasks.some(st => st.id === t.id);
                  return (
                    <TouchableOpacity key={t.id} onPress={() => setSelectedTasks(prev => isSel ? prev.filter(x => x.id !== t.id) : [...prev, t])} style={[styles.taskRow, isSel && styles.taskSelected]}>
                      <Ionicons name={isSel ? "checkmark-circle" : "ellipse-outline"} size={22} color={isSel ? "#27AE60" : "#CBD5E1"} />
                      <Text style={[styles.taskText, isSel && styles.taskTextDone]}>{t.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <TouchableOpacity style={styles.mainBtn} onPress={submitCheckIn}>
              <Text style={styles.mainBtnText}>Inchecken</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.doneContainer}>
            <Ionicons name="checkmark-circle" size={40} color="#27AE60" />
            <Text style={styles.doneText}>Je bent ingecheckt voor vandaag!</Text>
            <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/insight/daily-overview')}>
              <Text style={styles.historyBtnText}>Bekijk geschiedenis</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  headerLabel: { fontSize: 14, color: '#94A3B8' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', textTransform: 'capitalize' },
  
  counterSection: { alignItems: 'center', marginBottom: 40 },
  counterValue: { fontSize: 90, fontWeight: '200', color: '#1E293B', letterSpacing: -2 },
  counterLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 2 },

  setupCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 28, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  setupTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 15 },
  setupSub: { fontSize: 14, color: '#64748B', marginTop: 5, marginBottom: 20 },
  setupBtn: { backgroundColor: '#1E293B', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 15 },
  setupBtnText: { color: '#FFF', fontWeight: '600' },

  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12, marginTop: 10 },
  moodGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  moodBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  moodSelected: { backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#007AFF' },
  taskRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 10 },
  taskSelected: { backgroundColor: '#F0FDF4' },
  taskText: { marginLeft: 12, color: '#475569', fontSize: 15 },
  taskTextDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  mainBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 15 },
  mainBtnText: { color: '#FFF', fontWeight: 'bold' },

  doneContainer: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 28 },
  doneText: { color: '#1E293B', fontWeight: '600', marginTop: 10 },
  historyBtn: { marginTop: 15 },
  historyBtnText: { color: '#007AFF', fontWeight: 'bold' }
});