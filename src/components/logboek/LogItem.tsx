import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../ui/AppCard'; // Onze nieuwe herbruikbare kaart

export const LogItem = ({ item }: { item: any }) => {
  const is5G = item.type === '5G';
  
  return (
    <AppCard style={{ borderLeftWidth: 5, borderLeftColor: is5G ? '#E74C3C' : '#F39C12' }}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons 
          name={is5G ? "alert-circle-outline" : "notebook-check-outline"} 
          size={20} 
          color={is5G ? '#E74C3C' : '#F39C12'} 
        />
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.typeBadge}>{is5G ? '5G Schema' : 'Reflectie'}</Text>
      </View>

      {is5G ? (
        <View>
          <Text style={styles.mainContent}><Text style={styles.bold}>Gebeurtenis: </Text>{item.event}</Text>
          <Text style={styles.scoreText}>Trek: {item.alcoholCraving}/10</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.mainContent}><Text style={styles.bold}>Succes: </Text>{item.dailyWin}</Text>
          <Text style={styles.subContent}>Gevoel: {item.mood}</Text>
        </View>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateText: { marginLeft: 8, fontSize: 12, color: '#7F8C8D', flex: 1 },
  typeBadge: { fontSize: 10, fontWeight: 'bold', color: '#BDC3C7' },
  mainContent: { fontSize: 15, color: '#2C3E50', marginBottom: 4 },
  subContent: { fontSize: 13, color: '#7F8C8D', fontStyle: 'italic' },
  bold: { fontWeight: 'bold' },
  scoreText: { fontSize: 12, color: '#E74C3C', fontWeight: 'bold', marginTop: 4 },
});