import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getTransfers, getLiveRates, getWallets, TransferOut, RatePreview, WalletOut } from '../../services/api';

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}`;
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

const FLAG: Record<string, string> = {
  TZS: '🇹🇿', KRW: '🇰🇷', KES: '🇰🇪', RWF: '🇷🇼', BIF: '🇧🇮', UGX: '🇺🇬', USD: '🇺🇸',
};
const CURRENCY_NAME: Record<string, string> = {
  TZS: 'Tanzanian Shilling', KRW: 'South Korean Won', KES: 'Kenyan Shilling',
  RWF: 'Rwandan Franc', BIF: 'Burundian Franc', UGX: 'Ugandan Shilling', USD: 'US Dollar',
};
const CURRENCY_SYMBOL: Record<string, string> = {
  TZS: 'TZS', KRW: '₩', KES: 'KES', RWF: 'RWF', BIF: 'BIF', UGX: 'UGX', USD: '$',
};
function chipLabel(to: string) {
  return `${FLAG[to] ?? ''} ${to}`;
}

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [transfers, setTransfers] = useState<TransferOut[]>([]);
  const [rates, setRates] = useState<RatePreview[]>([]);
  const [wallets, setWallets] = useState<WalletOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [txs, rs, ws] = await Promise.all([
        getTransfers(token),
        getLiveRates(token).catch(() => [] as RatePreview[]),
        getWallets(token).catch(() => [] as WalletOut[]),
      ]);
      setTransfers(txs);
      setRates(rs);
      setWallets(ws);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const navigation = useNavigation();

  useEffect(() => {
    fetchData();
    const unsub = navigation.addListener('focus', fetchData);
    return unsub;
  }, [navigation, fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };
  const recent = transfers.slice(0, 5);
  const primaryWallet = wallets.find(w => w.is_primary) ?? wallets[0] ?? null;
  const primaryCurrency = primaryWallet?.currency ?? 'TZS';
  // Show rates from primary currency to other currencies
  const displayRates = rates.filter(r => r.from_currency === primaryCurrency);
  // Fallback: if primary isn't TZS, also check reverse mapping from the rate list
  const rateForDisplay = displayRates.length > 0 ? displayRates : rates.slice(0, 3);

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
          <Text style={styles.greeting}>{user ? getGreeting(user.full_name) : 'Welcome'}</Text>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balance}>
            {primaryCurrency}{' '}
            {primaryWallet
              ? Number(primaryWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '0.00'}
          </Text>
          {rateForDisplay[0] && (
            <View style={styles.rateRow}>
              <Ionicons name="trending-up-outline" size={13} color={Colors.primaryDark} />
              <Text style={styles.rateRowText}>
                1 {rateForDisplay[0].from_currency} = {rateForDisplay[0].rate < 1 ? rateForDisplay[0].rate.toFixed(4) : rateForDisplay[0].rate.toFixed(2)} {rateForDisplay[0].to_currency}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.addMoneyBtn} onPress={() => router.push('/add-money')}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Live Rates strip */}
        {rateForDisplay.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Rates</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/send')}>
                <Text style={styles.link}>Send →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              {rateForDisplay.map(r => {
                const key = `${r.from_currency}-${r.to_currency}`;
                const label = chipLabel(r.to_currency);
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.rateChip}
                    onPress={() => router.push('/(tabs)/send')}
                  >
                    <Text style={styles.rateChipLabel}>{label}</Text>
                    <Text style={styles.rateChipValue}>
                      {r.rate < 1 ? r.rate.toFixed(4) : r.rate.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Wallets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
          <TouchableOpacity onPress={() => router.push('/add-wallet')}>
            <Text style={styles.link}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {wallets.length === 0 ? (
          <TouchableOpacity style={styles.emptyWallet} onPress={() => router.push('/add-wallet')}>
            <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            <Text style={styles.emptyWalletText}>No wallets yet — tap to add one</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {wallets.map((w, i) => {
              const isDark = i > 0;
              const symbol = CURRENCY_SYMBOL[w.currency] ?? w.currency;
              const name = CURRENCY_NAME[w.currency] ?? w.currency;
              return (
                <View key={w.id} style={[styles.walletCard, isDark && styles.walletCardDark]}>
                  <Text style={[styles.walletType, isDark && styles.walletTypeDark]}>
                    {name.toUpperCase()}
                  </Text>
                  <Text style={[styles.walletAmount, isDark && styles.walletAmountDark]}>
                    {symbol} {Number(w.balance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}
            <TouchableOpacity style={styles.addWalletCard} onPress={() => router.push('/add-wallet')}>
              <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
              <Text style={styles.addWalletText}>Add{'\n'}Wallet</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Action icon="paper-plane-outline" label="Send" onPress={() => router.push('/(tabs)/send')} />
          <Action icon="add-outline" label="Add Money" onPress={() => router.push('/add-money')} />
          <Action icon="help-circle-outline" label="Support" onPress={() => router.push('/support')} />
          <Action icon="person-outline" label="Account" onPress={() => router.push('/(tabs)/profile')} />
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  brand: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bell: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySoft,
  },
  balanceCard: { backgroundColor: '#F2FAF2', borderRadius: 22, padding: 18 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  balanceLabel: { color: Colors.textSecondary, marginTop: 8 },
  balance: { fontSize: 36, fontWeight: '800', color: Colors.text, marginTop: 4 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rateRowText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  addMoneyBtn: {
    marginTop: 16, backgroundColor: Colors.primary, borderRadius: 16,
    height: 50, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  addMoneyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHeader: {
    marginTop: 22, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  link: { color: Colors.primaryDark, fontWeight: '700' },
  rateChip: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginRight: 10, borderWidth: 1, borderColor: '#EEF2F6',
    alignItems: 'center', minWidth: 80,
  },
  rateChipLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  rateChipValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  walletCard: { backgroundColor: Colors.primary, borderRadius: 18, padding: 18, marginRight: 12, minWidth: 160 },
  walletCardDark: { backgroundColor: '#101828' },
  walletType: { color: '#D5F8DA', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  walletTypeDark: { color: '#98A2B3' },
  walletAmount: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 14 },
  walletAmountDark: { color: '#fff' },
  primaryBadge: {
    marginTop: 10, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyWallet: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primarySoft, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: Colors.primary,
  },
  emptyWalletText: { color: Colors.primaryDark, fontWeight: '600', fontSize: 14 },
  addWalletCard: {
    backgroundColor: Colors.primarySoft, borderRadius: 18, padding: 16,
    alignItems: 'center', justifyContent: 'center', minWidth: 90,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  addWalletText: { color: Colors.primary, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionItem: { alignItems: 'center', width: '24%' },
  actionIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 12, color: Colors.text, fontWeight: '600', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  txItem: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#EEF2F6',
  },
  txIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  txMeta: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txReceive: { fontSize: 12, color: Colors.success, marginTop: 2 },
});
