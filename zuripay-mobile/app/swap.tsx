import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { getWallets, swapWallets, getLiveRates, WalletOut } from '../services/api';

const CURRENCY_FLAG: Record<string, string> = {
  TZS: '🇹🇿', KRW: '🇰🇷', KES: '🇰🇪', RWF: '🇷🇼', BIF: '🇧🇮', UGX: '🇺🇬', USD: '🇺🇸',
};

export default function SwapScreen() {
  const { token } = useAuth();
  const [wallets, setWallets] = useState<WalletOut[]>([]);
  const [fromWallet, setFromWallet] = useState<WalletOut | null>(null);
  const [toWallet, setToWallet] = useState<WalletOut | null>(null);
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickingFrom, setPickingFrom] = useState(false);
  const [pickingTo, setPickingTo] = useState(false);

  useEffect(() => {
    if (!token) return;
    getWallets(token).then(ws => {
      setWallets(ws);
      if (ws.length >= 1) setFromWallet(ws[0]);
      if (ws.length >= 2) setToWallet(ws[1]);
    });
  }, [token]);

  useEffect(() => {
    if (!fromWallet || !toWallet || fromWallet.id === toWallet.id || !token) {
      setRate(null);
      return;
    }
    setLoadingRates(true);
    getLiveRates(token)
      .then(rates => {
        const r = rates.find(x => x.from_currency === fromWallet.currency && x.to_currency === toWallet.currency);
        setRate(r?.rate ?? null);
      })
      .catch(() => setRate(null))
      .finally(() => setLoadingRates(false));
  }, [fromWallet, toWallet, token]);

  const receiveAmount = rate && amount ? (parseFloat(amount) * rate).toFixed(2) : '—';

  const handleSwapDirection = () => {
    const tmp = fromWallet;
    setFromWallet(toWallet);
    setToWallet(tmp);
    setAmount('');
  };

  const handleConfirm = async () => {
    if (!fromWallet || !toWallet || !token) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (fromWallet.id === toWallet.id) {
      Alert.alert('Invalid', 'Select two different wallets.');
      return;
    }
    setLoading(true);
    try {
      const result = await swapWallets(fromWallet.id, toWallet.id, amt, token);
      Alert.alert(
        'Swap Complete',
        `${result.from_amount.toLocaleString()} ${result.from_currency} → ${result.to_amount.toLocaleString()} ${result.to_currency}\n\nNew ${result.from_currency} balance: ${result.from_new_balance.toLocaleString()}\nNew ${result.to_currency} balance: ${result.to_new_balance.toLocaleString()}`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Swap failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const WalletPicker = ({
    selected,
    exclude,
    onSelect,
    onClose,
  }: {
    selected: WalletOut | null;
    exclude?: number;
    onSelect: (w: WalletOut) => void;
    onClose: () => void;
  }) => (
    <View style={styles.pickerSheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>Select Wallet</Text>
      {wallets.filter(w => w.id !== exclude).map(w => (
        <TouchableOpacity
          key={w.id}
          style={[styles.walletOption, selected?.id === w.id && styles.walletOptionActive]}
          onPress={() => { onSelect(w); onClose(); }}
        >
          <Text style={styles.walletOptionFlag}>{CURRENCY_FLAG[w.currency] ?? '💱'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletOptionCurrency}>{w.currency}</Text>
            <Text style={styles.walletOptionBalance}>Balance: {Number(w.balance).toLocaleString()}</Text>
          </View>
          {selected?.id === w.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Swap</Text>
            <View style={{ width: 22 }} />
          </View>

          <Text style={styles.subtitle}>Exchange between your wallets instantly</Text>

          {/* From wallet */}
          <Text style={styles.label}>From Wallet</Text>
          {pickingFrom ? (
            <WalletPicker
              selected={fromWallet}
              exclude={toWallet?.id}
              onSelect={w => { setFromWallet(w); setAmount(''); }}
              onClose={() => setPickingFrom(false)}
            />
          ) : (
            <TouchableOpacity style={styles.walletSelector} onPress={() => setPickingFrom(true)}>
              <Text style={styles.walletSelectorFlag}>{fromWallet ? CURRENCY_FLAG[fromWallet.currency] ?? '💱' : '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletSelectorCurrency}>{fromWallet?.currency ?? 'Select'}</Text>
                {fromWallet && <Text style={styles.walletSelectorBalance}>Balance: {Number(fromWallet.balance).toLocaleString()}</Text>}
              </View>
              <Ionicons name="chevron-down" size={18} color="#98A2B3" />
            </TouchableOpacity>
          )}

          {/* Amount */}
          <Text style={[styles.label, { marginTop: 16 }]}>Amount</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#98A2B3"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.amountCurrency}>{fromWallet?.currency ?? ''}</Text>
          </View>
          {fromWallet && amount && parseFloat(amount) > fromWallet.balance && (
            <Text style={styles.errorText}>Exceeds available balance</Text>
          )}

          {/* Swap direction button */}
          <View style={styles.swapArrowWrap}>
            <TouchableOpacity style={styles.swapArrowBtn} onPress={handleSwapDirection}>
              <Ionicons name="swap-vertical" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* To wallet */}
          <Text style={styles.label}>To Wallet</Text>
          {pickingTo ? (
            <WalletPicker
              selected={toWallet}
              exclude={fromWallet?.id}
              onSelect={w => { setToWallet(w); }}
              onClose={() => setPickingTo(false)}
            />
          ) : (
            <TouchableOpacity style={styles.walletSelector} onPress={() => setPickingTo(true)}>
              <Text style={styles.walletSelectorFlag}>{toWallet ? CURRENCY_FLAG[toWallet.currency] ?? '💱' : '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletSelectorCurrency}>{toWallet?.currency ?? 'Select'}</Text>
                {toWallet && <Text style={styles.walletSelectorBalance}>Balance: {Number(toWallet.balance).toLocaleString()}</Text>}
              </View>
              <Ionicons name="chevron-down" size={18} color="#98A2B3" />
            </TouchableOpacity>
          )}

          {/* Rate preview */}
          {fromWallet && toWallet && fromWallet.id !== toWallet.id && (
            <View style={styles.rateCard}>
              {loadingRates ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : rate ? (
                <>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>Exchange Rate</Text>
                    <Text style={styles.rateValue}>1 {fromWallet.currency} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)} {toWallet.currency}</Text>
                  </View>
                  <View style={styles.rateRow}>
                    <Text style={styles.rateLabel}>You Receive</Text>
                    <Text style={[styles.rateValue, { color: Colors.primary, fontSize: 18 }]}>{receiveAmount} {toWallet.currency}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.noRateText}>Rate unavailable for this pair</Text>
              )}
            </View>
          )}

          {wallets.length < 2 && (
            <View style={styles.noWalletsHint}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.noWalletsText}>You need at least 2 wallets to swap. Add another wallet from the home screen.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || !fromWallet || !toWallet || !amount || wallets.length < 2) && { opacity: 0.5 }]}
            onPress={handleConfirm}
            disabled={loading || !fromWallet || !toWallet || !amount || wallets.length < 2}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="swap-horizontal" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Confirm Swap</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitle: { marginTop: 6, marginBottom: 20, color: Colors.textSecondary, fontSize: 14 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  walletSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#EEF2F6',
  },
  walletSelectorFlag: { fontSize: 28 },
  walletSelectorCurrency: { fontSize: 18, fontWeight: '800', color: Colors.text },
  walletSelectorBalance: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EEF2F6',
    paddingHorizontal: 16, height: 60,
  },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: Colors.text },
  amountCurrency: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  errorText: { marginTop: 4, color: '#F04438', fontSize: 12 },
  swapArrowWrap: { alignItems: 'center', marginVertical: 8 },
  swapArrowBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rateCard: {
    marginTop: 16, backgroundColor: '#fff', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#EEF2F6', gap: 12,
  },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { color: Colors.textSecondary, fontSize: 14 },
  rateValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  noRateText: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center' },
  noWalletsHint: {
    marginTop: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: 12, padding: 12,
  },
  noWalletsText: { flex: 1, color: Colors.primaryDark, fontSize: 13, lineHeight: 18 },
  pickerSheet: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#EEF2F6', padding: 16, marginBottom: 4,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  walletOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F1F5F9',
  },
  walletOptionActive: { backgroundColor: Colors.primarySoft, borderRadius: 10, paddingHorizontal: 8 },
  walletOptionFlag: { fontSize: 24 },
  walletOptionCurrency: { fontSize: 16, fontWeight: '700', color: Colors.text },
  walletOptionBalance: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  primaryBtn: {
    marginTop: 24, height: 54, borderRadius: 14,
    backgroundColor: Colors.primary, flexDirection: 'row',
    gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
