import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getTransfers, TransferOut } from '../../services/api';

function statusColor(s: string) {
  const u = s.toUpperCase();
  if (u === 'COMPLETED' || u === 'PROCESSED') return Colors.success;
  if (u === 'FAILED' || u === 'CANCELLED') return '#F04438';
  return '#F79009';
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [transfers, setTransfers] = useState<TransferOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try { const data = await getTransfers(token); setTransfers(data); }
    catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[Colors.primary]} />}
      >
        <Text style={styles.title}>Transaction History</Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : transfers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={44} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transfers will appear here</Text>
            <TouchableOpacity style={styles.sendBtn} onPress={() => router.push('/(tabs)/send')}>
              <Text style={styles.sendBtnText}>Send Money</Text>
            </TouchableOpacity>
          </View>
        ) : (
          transfers.map(tx => (
            <View key={tx.id} style={styles.txCard}>
              <View style={styles.txLeft}>
                <View style={styles.txIcon}>
                  <Ionicons name="paper-plane-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{tx.send_currency} → {tx.receive_currency}</Text>
                  <Text style={styles.txRecipient}>{tx.recipient_name}</Text>
                  <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.txAmount}>-{Number(tx.send_amount).toLocaleString()} {tx.send_currency}</Text>
                <Text style={styles.txReceive}>+{Number(tx.receive_amount ?? 0).toLocaleString()} {tx.receive_currency}</Text>
                <View style={[styles.statusBadge, { borderColor: statusColor(tx.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(tx.status) }]}>{tx.status}</Text>
                </View>
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
  content: { padding: 20, paddingBottom: 90 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 14 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  sendBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  txCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6' },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txRecipient: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  txDate: { fontSize: 12, color: '#98A2B3', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txReceive: { fontSize: 12, color: Colors.success, marginTop: 2 },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
