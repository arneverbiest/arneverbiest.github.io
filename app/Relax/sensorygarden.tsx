import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { trackExerciseComplete } from '../../src/utils/progressTracker';

const tasks = [
  { id: 1, text: "Zoek 3 verschillende texturen (bijv. ruwe boomschors, zacht blad).", icon: "hand-pointing-up" },
  { id: 2, text: "Vind iets dat een felle kleur heeft die opvalt in de natuur.", icon: "palette-outline" },
  { id: 3, text: "Sluit je ogen en benoem het verste geluid dat je kunt horen.", icon: "ear-hearing" },
  { id: 4, text: "Ruik aan de lucht, een bloem of zelfs een steen. Wat neem je waar?", icon: "scent" },
  { id: 5, text: "Zoek een schaduwspel op de grond en kijk hoe het beweegt.", icon: "brightness-6" },
];

export default function SensoryGardenScreen() {
  const [completed, setCompleted] = useState<number[]>([]);
  const router = useRouter();

  const toggleTask = (id: number) => {
    if (completed.includes(id)) {
      setCompleted(completed.filter(item => item !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  const handleFinish = async () => {
    await trackExerciseComplete('sensorygarden');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Zintuigentuin 🌿</Text>
        <Text style={styles.subHeader}>Wandel rustig en vink de opdrachten af wanneer je ze met aandacht hebt uitgevoerd.</Text>

        {tasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={[styles.taskCard, completed.includes(task.id) && styles.taskCardDone]}
            onPress={() => toggleTask(task.id)}
          >
            <MaterialCommunityIcons 
              name={task.icon as any} 
              size={28} 
              color={completed.includes(task.id) ? "#27AE60" : "#34495E"} 
            />
            <Text style={[styles.taskText, completed.includes(task.id) && styles.taskTextDone]}>
              {task.text}
            </Text>
            <MaterialCommunityIcons 
              name={completed.includes(task.id) ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
              size={24} 
              color={completed.includes(task.id) ? "#27AE60" : "#BDC3C7"} 
            />
          </TouchableOpacity>
        ))}

        {completed.length === tasks.length && (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Wandeling Voltooien</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scrollContent: { padding: 25 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', marginBottom: 10 },
  subHeader: { fontSize: 16, color: '#546E7A', marginBottom: 30, lineHeight: 22 },
  taskCard: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 15, 
    alignItems: 'center',
    elevation: 2
  },
  taskCardDone: { backgroundColor: '#E8F5E9', elevation: 0 },
  taskText: { flex: 1, marginHorizontal: 15, fontSize: 15, color: '#34495E' },
  taskTextDone: { color: '#9E9E9E', textDecorationLine: 'line-through' },
  finishBtn: { backgroundColor: '#2E7D32', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  finishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});