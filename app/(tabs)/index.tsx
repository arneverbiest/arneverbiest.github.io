import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, limit, writeBatch } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Native-only import
let DateTimePicker: any;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function HomeScreen() {
  const router = useRouter();
  
  const [days, setDays] = useState<number | null>(null);
  const [hasDateSet, setHasDateSet] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // NIEUW: Edit modus
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [webDate, setWebDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<{id: string, text: string}[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;
  const displayName = user?.email ? user.email.split('@')[0] : 'Gebruiker';
  const todayStr = new Date().toISOString().split('T')[0];

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
      const snap = await getDoc(actionPlanRef);
      
      if (snap.exists() && snap.data().lastDrinkDate) {
        const dateString = snap.data().lastDrinkDate;
        const startDate = new Date(dateString);
        const today = new Date();
        startDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        setDays(diffDays < 0 ? 0 : diffDays);
        setHasDateSet(true);
        setIsEditing(false); // Stop edit modus na succesvol laden
      } else {
        setHasDateSet(false);
      }
    } catch (e) { console.error("Counter error:", e); }
  };

  const saveDateToFirebase = async (dateStr: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid, "settings", "actionPlan"), {
        lastDrinkDate: dateStr
      }, { merge: true });
      
      setHasDateSet(true);
      setIsEditing(false);
      fetchCounter();
    } catch (e) { 
      Alert.alert("Fout", "Kon datum niet opslaan."); 
    }
  };

  const onNativeDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      saveDateToFirebase(dateStr);
    }
  };

  // Rest van de functies (tasks, check-in) blijven hetzelfde...
  const loadActiveTasks = async () => { /* ... zie vorige code ... */ };
  const checkIfAlreadyCheckedIn = async () => { /* ... zie vorige code ... */ };
  const submitCheckIn = async () => { /* ... zie vorige code ... */ };

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

        {/* TELLER OF ONBOARDING/EDIT */}
        {(!hasDateSet || isEditing) ? (
          <View style={styles.setupCard}>
            <View style={styles.setupHeader}>
                <Ionicons name="calendar-outline" size={32} color="#007AFF" />
                {isEditing && (
                    <TouchableOpacity onPress={() => setIsEditing(false)}>
                        <Ionicons name="close" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.setupTitle}>{isEditing ? "Datum aanpassen" : "Stel je startdatum in"}</Text>
            <Text style={styles.setupSub}>Wanneer was je laatste drankje?</Text>
            
            {Platform.OS === 'web' ? (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <input 
                  type="date" 
                  value={webDate}
                  onChange={(e) => setWebDate(e.target.value)}
                  max={todayStr}
                  style={webStyles.input}
                />
                <TouchableOpacity 
                  style={[styles.setupBtn, { marginTop: 15, width: '100%' }]} 
                  onPress={() => saveDateToFirebase(webDate)}
                >
                  <Text style={styles.setupBtnText}>Opslaan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.setupBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.setupBtnText}>Kies een nieuwe datum</Text>
              </TouchableOpacity>
            )}

            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                maximumDate={new Date()}
                display="default"
                onChange={onNativeDateChange}
              />
            )}
          </View>
        ) : (
          <View style={styles.counterSection}>
            <Text style={styles.counterValue}>{days}</Text>
            <View style={styles.labelContainer}>
                <Text style={styles.counterLabel}>DAGEN ALCOHOLVRIJ</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIcon}>
                    <Ionicons name="pencil-sharp" size={16} color="#94A3B8" />
                </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CHECK-IN CARD (Hetzelfde als voorheen) */}
        {!hasCheckedIn ? (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Dagelijkse Check-in</Text>
                {/* ... mood grid en taken ... */}
                <TouchableOpacity style={styles.mainBtn} onPress={() => {/* submit logic */}}>
                    <Text style={styles.mainBtnText}>Inchecken</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.doneContainer}>
                <Ionicons name="checkmark-circle" size={40} color="#27AE60" />
                <Text style={styles.doneText}>Je bent ingecheckt!</Text>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const webStyles = {
  input: {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    width: '100%',
    boxSizing: 'border-box' as const,
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#F8FAFC'
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  headerLabel: { fontSize: 14, color: '#94A3B8' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', textTransform: 'capitalize' },
  
  counterSection: { alignItems: 'center', marginBottom: 40 },
  counterValue: { fontSize: 90, fontWeight: '200', color: '#1E293B', letterSpacing: -2 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 2 },
  editIcon: { padding: 4 },

  setupCard: { backgroundColor: '#FFF', padding: 30, borderRadius: 28, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  setupHeader: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  setupTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 10 },
  setupSub: { fontSize: 14, color: '#64748B', marginTop: 5, marginBottom: 20 },
  setupBtn: { backgroundColor: '#1E293B', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 15, alignItems: 'center' },
  setupBtnText: { color: '#FFF', fontWeight: 'bold' },
  
  card: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 20 },
  mainBtn: { backgroundColor: '#1E293B', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 15 },
  mainBtnText: { color: '#FFF', fontWeight: 'bold' },
  doneContainer: { alignItems: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 28 },
  doneText: { color: '#1E293B', fontWeight: '600', marginTop: 10 }
});