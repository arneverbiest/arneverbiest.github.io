import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GoalManager: React.FC = () => {
  const [newGoal, setNewGoal] = useState('');
  const [goals, setGoals] = useState<{id: string, text: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "settings", "allGoals"));
        if (snap.exists()) setGoals(snap.data().items || []);
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  };

  const saveGoals = async (updatedGoals: any[]) => {
    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, "users", user.uid, "settings", "allGoals"), { items: updatedGoals });
      setGoals(updatedGoals);
    }
  };

  const addGoal = () => {
    if (newGoal.trim().length < 2) return;
    const updated = [...goals, { id: Date.now().toString(), text: newGoal.trim() }];
    saveGoals(updated);
    setNewGoal('');
  };

  const removeGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    saveGoals(updated);
  };

  if (loading) return <ActivityIndicator color="#007AFF" />;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nieuw focusdoel..."
          value={newGoal}
          onChangeText={setNewGoal}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addGoal}>
          <MaterialCommunityIcons name="plus-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.goalRow}>
            <MaterialCommunityIcons name="target" size={20} color="#7F8C8D" />
            <Text style={styles.goalText}>{item.text}</Text>
            <TouchableOpacity onPress={() => removeGoal(item.id)}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#FFF', padding: 15, borderRadius: 15, fontSize: 16, elevation: 2 },
  addBtn: { marginLeft: 10 },
  goalRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    elevation: 1 
  },
  goalText: { flex: 1, marginLeft: 10, fontSize: 16, color: '#2C3E50' }
});

export default GoalManager;