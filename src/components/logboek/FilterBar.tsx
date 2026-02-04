import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const FilterBar = ({ activeFilter, onFilterChange }: any) => (
  <View style={styles.filterBar}>
    {['ALL', '5G', 'REFLECT'].map((f) => (
      <TouchableOpacity 
        key={f}
        style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]} 
        onPress={() => onFilterChange(f)}
      >
        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
          {f === 'ALL' ? 'Alles' : f === '5G' ? 'Triggers' : 'Successen'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#E0E7EE', borderRadius: 12, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  filterBtnActive: { backgroundColor: '#FFF' },
  filterText: { fontSize: 13, color: '#7F8C8D', fontWeight: '600' },
  filterTextActive: { color: '#1A2E44' },
});