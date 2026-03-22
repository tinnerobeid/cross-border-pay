import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getTransfers, TransferOut } from '../../services/api';

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const first = name.split(' ')[0];
  return `Good ${time}, ${first} 👋`;
}

function statusColor(status: string) {
  if (status === 'completed') return Colors.success;
  if (status === 'failed' || status === 'cancelled') return '#F04438';
  return '#F79009';
}

function Action({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [transfers, setTransfers] = useState<TransferOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransfers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getTransfers(token);
      setTransfers(data);
    } catch {
      // silent — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransfers();
  };

  const recent = transfers.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Top bar */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.brand}>Zuri Pay</Text>
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.greeting}>{user ? getGreeting(user.full_name) : 'Welcome 👋'}</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>TZS 0</Text>
          <TouchableOpacity style={styles.addMoneyBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Wallets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
          <Text style={styles.link}>+ Add</Text>
        </View>
        <View style={styles.walletRow}>
          <View style={[styles.walletCard, { flex: 1.2 }]}>
            <Text style={styles.walletType}>TANZANIAN SHILLING</Text>
            <Text style={styles.walletAmount}>TZS 0</Text>
          </View>
          <View style={[styles.walletCardDark, { flex: 0.8 }]}>
            <Text style={styles.walletTypeDark}>SOUTH KOREAN WON</Text>
            <Text style={styles.walletAmountDark}>₩ 0</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Action icon="paper-plane-outline" label="Send" onPress={() => router.push('/(tabs)/send')} />
          <Action icon="add-outline" label="Add Money" onPress={() => {}} />
          <Action icon="swap-horizontal-outline" label="Swap" onPress={() => {}} />
          <Action icon="ellipsis-horizontal" label="More" onPress={() => router.push('/(tabs)/profile')} />
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.link}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal-outline" size={36} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transfers yet</Text>
            <Text style={styles.emptySubtext}>Your recent transfers will appear here</Text>
          </View>
        ) : (
          recent.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={styles.txIcon}>
                <Ionicons name="paper-plane-outline" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txTitle}>
                  {tx.send_currency} → {tx.receive_currency}
                </Text>
                <Text style={[styles.txMeta, { color: statusColor(tx.status) }]}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txAmount}>
                  - {tx.send_currency} {Number(tx.send_amount).toLocaleString()}
                </Text>
                <Text style={styles.txReceive}>
                  + {tx.receive_currency} {Number(tx.receive_amount).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 100 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  brand: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  balanceCard: { backgroundColor: '#F2FAF2', borderRadius: 22, padding: 18 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  balanceLabel: { color: Colors.textSecondary, marginTop: 8 },
  balance: { fontSize: 36, fontWeight: '800', color: Colors.text, marginTop: 4 },
  addMoneyBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addMoneyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  link: { color: Colors.primaryDark, fontWeight: '700' },
  walletRow: { flexDirection: 'row', gap: 12 },
  walletCard: { backgroundColor: Colors.primary, borderRadius: 18, padding: 16 },
  walletCardDark: { backgroundColor: '#101828', borderRadius: 18, padding: 16 },
  walletType: { color: '#D5F8DA', fontSize: 11, fontWeight: '700' },
  walletAmount: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 10 },
  walletTypeDark: { color: '#98A2B3', fontSize: 11, fontWeight: '700' },
  walletAmountDark: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionItem: { alignItems: 'center', width: '24%' },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  txItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txMeta: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txReceive: { fontSize: 12, color: Colors.success, marginTop: 2 },
});
