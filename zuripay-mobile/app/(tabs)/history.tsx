import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getTransfers, TransferOut } from '../../services/api';

const PAGE_SIZE = 20;

type Tab = 'all' | 'international' | 'domestic';

function statusColor(s: string) {
  const u = s.toUpperCase();
  if (u === 'COMPLETED' || u === 'PROCESSED') return Colors.success;
  if (u === 'FAILED' || u === 'CANCELLED') return '#F04438';
  return '#F79009';
}

function isInternational(tx: TransferOut) {
  return tx.send_currency !== tx.receive_currency;
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [transfers, setTransfers] = useState<TransferOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const skipRef = useRef(0);

  const load = useCallback(async (reset = false) => {
    if (!token) return;
    const skip = reset ? 0 : skipRef.current;
    try {
      const data = await getTransfers(token, skip, PAGE_SIZE);
      if (reset) {
        setTransfers(data);
        skipRef.current = data.length;
      } else {
        setTransfers(prev => [...prev, ...data]);
        skipRef.current = skip + data.length;
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [token]);

  useEffect(() => { load(true); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const onEndReached = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    load(false);
  };

  const onTabChange = (t: Tab) => {
    setTab(t);
  };

  const filtered = transfers.filter(tx => {
    if (tab === 'international') return isInternational(tx);
    if (tab === 'domestic') return !isInternational(tx);
    return true;
  });

  const renderItem = ({ item: tx }: { item: TransferOut }) => (
    <View style={styles.txCard}>
      <View style={styles.txLeft}>
        <View style={[styles.txIcon, isInternational(tx) ? {} : { backgroundColor: '#FFF4E5' }]}>
          <Ionicons
            name={isInternational(tx) ? 'globe-outline' : 'phone-portrait-outline'}
            size={18}
            color={isInternational(tx) ? Colors.primary : '#E07B00'}
          />
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
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt-outline" size={44} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>
          {tab === 'domestic' ? 'No domestic transfers yet' :
           tab === 'international' ? 'No international transfers yet' :
           'No transactions yet'}
        </Text>
        <Text style={styles.emptySubtext}>
          {tab === 'domestic' ? 'Domestic transfers will appear here' : 'Your transfers will appear here'}
        </Text>
        {tab !== 'domestic' && (
          <TouchableOpacity style={styles.sendBtn} onPress={() => router.push('/(tabs)/send')}>
            <Text style={styles.sendBtnText}>Send Money</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['all', 'international', 'domestic'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => onTabChange(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'all' ? 'All' : t === 'international' ? 'International' : 'Domestic'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 4, marginHorizontal: 20, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEF2F6',
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Colors.primarySoft },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary, fontWeight: '800' },
  listContent: { paddingHorizontal: 20, paddingBottom: 90 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 14 },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },
  sendBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  txCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: '#EEF2F6',
  },
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
