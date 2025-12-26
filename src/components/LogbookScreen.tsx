// src/components/LogbookScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

const LOG_ENTRIES_KEY = 'RecoveryLogEntries';

interface LogEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  alcoholCraving: number;
}

const LogbookScreen: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  // Vernieuw de lijst telkens als de tab geopend wordt
  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    try {
      const storedEntries = await AsyncStorage.getItem(LOG_ENTRIES_KEY);
      if (storedEntries) {
        const parsed = JSON.parse(storedEntries);
        // Sorteren: nieuwste (hoogste ID/timestamp) bovenaan
        const sorted = parsed.sort((a: LogEntry, b: LogEntry) => b.id.localeCompare(a.id));
        setEntries(sorted);
      }
    } catch (error) {
      console.error("Fout bij laden logboek:", error);
    }
  };

  const deleteEntry = async (id: string) => {
    console.log("Delete functie gestart voor ID:", id);

    const performDelete = async () => {
      try {
        const updatedEntries = entries.filter(entry => entry.id !== id);
        await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(updatedEntries));
        setEntries(updatedEntries);
        console.log("Item verwijderd uit opslag.");
      } catch (error) {
        console.error("Fout bij verwijderen:", error);
        Alert.alert("Fout", "Kon de notitie niet verwijderen.");
      }
    };

    // --- BROWSER / WEB COMPATIBILITEIT ---
    if (Platform.OS === 'web') {
      if (window.confirm("Weet je zeker dat je deze notitie wilt verwijderen?")) {
        await performDelete();
      }
    } else {
      // --- MOBIEL (iOS/Android) ---
      Alert.alert(
        "Verwijderen",
        "Weet je zeker dat je deze notitie wilt verwijderen?",
        [
          { text: "Annuleren", style: "cancel" },
          { text: "Verwijder", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Mijn Logboek</Text>
        <Text style={styles.headerSubtitle}>{entries.length} opgeslagen momenten</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Je logboek is nog leeg.</Text>
            <Text style={styles.emptySubText}>
              Gebruik het 5G-schema om je eerste reflectie op te slaan of leg een moment vast.
            </Text>
          </View>
        ) : (
          entries.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardDate}>{item.date}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                
                {/* VERWIJDER KNOP */}
                <TouchableOpacity 
                  onPress={() => {
                    console.log("Prullenbak ingedrukt voor:", item.id);
                    deleteEntry(item.id);
                  }}
                  style={styles.deleteButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />
              
              <Text style={styles.cardContent}>{item.content}</Text>
              
              <View style={styles.footerRow}>
                <View style={styles.cravingBadge}>
                  <Text style={styles.cravingText}>
                    Trek: {item.alcoholCraving}/10
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A2E44',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2E44',
    paddingRight: 10,
  },
  deleteButton: {
    backgroundColor: '#F9EBEB',
    padding: 10,
    borderRadius: 12,
  },
  deleteIcon: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginVertical: 12,
  },
  cardContent: {
    fontSize: 15,
    color: '#34495E',
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 15,
    alignItems: 'center',
  },
  cravingBadge: {
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cravingText: {
    fontSize: 13,
    color: '#2E86C1',
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2E44',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default LogbookScreen;