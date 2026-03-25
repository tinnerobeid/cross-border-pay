import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { createQuote, QuoteResponse } from '../../services/api';

interface Currency {
  code: string;
  name: string;
  country: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: 'TZS', name: 'Tanzanian Shilling', country: 'Tanzania', flag: '🇹🇿' },
  { code: 'KRW', name: 'South Korean Won', country: 'South Korea', flag: '🇰🇷' },
  { code: 'KES', name: 'Kenyan Shilling', country: 'Kenya', flag: '🇰🇪' },
  { code: 'RWF', name: 'Rwandan Franc', country: 'Rwanda', flag: '🇷🇼' },
  { code: 'BIF', name: 'Burundian Franc', country: 'Burundi', flag: '🇧🇮' },
  { code: 'UGX', name: 'Ugandan Shilling', country: 'Uganda', flag: '🇺🇬' },
  { code: 'USD', name: 'US Dollar', country: 'United States', flag: '🇺🇸' },
];

const DEFAULT_SEND = CURRENCIES[0]; // TZS
const DEFAULT_RECEIVE = CURRENCIES[1]; // KRW

function CurrencyPickerModal({
  visible,
  selected,
  exclude,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Currency;
  exclude: string;
  onSelect: (c: Currency) => void;
  onClose: () => void;
}) {
  const options = CURRENCIES.filter(c => c.code !== exclude);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Select Currency</Text>
        <FlatList
          data={options}
          keyExtractor={item => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.currencyOption, item.code === selected.code && styles.currencyOptionActive]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={styles.currencyFlag}>{item.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.currencyCode}>{item.code}</Text>
                <Text style={styles.currencyName}>{item.name}</Text>
              </View>
              {item.code === selected.code && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

export default function SendScreen() {
  const { token } = useAuth();
  const [sendCurr, setSendCurr] = useState<Currency>(DEFAULT_SEND);
  const [receiveCurr, setReceiveCurr] = useState<Currency>(DEFAULT_RECEIVE);
  const [pickerFor, setPickerFor] = useState<'send' | 'receive' | null>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numericAmount = Number(amount || 0);

  const fetchQuote = useCallback(async (amt: number, send: Currency, receive: Currency) => {
    if (!token || amt <= 0) { setQuote(null); setQuoteError(''); return; }
    setQuoteLoading(true); setQuoteError('');
    try {
      const q = await createQuote({
        send_country: send.country,
        receive_country: receive.country,
        send_currency: send.code,
        receive_currency: receive.code,
        send_amount: amt,
      }, token);
      setQuote(q);
    } catch (e: any) { setQuoteError(e.message); setQuote(null); }
    finally { setQuoteLoading(false); }
  }, [token]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchQuote(numericAmount, sendCurr, receiveCurr), 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [numericAmount, sendCurr, receiveCurr, fetchQuote]);

  const handleSwap = () => {
    setSendCurr(receiveCurr);
    setReceiveCurr(sendCurr);
    setAmount('');
    setQuote(null);
  };

  const handleSelectSend = (c: Currency) => {
    setSendCurr(c);
    if (c.code === receiveCurr.code) {
      setReceiveCurr(CURRENCIES.find(x => x.code !== c.code)!);
    }
    setQuote(null);
  };

  const handleSelectReceive = (c: Currency) => {
    setReceiveCurr(c);
    if (c.code === sendCurr.code) {
      setSendCurr(CURRENCIES.find(x => x.code !== c.code)!);
    }
    setQuote(null);
  };

  const canProceed = numericAmount > 0 && quote != null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Send Money</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Rate card */}
        <View style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateLabel}>EXCHANGE RATE</Text>
            <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
          </View>
          {quote ? (
            <>
              <Text style={styles.rateValue}>
                1 {sendCurr.code} = {quote.fx_rate.toFixed(4)} {receiveCurr.code}
              </Text>
              <Text style={styles.rateSub}>Rate locked for 1 minute</Text>
            </>
          ) : (
            <Text style={styles.rateValue}>Enter amount to see rate</Text>
          )}
        </View>

        {/* From */}
        <Text style={styles.fieldLabel}>From</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => setPickerFor('send')}>
          <Text style={styles.currencyFlagLg}>{sendCurr.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectCode}>{sendCurr.code}</Text>
            <Text style={styles.selectName}>{sendCurr.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Swap */}
        <View style={styles.swapWrap}>
          <TouchableOpacity style={styles.swapBtn} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* To */}
        <Text style={styles.fieldLabel}>To</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => setPickerFor('receive')}>
          <Text style={styles.currencyFlagLg}>{receiveCurr.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectCode}>{receiveCurr.code}</Text>
            <Text style={styles.selectName}>{receiveCurr.name}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount to send</Text>
        <View style={styles.amountBox}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#B7C0CC"
            keyboardType="numeric"
            style={styles.amountInput}
          />
          <Text style={styles.amountSuffix}>{sendCurr.code}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          {quoteLoading ? <ActivityIndicator color={Colors.primary} /> :
           quoteError ? <Text style={{ color: '#F04438', fontSize: 13 }}>{quoteError}</Text> :
           quote ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recipient receives</Text>
                <Text style={styles.summaryValue}>{Number(quote.receive_amount).toLocaleString()} {receiveCurr.code}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transfer fee</Text>
                {quote.transfer_type === 'domestic_free'
                  ? <Text style={[styles.summaryValue, { color: '#12B76A' }]}>FREE</Text>
                  : <Text style={styles.summaryValue}>{Number(quote.fee_amount).toLocaleString()} {sendCurr.code}</Text>
                }
              </View>
              <View style={[styles.summaryRow, { marginTop: 6 }]}>
                <Text style={styles.totalLabel}>Total to pay</Text>
                <Text style={styles.totalValue}>{Number(quote.total_cost).toLocaleString()} {sendCurr.code}</Text>
              </View>
            </>
           ) : (
            <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>
              Enter an amount to see the breakdown
            </Text>
           )}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canProceed && { opacity: 0.5 }]}
          disabled={!canProceed}
          onPress={() => router.push({
            pathname: '/transfer/confirm',
            params: {
              sendAmount: numericAmount.toFixed(2),
              receiveAmount: String(quote!.receive_amount),
              feeAmount: String(quote!.fee_amount),
              fxRate: String(quote!.fx_rate),
              sendCurrency: sendCurr.code,
              receiveCurrency: receiveCurr.code,
              sendCountry: sendCurr.country,
              receiveCountry: receiveCurr.country,
              transferType: quote!.transfer_type,
              isLinkedRecipient: 'false',
            },
          })}
        >
          <Text style={styles.primaryBtnText}>Review Transfer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.secureText}>Secure transaction powered by Zuri Pay</Text>
      </ScrollView>

      <CurrencyPickerModal
        visible={pickerFor === 'send'}
        selected={sendCurr}
        exclude={receiveCurr.code}
        onSelect={handleSelectSend}
        onClose={() => setPickerFor(null)}
      />
      <CurrencyPickerModal
        visible={pickerFor === 'receive'}
        selected={receiveCurr}
        exclude={sendCurr.code}
        onSelect={handleSelectReceive}
        onClose={() => setPickerFor(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  rateCard: {
    backgroundColor: '#F1FAF1', borderRadius: 18, padding: 16, marginBottom: 18,
    borderWidth: 1, borderColor: '#DCEFDA',
  },
  rateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  rateValue: { marginTop: 8, fontSize: 22, fontWeight: '800', color: Colors.text },
  rateSub: { marginTop: 4, color: Colors.textSecondary, fontSize: 13 },
  fieldLabel: { marginBottom: 8, fontSize: 15, fontWeight: '700', color: Colors.text },
  selectBox: {
    height: 64, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12,
  },
  currencyFlagLg: { fontSize: 28 },
  selectCode: { fontSize: 16, fontWeight: '800', color: Colors.text },
  selectName: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  swapWrap: { alignItems: 'center', marginVertical: 14 },
  swapBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  amountBox: {
    height: 60, borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
  },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: Colors.text },
  amountSuffix: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  summaryCard: {
    marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EEF2F6', minHeight: 60, justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 15 },
  summaryValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalLabel: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  totalValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  primaryBtn: {
    marginTop: 22, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secureText: { textAlign: 'center', color: '#98A2B3', fontSize: 12, marginTop: 12 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '70%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  currencyOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F1F4F2',
  },
  currencyOptionActive: { backgroundColor: Colors.primarySoft, borderRadius: 12, paddingHorizontal: 8 },
  currencyFlag: { fontSize: 26 },
  currencyCode: { fontSize: 15, fontWeight: '800', color: Colors.text },
  currencyName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
