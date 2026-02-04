import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importeer de picker alleen als we NIET op web zitten om fouten te voorkomen
let DateTimePicker: any;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [webDate, setWebDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { loadStartDate(); }, []);

  const loadStartDate = async () => {
    const user = auth.currentUser;
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid, "settings", "counter"));
      if (snap.exists() && snap.data().startDate) {
        const d = new Date(snap.data().startDate);
        setStartDate(d);
        setWebDate(d.toISOString().split('T')[0]);
      }
    }
  };

  const saveDate = async (selectedDate: Date) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid, "settings", "counter"), {
          startDate: selectedDate.toISOString(),
        }, { merge: true });
        setStartDate(selectedDate);
        Alert.alert("Succes", "Startdatum bijgewerkt!");
      } catch (e) { Alert.alert("Fout", "Opslaan mislukt."); }
    }
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (e) { Alert.alert("Fout", "Uitloggen mislukt."); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Instellingen ⚙️</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nuchterheid Teller</Text>
        <Text style={styles.label}>Huidige startdatum: {startDate.toLocaleDateString('nl-BE')}</Text>

        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={webDate}
            onChange={(e) => {
              const d = new Date(e.target.value);
              setWebDate(e.target.value);
              saveDate(d);
            }}
            style={webInputStyle}
          />
        ) : (
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <MaterialCommunityIcons name="calendar-edit" size={20} color="white" />
            <Text style={styles.dateBtnText}>Wijzig Startdatum</Text>
          </TouchableOpacity>
        )}

        {showPicker && Platform.OS !== 'web' && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event: any, d?: Date) => {
              setShowPicker(false);
              if (d) saveDate(d);
            }}
          />
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="white" />
        <Text style={styles.logoutText}>Account Uitloggen</Text>
      </TouchableOpacity>
    </View>
  );
}

// Inline style voor de web-input aangezien React Native styles geen 'input' herkennen
const webInputStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #DDD',
  width: '100%',
  fontSize: '16px',
  marginTop: '10px'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20, paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1A2E44', marginBottom: 25 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 3, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2C3E50' },
  label: { fontSize: 14, color: '#7F8C8D' },
  dateBtn: { flexDirection: 'row', backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  dateBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#E74C3C', padding: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  logoutText: { color: 'white', fontWeight: 'bold', marginLeft: 10 }
});