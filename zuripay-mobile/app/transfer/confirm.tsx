import React, { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { createTransfer, lookupRecipient } from '../../services/api';

// ── Payment method config per receive currency ────────────────────────────────

type PaymentMethod = 'mobile_money' | 'bank';

const METHODS_BY_CURRENCY: Record<string, PaymentMethod[]> = {
  TZS: ['mobile_money', 'bank'],
  KES: ['mobile_money', 'bank'],
  RWF: ['mobile_money', 'bank'],
  UGX: ['mobile_money', 'bank'],
  BIF: ['mobile_money', 'bank'],
  KRW: ['bank'],           // Korea: bank only
  USD: ['bank'],
};

const BANKS_BY_CURRENCY: Record<string, string[]> = {
  TZS: ['NMB Bank', 'CRDB Bank', 'NBC Bank', 'Stanbic Bank', 'Equity Bank', 'Azania Bank'],
  KES: ['Equity Bank KE', 'KCB Bank', 'Cooperative Bank', 'Standard Chartered KE', 'Absa Kenya'],
  RWF: ['Bank of Kigali', 'Equity Bank RW', 'I&M Bank Rwanda', 'KCB Rwanda'],
  UGX: ['Stanbic Uganda', 'Equity Bank UG', 'DFCU Bank', 'Absa Uganda'],
  BIF: ['Bancobu', 'BCB Bank', 'Interbank Burundi'],
  KRW: ['Kookmin Bank (KB)', 'Shinhan Bank', 'Woori Bank', 'Hana Bank', 'IBK', 'NH NongHyup'],
  USD: ['Citibank', 'JPMorgan Chase', 'Wells Fargo', 'Bank of America'],
};

const MOBILE_PROVIDERS_BY_CURRENCY: Record<string, string[]> = {
  TZS: ['M-Pesa (Vodacom)', 'Tigo Pesa', 'Airtel Money TZ', 'Halopesa'],
  KES: ['M-Pesa (Safaricom)', 'Airtel Money KE'],
  RWF: ['MTN MoMo', 'Airtel Money RW'],
  UGX: ['MTN MoMo UG', 'Airtel Money UG'],
  BIF: ['Lumicash', 'EcoCash Burundi'],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConfirmTransferScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    sendAmount?: string; receiveAmount?: string; feeAmount?: string; fxRate?: string;
    sendCurrency?: string; receiveCurrency?: string; sendCountry?: string; receiveCountry?: string;
    transferType?: string; isLinkedRecipient?: string;
    transferFee?: string; exchangeFee?: string; totalCost?: string;
  }>();

  const sendAmount     = params.sendAmount     ?? '0.00';
  const receiveAmount  = params.receiveAmount  ?? '0.00';
  const feeAmount      = params.feeAmount      ?? '0.00';
  const transferFee    = params.transferFee    ?? '0';
  const exchangeFee    = params.exchangeFee    ?? '0';
  const totalCost      = params.totalCost      ?? params.sendAmount ?? '0.00';
  const fxRate         = params.fxRate         ?? '0';
  const sendCurrency   = params.sendCurrency   ?? 'TZS';
  const receiveCurrency = params.receiveCurrency ?? 'KRW';
  const sendCountry    = params.sendCountry    ?? 'Tanzania';
  const receiveCountry = params.receiveCountry ?? 'South Korea';
  const transferType   = params.transferType   ?? 'international';
  const isDomestic     = sendCurrency === receiveCurrency;
  const isInternational = !isDomestic;

  // Available payment methods for the receive currency
  const availableMethods: PaymentMethod[] = METHODS_BY_CURRENCY[receiveCurrency.toUpperCase()] ?? ['mobile_money'];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(availableMethods[0]);

  // Recipient fields
  const [recipientName,   setRecipientName]   = useState('');
  const [recipientPhone,  setRecipientPhone]  = useState('');  // mobile money
  const [accountNumber,   setAccountNumber]   = useState('');  // bank
  const [selectedBank,    setSelectedBank]    = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showBankPicker,  setShowBankPicker]  = useState(false);
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  const [linkedUser,  setLinkedUser]  = useState<{ is_linked: boolean; name: string | null } | null>(null);
  const [lookingUp,   setLookingUp]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDomesticFree = transferType === 'domestic_free' || linkedUser?.is_linked === true;

  const banks     = BANKS_BY_CURRENCY[receiveCurrency.toUpperCase()] ?? [];
  const providers = MOBILE_PROVIDERS_BY_CURRENCY[receiveCurrency.toUpperCase()] ?? [];

  const handlePhoneChange = (phone: string) => {
    setRecipientPhone(phone);
    setLinkedUser(null);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const trimmed = phone.trim();
    if (!token || trimmed.length < 9) return;
    lookupTimer.current = setTimeout(async () => {
      setLookingUp(true);
      try {
        const result = await lookupRecipient(trimmed, token);
        setLinkedUser(result);
        if (result.is_linked && result.name && !recipientName.trim()) {
          setRecipientName(result.name);
        }
      } catch { /* silent */ }
      finally { setLookingUp(false); }
    }, 600);
  };

  const handleMethodSwitch = (m: PaymentMethod) => {
    setPaymentMethod(m);
    setRecipientPhone('');
    setAccountNumber('');
    setSelectedBank('');
    setSelectedProvider('');
    setLinkedUser(null);
  };

  const handleConfirm = async () => {
    if (!recipientName.trim()) {
      Alert.alert('Required', 'Please enter the recipient full name.'); return;
    }
    if (paymentMethod === 'mobile_money' && !recipientPhone.trim()) {
      Alert.alert('Required', 'Please enter the recipient phone number.'); return;
    }
    if (paymentMethod === 'bank') {
      if (!selectedBank) { Alert.alert('Required', 'Please select a bank.'); return; }
      if (!accountNumber.trim()) { Alert.alert('Required', 'Please enter the account number.'); return; }
    }
    if (!token) return;
    setLoading(true);

    // For bank transfers use account number as recipient_phone (stored for reference)
    const recipientRef = paymentMethod === 'bank'
      ? accountNumber.trim()
      : recipientPhone.trim();

    // Prefix bank name into recipient name so admin can see it
    const fullRecipientName = paymentMethod === 'bank'
      ? `${recipientName.trim()} [${selectedBank}]`
      : recipientName.trim();

    try {
      const transfer = await createTransfer({
        send_country: sendCountry,
        receive_country: receiveCountry,
        send_currency: sendCurrency,
        receive_currency: receiveCurrency,
        send_amount: parseFloat(sendAmount),
        recipient_name: fullRecipientName,
        recipient_phone: recipientRef,
        is_linked_recipient: linkedUser?.is_linked ?? false,
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

        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={styles.title}>Review Transfer</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Amount hero */}
        <View style={styles.amountHero}>
          <Text style={styles.amountHeroValue}>{Number(sendAmount).toLocaleString()} {sendCurrency}</Text>
          <Text style={styles.amountHeroLabel}>Amount to send</Text>
        </View>

        {/* Payment method selector — international only, when >1 method available */}
        {isInternational && availableMethods.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>DELIVERY METHOD</Text>
            <View style={styles.methodToggle}>
              {availableMethods.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                  onPress={() => handleMethodSwitch(m)}
                >
                  <Ionicons
                    name={m === 'mobile_money' ? 'phone-portrait-outline' : 'card-outline'}
                    size={16}
                    color={paymentMethod === m ? '#fff' : Colors.textSecondary}
                  />
                  <Text style={[styles.methodBtnText, paymentMethod === m && styles.methodBtnTextActive]}>
                    {m === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Recipient details */}
        <Text style={styles.sectionTitle}>RECIPIENT DETAILS</Text>
        <View style={styles.inputCard}>

          {/* Full name */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient full name"
            placeholderTextColor="#98A2B3"
            value={recipientName}
            onChangeText={setRecipientName}
          />

          {/* Mobile Money fields */}
          {paymentMethod === 'mobile_money' && (
            <>
              {providers.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Provider</Text>
                  <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowProviderPicker(!showProviderPicker)}>
                    <Text style={selectedProvider ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                      {selectedProvider || 'Select provider…'}
                    </Text>
                    <Ionicons name={showProviderPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  {showProviderPicker && (
                    <View style={styles.dropdownList}>
                      {providers.map(p => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.dropdownItem, selectedProvider === p && styles.dropdownItemActive]}
                          onPress={() => { setSelectedProvider(p); setShowProviderPicker(false); }}
                        >
                          <Text style={[styles.dropdownItemText, selectedProvider === p && { color: Colors.primary, fontWeight: '700' }]}>{p}</Text>
                          {selectedProvider === p && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 6 }}>
                <Text style={[styles.inputLabel, { marginBottom: 0, flex: 1 }]}>Phone Number</Text>
                {lookingUp && <ActivityIndicator size="small" color={Colors.primary} />}
                {!lookingUp && linkedUser?.is_linked && (
                  <View style={styles.linkedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#fff" />
                    <Text style={styles.linkedBadgeText}>ZuriPay user</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="+255 7XX XXX XXX"
                placeholderTextColor="#98A2B3"
                value={recipientPhone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {linkedUser?.is_linked && isDomestic && (
                <View style={styles.freeHint}>
                  <Ionicons name="gift-outline" size={14} color="#15803d" />
                  <Text style={styles.freeHintText}>Free domestic transfer — no fees!</Text>
                </View>
              )}
            </>
          )}

          {/* Bank transfer fields */}
          {paymentMethod === 'bank' && (
            <>
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bank</Text>
              <TouchableOpacity style={styles.dropdownBox} onPress={() => setShowBankPicker(!showBankPicker)}>
                <Text style={selectedBank ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                  {selectedBank || 'Select bank…'}
                </Text>
                <Ionicons name={showBankPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              {showBankPicker && (
                <View style={styles.dropdownList}>
                  {banks.map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[styles.dropdownItem, selectedBank === b && styles.dropdownItemActive]}
                      onPress={() => { setSelectedBank(b); setShowBankPicker(false); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedBank === b && { color: Colors.primary, fontWeight: '700' }]}>{b}</Text>
                      {selectedBank === b && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account number"
                placeholderTextColor="#98A2B3"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Transaction summary */}
        <Text style={styles.sectionTitle}>TRANSACTION SUMMARY</Text>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You Send</Text>
            <Text style={styles.summaryValue}>{Number(sendAmount).toLocaleString()} {sendCurrency}</Text>
          </View>
          {!isDomestic && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exchange Rate</Text>
              <Text style={styles.summaryValue}>1 {sendCurrency} = {Number(fxRate).toFixed(4)} {receiveCurrency}</Text>
            </View>
          )}
          {isDomesticFree ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fee</Text>
              <Text style={[styles.summaryValue, { color: '#12B76A' }]}>FREE</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transfer Fee</Text>
                <Text style={styles.summaryValue}>{Number(transferFee).toLocaleString()} {sendCurrency}</Text>
              </View>
              {!isDomestic && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Exchange Fee</Text>
                  <Text style={styles.summaryValue}>{Number(exchangeFee).toLocaleString()} {sendCurrency}</Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalFeeRow]}>
                <Text style={styles.summaryLabel}>Total Fees</Text>
                <Text style={[styles.summaryValue, { color: '#F79009' }]}>{Number(feeAmount).toLocaleString()} {sendCurrency}</Text>
              </View>
            </>
          )}
          <View style={[styles.summaryRow, styles.dividerRow]}>
            <Text style={styles.summaryLabel}>Total Deducted</Text>
            <Text style={[styles.summaryValue, { fontWeight: '800' }]}>
              {isDomesticFree ? Number(sendAmount).toLocaleString() : Number(totalCost).toLocaleString()} {sendCurrency}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4 }]}>
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
  // Method toggle
  methodToggle: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: '#EEF2F6',
  },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 11,
  },
  methodBtnActive: { backgroundColor: Colors.primary },
  methodBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  methodBtnTextActive: { color: '#fff' },
  // Input card
  inputCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, fontSize: 16, color: Colors.text, backgroundColor: Colors.background },
  linkedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#15803d', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  linkedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  freeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  freeHintText: { color: '#15803d', fontSize: 13, fontWeight: '600' },
  // Dropdown
  dropdownBox: {
    height: 48, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background,
  },
  dropdownSelected: { fontSize: 16, color: Colors.text, fontWeight: '600' },
  dropdownPlaceholder: { fontSize: 16, color: '#98A2B3' },
  dropdownList: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fff', marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderColor: '#F1F4F2' },
  dropdownItemActive: { backgroundColor: '#F0F9FF' },
  dropdownItemText: { fontSize: 15, color: Colors.text },
  // Summary
  summaryBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF2F6' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalFeeRow: { borderTopWidth: 1, borderColor: '#EEF2F6', paddingTop: 10 },
  dividerRow: { borderTopWidth: 2, borderColor: '#EEF2F6', paddingTop: 10, marginTop: 2 },
  summaryLabel: { color: Colors.textSecondary, fontSize: 15 },
  summaryValue: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  totalReceiveLabel: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  totalReceiveValue: { color: Colors.primary, fontSize: 28, fontWeight: '800' },
  arrivalText: { color: Colors.textSecondary, fontSize: 12 },
  primaryBtn: { marginTop: 24, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelText: { textAlign: 'center', marginTop: 14, color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
