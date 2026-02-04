import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp, deleteDoc, arrayUnion } from 'firebase/firestore';

interface TaskPoolItem {
  id: string;
  matrixId: string;
  task: string;
  category: string;
}

interface ActiveTodo {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  activatedAt: any;
  sourceMatrixId: string;
}

export default function WeeklyGoalsScreen() {
  const router = useRouter();
  const [taskPool, setTaskPool] = useState<TaskPoolItem[]>([]);
  const [activeTodos, setActiveTodos] = useState<ActiveTodo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // 1. Haal Matrix plannen op
      const matrixSnap = await getDocs(query(collection(db, "users", user.uid, "goals_matrix"), where("status", "==", "actief")));
      
      // 2. Haal actieve To-Do's op
      const todoSnap = await getDocs(collection(db, "users", user.uid, "todos"));
      let todos: ActiveTodo[] = [];
      todoSnap.forEach((doc) => {
        todos.push({ id: doc.id, ...doc.data() } as ActiveTodo);
      });

      let pool: TaskPoolItem[] = [];
      matrixSnap.forEach((document) => {
        const data = document.data();
        const completedTasks = data.completedHistory?.map((h: any) => h.task) || [];
        
        if (data.subTasks) {
          data.subTasks.forEach((t: string, index: number) => {
            // FILTER: Alleen in pool als het NIET in actieve todos staat én NIET gearchiveerd is
            const isCurrentlyActive = todos.some(todo => todo.task === t);
            const isAlreadyDone = completedTasks.includes(t);

            if (!isCurrentlyActive && !isAlreadyDone) {
              pool.push({ 
                id: `${document.id}_${index}`, 
                matrixId: document.id, 
                task: t, 
                category: data.category 
              });
            }
          });
        }
      });
      
      setTaskPool(pool);
      setActiveTodos(todos);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const activateTask = async (item: TaskPoolItem) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "todos"), {
        task: item.task,
        category: item.category,
        completed: false,
        activatedAt: serverTimestamp(),
        sourceMatrixId: item.matrixId
      });
      
      setActiveTodos([{ id: docRef.id, task: item.task, category: item.category, completed: false, activatedAt: new Date(), sourceMatrixId: item.matrixId }, ...activeTodos]);
      setTaskPool(taskPool.filter(p => p.task !== item.task));
    } catch (e) { Alert.alert("Fout", "Kon taak niet activeren."); }
  };

  const toggleComplete = async (todo: ActiveTodo) => {
    const user = auth.currentUser;
    if (!user) return;
    const newStatus = !todo.completed;
    try {
      await updateDoc(doc(db, "users", user.uid, "todos", todo.id), { completed: newStatus });
      setActiveTodos(activeTodos.map(t => t.id === todo.id ? { ...t, completed: newStatus } : t));
    } catch (e) { console.error(e); }
  };

  const removeTodo = async (todo: ActiveTodo) => {
    const user = auth.currentUser;
    if (!user || todo.completed) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "todos", todo.id));
      // Terug naar pool (want het is niet voltooid/gearchiveerd)
      setTaskPool([...taskPool, { id: Date.now().toString(), matrixId: todo.sourceMatrixId, task: todo.task, category: todo.category }]);
      setActiveTodos(activeTodos.filter(t => t.id !== todo.id));
    } catch (e) { console.error(e); }
  };

  const archiveCompleted = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const completedOnes = activeTodos.filter(t => t.completed);
    if (completedOnes.length === 0) return Alert.alert("Info", "Vink eerst taken af.");

    try {
      for (const todo of completedOnes) {
        const matrixRef = doc(db, "users", user.uid, "goals_matrix", todo.sourceMatrixId);
        // Voeg toe aan geschiedenis van het hoofddoel
        await updateDoc(matrixRef, {
          completedHistory: arrayUnion({ 
            task: todo.task, 
            archivedAt: new Date().toISOString() 
          })
        });
        // Verwijder uit actieve To-Do lijst
        await deleteDoc(doc(db, "users", user.uid, "todos", todo.id));
      }
      setActiveTodos(activeTodos.filter(t => !t.completed));
      Alert.alert("Succes", "Deze stapjes zijn nu definitief voltooid!");
    } catch (e) { Alert.alert("Fout", "Archiveren mislukt."); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>Wekelijkse Focus</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* TASK POOL (De "Nog te doen" stapjes) */}
        <Text style={styles.sectionTitle}>Beschikbare stapjes</Text>
        <Text style={styles.helperText}>Wat pak je deze week op? (Nog niet voltooide items)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poolScroll}>
          {taskPool.length === 0 ? <Text style={styles.emptySmall}>Geen nieuwe stapjes meer over!</Text> : 
            taskPool.map((item) => (
              <TouchableOpacity key={item.id} style={styles.poolCard} onPress={() => activateTask(item)}>
                <Text style={styles.poolCategory}>{item.category}</Text>
                <Text style={styles.poolTask}>{item.task}</Text>
                <View style={styles.addIcon}><Ionicons name="add" size={16} color="white" /></View>
              </TouchableOpacity>
            ))
          }
        </ScrollView>

        <View style={styles.divider} />

        {/* TO DO LIJST (De actieve week) */}
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Deze week</Text>
          <TouchableOpacity 
            style={[styles.archiveBtn, activeTodos.some(t => t.completed) && styles.archiveBtnActive]} 
            onPress={archiveCompleted}
          >
            <Text style={[styles.archiveBtnText, activeTodos.some(t => t.completed) && {color: 'white'}]}>Archiveer</Text>
          </TouchableOpacity>
        </View>

        {activeTodos.map((todo) => (
          <View key={todo.id} style={[styles.todoCard, todo.completed && styles.todoCardDone]}>
            <TouchableOpacity style={styles.todoMain} onPress={() => toggleComplete(todo)}>
              <Ionicons name={todo.completed ? "checkmark-circle" : "ellipse-outline"} size={28} color={todo.completed ? "#27AE60" : "#CBD5E1"} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.todoCategory}>{todo.category}</Text>
                <Text style={[styles.todoText, todo.completed && styles.todoTextDone]}>{todo.task}</Text>
              </View>
            </TouchableOpacity>
            {!todo.completed && (
              <TouchableOpacity onPress={() => removeTodo(todo)}><Ionicons name="return-up-back-outline" size={22} color="#94A3B8" /></TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 15, color: '#1E293B' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  archiveBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#27AE60' },
  archiveBtnActive: { backgroundColor: '#27AE60' },
  archiveBtnText: { color: '#27AE60', fontWeight: 'bold', fontSize: 13 },
  helperText: { fontSize: 13, color: '#64748B', marginBottom: 15 },
  poolScroll: { marginBottom: 10 },
  poolCard: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginRight: 12, width: 140, elevation: 2 },
  poolCategory: { fontSize: 9, fontWeight: 'bold', color: '#27AE60', textTransform: 'uppercase' },
  poolTask: { fontSize: 13, color: '#1E293B', marginTop: 5, height: 35, fontWeight: '500' },
  addIcon: { position: 'absolute', right: 10, top: 10, backgroundColor: '#27AE60', borderRadius: 10, padding: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 25 },
  todoCard: { backgroundColor: 'white', padding: 15, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  todoCardDone: { backgroundColor: '#F1F5F9' },
  todoMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  todoCategory: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
  todoText: { fontSize: 16, color: '#334155', fontWeight: '500' },
  todoTextDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  emptySmall: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic', marginTop: 10 }
});