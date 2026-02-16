import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NavHeader } from './NavHeader';

interface ValueItem { id: string; title: string; description: string; }

const ActValuesScreen: React.FC = () => {
  const [values, setValues] = useState<ValueItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => { loadValues(); }, []);

  const loadValues = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "settings", "actValues");
    const snap = await getDoc(docRef);
    if (snap.exists()) setValues(snap.data().items || []);
  };

  const syncValues = async (newList: ValueItem[]) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "settings", "actValues"), { items: newList });
  };

  const addValue = async () => {
    if (!newTitle.trim()) return;
    const newList = [...values, { id: Date.now().toString(), title: newTitle, description: newDesc }];
    setValues(newList);
    await syncValues(newList);
    setNewTitle(''); setNewDesc(''); setIsAdding(false);
  };

  const deleteValue = async (id: string) => {
    const newList = values.filter(v => v.id !== id);
    setValues(newList);
    await syncValues(newList);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <NavHeader title="Mijn Kompas 🧭" />
      {values.map((item) => (
        <View key={item.id} style={styles.valueCard}>
          <TouchableOpacity onPress={() => deleteValue(item.id)} style={styles.deleteBadge}><Text style={{color:'#fff'}}>✕</Text></TouchableOpacity>
          <Text style={styles.valueTitle}>{item.title}</Text>
          <Text>{item.description}</Text>
        </View>
      ))}
      {isAdding ? (
        <View style={styles.addCard}>
          <TextInput placeholder="Titel" value={newTitle} onChangeText={setNewTitle} style={styles.inputTitle} />
          <TextInput placeholder="Omschrijving" value={newDesc} onChangeText={setNewDesc} multiline style={styles.inputDesc} />
          <TouchableOpacity onPress={addValue} style={[styles.btn, styles.saveBtn]}><Text style={{color:'#fff'}}>Opslaan</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}><Text>+ Voeg waarde toe</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F4F8' },
  container: { padding: 20, paddingBottom: 60 },
  headerSection: { marginBottom: 20 },
  header: { fontSize: 26, fontWeight: 'bold', color: '#1A2E44' },
  subHeader: { fontSize: 16, color: '#7F8C8D' },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  valueCard: {
    backgroundColor: '#FFF',
    width: '48%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  deleteBadge: { position: 'absolute', right: -5, top: -5, backgroundColor: '#E74C3C', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  deleteIcon: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  valueTitle: { fontSize: 18, fontWeight: 'bold', color: '#8E44AD', marginBottom: 5 },
  valueDesc: { fontSize: 13, color: '#34495E' },
  emptyText: { textAlign: 'center', width: '100%', color: '#95A5A6', marginTop: 20 },
  addButton: { borderWidth: 2, borderColor: '#8E44AD', borderStyle: 'dashed', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: '#8E44AD', fontWeight: 'bold' },
  addCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginTop: 10, elevation: 4 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#95A5A6', marginBottom: 5 },
  inputTitle: { borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 15, fontSize: 16, padding: 5 },
  inputDesc: { borderBottomWidth: 1, borderBottomColor: '#EEE', fontSize: 14, minHeight: 50, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  btn: { flex: 0.48, padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtn: { backgroundColor: '#2ECC71' },
  cancelBtn: { backgroundColor: '#BDC3C7' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
});

export default ActValuesScreen;