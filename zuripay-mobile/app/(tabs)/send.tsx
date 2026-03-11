import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

const RATE = 0.52;

export default function SendScreen() {
  const [amount, setAmount] = useState('');

  const numericAmount = Number(amount || 0);
  const recipientGets = useMemo(() => numericAmount * RATE, [numericAmount]);
  const fee = useMemo(() => (numericAmount > 0 ? 0 : 0), [numericAmount]);
  const total = useMemo(() => numericAmount + fee, [numericAmount, fee]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup Transfer</Text>
          <TouchableOpacity>
            <Ionicons name="help-circle" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.rateCard}>
          <View style={styles.rateHeader}>
            <Text style={styles.rateLabel}>EXCHANGE RATE</Text>
            <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.rateValue}>1 TZS = 0.52 KRW</Text>
          <Text style={styles.rateSub}>Guaranteed for the next 15 minutes</Text>
        </View>

        <Text style={styles.fieldLabel}>From</Text>
        <TouchableOpacity style={styles.selectBox}>
          <View style={styles.currencyLeft}>
            <View style={styles.currencyBadge}>
              <Ionicons name="cash-outline" size={18} color={Colors.primaryDark} />
            </View>
            <Text style={styles.selectText}>TZS - Tanzanian Shilling</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#667085" />
        </TouchableOpacity>

        <View style={styles.swapWrap}>
          <TouchableOpacity style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>To</Text>
        <TouchableOpacity style={styles.selectBox}>
          <View style={styles.currencyLeft}>
            <View style={styles.currencyBadge}>
              <Ionicons name="globe-outline" size={18} color={Colors.primaryDark} />
            </View>
            <Text style={styles.selectText}>KRW - South Korean Won</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#667085" />
        </TouchableOpacity>

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
          <Text style={styles.amountSuffix}>TZS</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipient receives</Text>
            <Text style={styles.summaryValue}>{recipientGets.toFixed(2)} KRW</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transfer fee</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {fee === 0 ? 'Free' : `${fee.toFixed(2)} TZS`}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 6 }]}>
            <Text style={styles.totalLabel}>Total to pay</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} TZS</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: '/transfer/confirm',
              params: {
                amount: numericAmount.toFixed(2),
                gets: recipientGets.toFixed(2),
                fee: fee.toFixed(2),
              },
            })
          }
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  rateCard: {
    backgroundColor: '#F1FAF1',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCEFDA',
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rateValue: {
    marginTop: 8,
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  rateSub: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  selectBox: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  swapWrap: {
    alignItems: 'center',
    marginVertical: 14,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBox: {
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  amountSuffix: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  totalValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  primaryBtn: {
    marginTop: 22,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secureText: {
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 12,
    marginTop: 12,
  },
});