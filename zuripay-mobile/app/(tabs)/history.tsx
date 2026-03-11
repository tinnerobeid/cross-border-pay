import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const tabs = ['All', 'Incoming', 'Outgoing', 'Swaps'];

const items = [
  { title: 'To Sarah Jenkins', sub: 'Domestic Transfer', status: 'Success', amount: '-$240.00', color: '#111827', icon: 'card-outline' },
  { title: 'From Mike Ross', sub: 'Incoming Payment', status: 'Success', amount: '+$1,500.00', color: Colors.success, icon: 'cash-outline' },
  { title: 'USD to EUR Swap', sub: 'Currency Swap', status: 'Success', amount: '$500.00', color: '#111827', icon: 'swap-horizontal-outline' },
  { title: 'Netflix Subscription', sub: 'Merchant Payment', status: 'Failed', amount: '-$15.99', color: '#9CA3AF', icon: 'alert-circle-outline' },
  { title: 'Apple Store', sub: 'Merchant Payment', status: 'Pending', amount: '-$1,299.00', color: '#111827', icon: 'bag-outline' },
];

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Transaction History</Text>
          <TouchableOpacity>
            <Ionicons name="search-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              {activeTab === tab ? <View style={styles.tabUnderline} /> : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>Domestic</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>Success</Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>Date Range</Text>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          </View>
        </View>

        <Text style={styles.dayLabel}>TODAY</Text>

        {items.slice(0, 3).map((item) => (
          <View key={item.title} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>
                  {item.sub} <Text style={{ color: item.status === 'Failed' ? '#EF4444' : item.status === 'Pending' ? '#F59E0B' : Colors.success }}>{item.status}</Text>
                </Text>
              </View>
            </View>
            <Text style={[styles.itemAmount, { color: item.color }]}>{item.amount}</Text>
          </View>
        ))}

        <Text style={styles.dayLabel}>YESTERDAY</Text>

        {items.slice(3).map((item) => (
          <View key={item.title} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIcon}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>
                  {item.sub} <Text style={{ color: item.status === 'Failed' ? '#EF4444' : '#F59E0B' }}>{item.status}</Text>
                </Text>
              </View>
            </View>
            <Text style={[styles.itemAmount, { color: item.color }]}>{item.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  tabsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 20,
  },
  tabBtn: { alignItems: 'center' },
  tabText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryDark, fontWeight: '800' },
  tabUnderline: {
    marginTop: 8,
    width: 24,
    height: 3,
    borderRadius: 99,
    backgroundColor: Colors.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F7F5',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  dayLabel: {
    marginTop: 18,
    marginBottom: 10,
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  itemSub: { marginTop: 2, fontSize: 13, color: Colors.textSecondary },
  itemAmount: { fontSize: 15, fontWeight: '800' },
});