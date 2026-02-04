import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReflectScreen() {
  const [mood, setMood] = useState('');
  const [win, setWin] = useState('');
  const [lesson, setLesson] = useState('');
  const router = useRouter();

  const saveReflect = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!mood || !win) {
      Alert.alert("Oeps", "Vul tenminste in hoe je je voelt en wat je succesje was!");
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "reflections"), {
        mood,
        dailyWin: win,
        lessonLearned: lesson,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('nl-BE'),
      });
      Alert.alert("Opgeslagen", "Mooi gedaan! Reflectie is de sleutel tot groei.");
      router.back();
    } catch (e) {
      Alert.alert("Fout", "Kon je reflectie niet opslaan.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dagelijkse Reflectie ✍️</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hoe voel je je op dit moment?</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Bijv: Rustig, onrustig, dankbaar..." 
          value={mood} 
          onChangeText={setMood} 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Wat was je grootste 'succesje' vandaag?</Text>
        <TextInput 
          style={[styles.input, { height: 80 }]} 
          placeholder="Iets kleins telt ook!" 
          multiline
          value={win} 
          onChangeText={setWin} 
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Wat heb je vandaag over jezelf geleerd?</Text>
        <TextInput 
          style={[styles.input, { height: 80 }]} 
          placeholder="Bijv: 'Ik heb meer trek als ik moe ben'..." 
          multiline
          value={lesson} 
          onChangeText={setLesson} 
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveReflect}>
        <Text style={styles.saveBtnText}>Reflectie Opslaan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A2E44', marginBottom: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  input: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, fontSize: 16, elevation: 1 },
  saveBtn: { backgroundColor: '#3498DB', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});