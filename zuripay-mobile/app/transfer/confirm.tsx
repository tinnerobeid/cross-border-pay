import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { createTransfer } from '../../services/api';

export default function ConfirmTransferScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    sendAmount?: string; receiveAmount?: string; feeAmount?: string; fxRate?: string;
    sendCurrency?: string; receiveCurrency?: string; sendCountry?: string; receiveCountry?: string;
    transferType?: string; isLinkedRecipient?: string;
  }>();

  const sendAmount = params.sendAmount ?? '0.00';
  const receiveAmount = params.receiveAmount ?? '0.00';
  const feeAmount = params.feeAmount ?? '0.00';
  const fxRate = params.fxRate ?? '0';
  const sendCurrency = params.sendCurrency ?? 'TZS';
  const receiveCurrency = params.receiveCurrency ?? 'KRW';
  const sendCountry = params.sendCountry ?? 'Tanzania';
  const receiveCountry = params.receiveCountry ?? 'South Korea';
  const transferType = params.transferType ?? 'international';
  const isLinkedRecipient = params.isLinkedRecipient === 'true';

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!recipientName.trim() || !recipientPhone.trim()) {
      Alert.alert('Required', 'Please enter recipient name and phone number.');
      return;
    }
    if (!token) return;
    setLoading(true);
    try {
      const transfer = await createTransfer({
        send_country: sendCountry,
        receive_country: receiveCountry,
        send_currency: sendCurrency,
        receive_currency: receiveCurrency,
        send_amount: parseFloat(sendAmount),
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        is_linked_recipient: isLinkedRecipient,
      }, token);
      router.replace({
        pathname: '/transfer/success',
        params: {
          transferId: String(transfer.id),
          sendAmount,
          receiveAmount: String(transfer.receive_amount ?? receiveAmount),
          sendCurrency,
          receiveCurrency,
          fxRate: String(transfer.rate_used ?? fxRate),
          recipientName: transfer.recipient_name,
          createdAt: transfer.created_at,
          status: transfer.status,
        },
      });
    } catch (e: any) {
      if (e.message?.includes('403') || e.message?.toLowerCase().includes('kyc')) {
        Alert.alert('KYC Required', 'Please complete identity verification before sending money.', [
          { text: 'Verify Now', onPress: () => router.push('/kyc/id') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Transfer failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={styles.title}>Review Transfer</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.amountHero}>
          <Text style={styles.amountHeroValue}>{Number(sendAmount).toLocaleString()} {sendCurrency}</Text>
          <Text style={styles.amountHeroLabel}>Amount to send</Text>
        </View>

        <Text style={styles.sectionTitle}>RECIPIENT DETAILS</Text>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput style={styles.input} placeholder="Recipient full name" placeholderTextColor="#98A2B3" value={recipientName} onChangeText={setRecipientName} />
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>Phone Number</Text>
          <TextInput style={styles.input} placeholder="+255 7XX XXX XXX" placeholderTextColor="#98A2B3" value={recipientPhone} onChangeText={setRecipientPhone} keyboardType="phone-pad" />
        </View>

        <Text style={styles.sectionTitle}>TRANSACTION SUMMARY</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exchange Rate</Text>
            <Text style={styles.summaryValue}>1 {sendCurrency} = {Number(fxRate).toFixed(4)} {receiveCurrency}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transfer Fee</Text>
            {transferType === 'domestic_free'
              ? <Text style={[styles.summaryValue, { color: '#12B76A' }]}>FREE</Text>
              : <Text style={styles.summaryValue}>{Number(feeAmount).toLocaleString()} {sendCurrency}</Text>
            }
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transfer Type</Text>
            <Text style={styles.summaryValue}>
              {transferType === 'domestic_free' ? 'Domestic (Free)' : transferType === 'domestic' ? 'Domestic' : 'International'}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={styles.totalReceiveLabel}>Recipient Receives</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.totalReceiveValue}>{Number(receiveAmount).toLocaleString()} {receiveCurrency}</Text>
              <Text style={styles.arrivalText}>Est. arrival today</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm & Send</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel Transaction</Text>
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
  amountHero: { marginTop: 18, backgroundColor: '#F2F8F0', borderRadius: 18, paddingVertical: 22, alignItems: 'center' },
  amountHeroValue: { fontSize: 34, fontWeight: '800', color: Colors.text },
  amountHeroLabel: { marginTop: 4, color: Colors.textSecondary, fontSize: 16 },
  sectionTitle: { marginTop: 22, marginBottom: 10, fontSize: 13, fontWeight: '800', color: Colors.text, letterSpacing: 0.8 },
  inputCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, fontSize: 16, color: Colors.text, backgroundColor: Colors.background },
  summaryBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 15 },
  summaryValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalReceiveLabel: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  totalReceiveValue: { color: Colors.primary, fontSize: 28, fontWeight: '800' },
  arrivalText: { color: Colors.textSecondary, fontSize: 12 },
  primaryBtn: { marginTop: 24, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelText: { textAlign: 'center', marginTop: 14, color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
