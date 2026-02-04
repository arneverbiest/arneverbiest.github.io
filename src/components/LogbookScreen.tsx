import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LogbookScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchLogs = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setLoading(true);
        try {
          const q = query(collection(db, "users", user.uid, "logbookEntries"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchLogs();
    }, [])
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Mijn Logboek 📖</Text>
      
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>Nog geen logs gevonden. Begin met een 5G-analyse!</Text>
      ) : (
        logs.map((log) => {
          const isIncomplete = log.type === '5G_Quick';

          return (
            <TouchableOpacity 
              key={log.id} 
              style={[styles.logCard, isIncomplete && styles.incompleteCard]} 
              onPress={() => toggleExpand(log.id)}
              activeOpacity={0.7}
            >
              <View style={styles.logHeader}>
                <View>
                  <Text style={styles.logDate}>{log.date || "Datum onbekend"}</Text>
                  <Text style={[styles.logType, isIncomplete && { color: '#E67E22' }]}>
                    {isIncomplete ? '📝 Snelle Log (Incompleet)' : '🧠 Volledige Analyse'}
                  </Text>
                </View>
                <View style={[styles.cravingBadge, { backgroundColor: log.alcoholCraving > 6 ? '#FADBD8' : '#D6EAF8' }]}>
                  <Text style={{ color: log.alcoholCraving > 6 ? '#E74C3C' : '#3498DB', fontWeight: 'bold' }}>
                    Trek: {log.alcoholCraving}/10
                  </Text>
                </View>
              </View>

              <Text style={styles.previewText} numberOfLines={expandedId === log.id ? undefined : 2}>
                <Text style={{ fontWeight: 'bold' }}>Situatie: </Text>{log.gebeurtenis}
              </Text>

              {expandedId === log.id && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />
                  
                  {/* GEDACHTE */}
                  {!isIncomplete && (
                    <View style={styles.gRow}>
                      <Text style={styles.gLabel}>Gedachte:</Text>
                      <Text style={styles.gText}>{log.gedachte || "Niet ingevuld"}</Text>
                    </View>
                  )}

                  {/* GEVOEL */}
                  <View style={styles.gRow}>
                    <Text style={styles.gLabel}>Gevoel:</Text>
                    <Text style={styles.gText}>{log.gevoel}</Text>
                  </View>

                  {/* COPING SECTIE (Wat heeft geholpen) */}
                  {log.gebruikteCoping && log.gebruikteCoping.length > 0 && (
                    <View style={styles.copingBox}>
                      <Text style={styles.copingTitle}>🛠 Wat heeft geholpen:</Text>
                      <View style={styles.chipWrapper}>
                        {log.gebruikteCoping.map((item: string, index: number) => (
                          <View key={index} style={styles.actionChip}>
                            <Text style={styles.actionChipText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* GEDRAG & GEVOLG (Alleen bij volledige analyse) */}
                  {!isIncomplete && (
                    <>
                      <View style={styles.gRow}>
                        <Text style={styles.gLabel}>Gedrag:</Text>
                        <Text style={styles.gText}>{log.gedrag || "Niet ingevuld"}</Text>
                      </View>
                      <View style={styles.gRow}>
                        <Text style={styles.gLabel}>Gevolg:</Text>
                        <Text style={styles.gText}>{log.gevolg || "Niet ingevuld"}</Text>
                      </View>
                    </>
                  )}

                  {/* HELPENDE GEDACHTE */}
                  {log.helpend && (
                    <View style={styles.helpendBox}>
                      <Text style={styles.helpendLabel}>✨ Helpende Gedachte:</Text>
                      <Text style={styles.helpendText}>{log.helpend}</Text>
                    </View>
                  )}

                  {/* AANVUL KNOP VOOR QUICK LOGS */}
                  {isIncomplete && (
                    <TouchableOpacity 
                      style={styles.completeBtn}
                      onPress={() => router.push({
                        pathname: '/log/five-g-edit', 
                        params: { 
                          editId: log.id, 
                          prefilledEvent: log.gebeurtenis, 
                          prefilledFeeling: log.gevoel 
                        }
                      })}
                    >
                      <Ionicons name="flash" size={18} color="white" />
                      <Text style={styles.completeBtnText}>Analyse nu voltooien</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              <Text style={styles.tapHint}>
                {expandedId === log.id ? "Tik om in te klappen" : "Tik om details te zien"}
              </Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, color: '#1A2E44' },
  emptyText: { textAlign: 'center', color: '#7F8C8D', marginTop: 50, fontStyle: 'italic' },
  logCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  incompleteCard: { borderLeftWidth: 5, borderLeftColor: '#E67E22' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  logDate: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  logType: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  cravingBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  previewText: { fontSize: 14, color: '#34495E', lineHeight: 20 },
  expandedContent: { marginTop: 10 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  gRow: { marginBottom: 10 },
  gLabel: { fontSize: 12, fontWeight: 'bold', color: '#007AFF', marginBottom: 2 },
  gText: { fontSize: 14, color: '#2C3E50' },
  
  // Coping Styles
  copingBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  copingTitle: { fontSize: 11, fontWeight: 'bold', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionChip: { backgroundColor: '#3498DB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  helpendBox: { backgroundColor: '#E8F6F3', padding: 12, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#1ABC9C' },
  helpendLabel: { fontSize: 12, fontWeight: 'bold', color: '#16A085', marginBottom: 4 },
  helpendText: { fontSize: 14, color: '#16A085', fontStyle: 'italic' },
  
  completeBtn: { backgroundColor: '#E67E22', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, marginTop: 15, gap: 8 },
  completeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  
  tapHint: { fontSize: 10, color: '#BDC3C7', textAlign: 'center', marginTop: 15 }
});