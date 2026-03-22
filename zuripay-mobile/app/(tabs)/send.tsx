import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { createQuote, QuoteResponse } from '../../services/api';

const SEND_COUNTRY = 'Tanzania';
const RECEIVE_COUNTRY = 'South Korea';
const SEND_CURRENCY = 'TZS';
const RECEIVE_CURRENCY = 'KRW';

export default function SendScreen() {
  const { token } = useAuth();
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numericAmount = Number(amount || 0);

  const fetchQuote = useCallback(async (amt: number) => {
    if (!token || amt <= 0) { setQuote(null); setQuoteError(''); return; }
    setQuoteLoading(true); setQuoteError('');
    try {
      const q = await createQuote({ send_country: SEND_COUNTRY, receive_country: RECEIVE_COUNTRY, send_currency: SEND_CURRENCY, receive_currency: RECEIVE_CURRENCY, send_amount: amt }, token);
      setQuote(q);
    } catch (e: any) { setQuoteError(e.message); setQuote(null); }
    finally { setQuoteLoading(false); }
  }, [token]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchQuote(numericAmount), 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [numericAmount, fetchQuote]);

  const canProceed = numericAmount > 0 && quote != null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.primaryDark} /></TouchableOpacity>
          <Text style={styles.title}>Setup Transfer</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateLabel}>EXCHANGE RATE</Text>
            <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
          </View>
          {quote ? (
            <>
              <Text style={styles.rateValue}>1 {SEND_CURRENCY} = {quote.fx_rate.toFixed(4)} {RECEIVE_CURRENCY}</Text>
              <Text style={styles.rateSub}>Rate locked for 1 minute</Text>
            </>
          ) : (
            <Text style={styles.rateValue}>Enter amount to get rate</Text>
          )}
        </View>

        <Text style={styles.fieldLabel}>From</Text>
        <View style={styles.selectBox}>
          <View style={styles.currencyLeft}>
            <View style={styles.currencyBadge}><Ionicons name="cash-outline" size={18} color={Colors.primaryDark} /></View>
            <Text style={styles.selectText}>{SEND_CURRENCY} - Tanzanian Shilling</Text>
          </View>
        </View>

        <View style={styles.swapWrap}><View style={styles.swapBtn}><Ionicons name="swap-vertical" size={18} color="#fff" /></View></View>

        <Text style={styles.fieldLabel}>To</Text>
        <View style={styles.selectBox}>
          <View style={styles.currencyLeft}>
            <View style={styles.currencyBadge}><Ionicons name="globe-outline" size={18} color={Colors.primaryDark} /></View>
            <Text style={styles.selectText}>{RECEIVE_CURRENCY} - South Korean Won</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Amount to send</Text>
        <View style={styles.amountBox}>
          <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#B7C0CC" keyboardType="numeric" style={styles.amountInput} />
          <Text style={styles.amountSuffix}>{SEND_CURRENCY}</Text>
        </View>

        <View style={styles.summaryCard}>
          {quoteLoading ? <ActivityIndicator color={Colors.primary} /> :
           quoteError ? <Text style={{ color: '#F04438', fontSize: 13 }}>{quoteError}</Text> :
           quote ? (
            <>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Recipient receives</Text><Text style={styles.summaryValue}>{Number(quote.receive_amount).toLocaleString()} {RECEIVE_CURRENCY}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Transfer fee</Text><Text style={styles.summaryValue}>{Number(quote.fee_amount).toLocaleString()} {SEND_CURRENCY}</Text></View>
              <View style={[styles.summaryRow, { marginTop: 6 }]}><Text style={styles.totalLabel}>Total to pay</Text><Text style={styles.totalValue}>{Number(quote.total_cost).toLocaleString()} {SEND_CURRENCY}</Text></View>
            </>
           ) : <Text style={{ color: Colors.textSecondary, textAlign: 'center' }}>Enter an amount to see the breakdown</Text>}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, !canProceed && { opacity: 0.5 }]}
          disabled={!canProceed}
          onPress={() => router.push({ pathname: '/transfer/confirm', params: { sendAmount: numericAmount.toFixed(2), receiveAmount: String(quote!.receive_amount), feeAmount: String(quote!.fee_amount), fxRate: String(quote!.fx_rate), sendCurrency: SEND_CURRENCY, receiveCurrency: RECEIVE_CURRENCY, sendCountry: SEND_COUNTRY, receiveCountry: RECEIVE_COUNTRY } })}
        >
          <Text style={styles.primaryBtnText}>Review Transfer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.secureText}>Secure transaction powered by Zuri Pay</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 90 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  rateCard: { backgroundColor: '#F1FAF1', borderRadius: 18, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: '#DCEFDA' },
  rateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateLabel: { color: Colors.primaryDark, fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  rateValue: { marginTop: 8, fontSize: 24, fontWeight: '800', color: Colors.text },
  rateSub: { marginTop: 4, color: Colors.textSecondary, fontSize: 13 },
  fieldLabel: { marginBottom: 8, fontSize: 15, fontWeight: '700', color: Colors.text },
  selectBox: { height: 56, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currencyBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  selectText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  swapWrap: { alignItems: 'center', marginVertical: 14 },
  swapBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  amountBox: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: Colors.text },
  amountSuffix: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  summaryCard: { marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6', minHeight: 60, justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 15 },
  summaryValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalLabel: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  totalValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  primaryBtn: { marginTop: 22, height: 54, borderRadius: 14, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secureText: { textAlign: 'center', color: '#98A2B3', fontSize: 12, marginTop: 12 },
});
