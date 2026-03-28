import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { linkAccount } from '../services/api';

type AccountType = 'bank' | 'mobile_money';

const COUNTRIES = [
  { name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { name: 'Burundi', currency: 'BIF', flag: '🇧🇮' },
  { name: 'South Korea', currency: 'KRW', flag: '🇰🇷' },
  { name: 'United States', currency: 'USD', flag: '🇺🇸' },
];

const BANK_PROVIDERS: Record<string, string[]> = {
  Tanzania: ['CRDB Bank', 'NMB Bank', 'NBC Bank', 'Stanbic Bank', 'Equity Bank', 'DTB Bank', 'Standard Chartered', 'Azania Bank', 'BOA Tanzania'],
  Kenya: ['Equity Bank', 'KCB Bank', 'Co-operative Bank', 'Absa Kenya', 'Standard Chartered Kenya', 'NCBA Bank'],
  Rwanda: ['Bank of Kigali', 'Equity Bank Rwanda', 'I&M Bank Rwanda', 'Cogebanque'],
  Uganda: ['Stanbic Uganda', 'Absa Uganda', 'Equity Bank Uganda', 'DFCU Bank'],
  Burundi: ['Bancobu', 'BCB', 'Interbank Burundi'],
  'South Korea': ['Kookmin Bank', 'Shinhan Bank', 'Woori Bank', 'KEB Hana Bank', 'NongHyup Bank'],
  'United States': ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank'],
};

const MOBILE_PROVIDERS: Record<string, string[]> = {
  Tanzania: ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'HaloPesa'],
  Kenya: ['M-Pesa Kenya', 'Airtel Money Kenya'],
  Uganda: ['MTN Mobile Money', 'Airtel Money Uganda'],
  Rwanda: ['MTN Mobile Money Rwanda', 'Airtel Money Rwanda'],
  Burundi: ['Lumicash', 'EcoCash Burundi'],
};

function PickerModal<T>({
  visible, title, items, onSelect, onClose, renderItem,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  renderItem: (item: T) => React.ReactElement;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <FlatList
          data={items}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { onSelect(item); onClose(); }}>
              {renderItem(item)}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

export default function LinkAccountScreen() {
  const { token } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [provider, setProvider] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [showCountry, setShowCountry] = useState(false);
  const [showProvider, setShowProvider] = useState(false);

  const providerList = accountType === 'bank'
    ? (BANK_PROVIDERS[country.name] ?? [])
    : (MOBILE_PROVIDERS[country.name] ?? []);

  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setCountry(c);
    setProvider('');
  };

  const canSubmit = provider && accountHolder.trim() && accountNumber.trim();

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;
    setLoading(true);
    try {
      await linkAccount({
        account_type: accountType,
        provider,
        account_holder: accountHolder.trim(),
        account_number: accountNumber.trim(),
        currency: country.currency,
        country: country.name,
      }, token);
      Alert.alert('Account Connected', `Your ${provider} account has been linked.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Link Account</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Account type toggle */}
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, accountType === 'bank' && styles.typeBtnActive]}
            onPress={() => { setAccountType('bank'); setProvider(''); }}
          >
            <Ionicons name="business-outline" size={18} color={accountType === 'bank' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, accountType === 'bank' && styles.typeBtnTextActive]}>Bank Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, accountType === 'mobile_money' && styles.typeBtnActive]}
            onPress={() => { setAccountType('mobile_money'); setProvider(''); }}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={accountType === 'mobile_money' ? '#fff' : Colors.textSecondary} />
            <Text style={[styles.typeBtnText, accountType === 'mobile_money' && styles.typeBtnTextActive]}>Mobile Money</Text>
          </TouchableOpacity>
        </View>

        {/* Country */}
        <Text style={styles.label}>Country</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowCountry(true)}>
          <Text style={styles.selectorFlag}>{country.flag}</Text>
          <Text style={styles.selectorText}>{country.name}</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Provider */}
        <Text style={styles.label}>
          {accountType === 'bank' ? 'Bank Name' : 'Mobile Money Provider'}
        </Text>
        <TouchableOpacity
          style={[styles.selector, !providerList.length && { opacity: 0.5 }]}
          onPress={() => providerList.length && setShowProvider(true)}
        >
          <Ionicons
            name={accountType === 'bank' ? 'business-outline' : 'phone-portrait-outline'}
            size={18} color={Colors.primary}
          />
          <Text style={[styles.selectorText, !provider && { color: Colors.textSecondary }]}>
            {provider || (providerList.length ? 'Select provider' : 'Not available in this country')}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Account holder */}
        <Text style={styles.label}>Account Holder Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name as on the account"
          placeholderTextColor="#98A2B3"
          value={accountHolder}
          onChangeText={setAccountHolder}
        />

        {/* Account number / phone */}
        <Text style={styles.label}>
          {accountType === 'bank' ? 'Account Number' : 'Phone Number'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={accountType === 'bank' ? 'e.g. 0152-199-888-800' : 'e.g. +255 712 345 678'}
          placeholderTextColor="#98A2B3"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType={accountType === 'mobile_money' ? 'phone-pad' : 'default'}
        />

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Your account details are encrypted and stored securely. ZuriPay never shares your banking information.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || loading) && { opacity: 0.5 }]}
          disabled={!canSubmit || loading}
          onPress={handleSubmit}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="link-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Connect Account</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Country picker */}
      <PickerModal
        visible={showCountry}
        title="Select Country"
        items={COUNTRIES}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountry(false)}
        renderItem={item => (
          <View style={styles.pickerRow}>
            <Text style={styles.pickerFlag}>{item.flag}</Text>
            <Text style={styles.pickerLabel}>{item.name}</Text>
            <Text style={styles.pickerSub}>{item.currency}</Text>
          </View>
        )}
      />

      {/* Provider picker */}
      <PickerModal
        visible={showProvider}
        title={accountType === 'bank' ? 'Select Bank' : 'Select Provider'}
        items={providerList}
        onSelect={setProvider}
        onClose={() => setShowProvider(false)}
        renderItem={item => (
          <View style={styles.pickerRow}>
            <Ionicons
              name={accountType === 'bank' ? 'business-outline' : 'phone-portrait-outline'}
              size={20} color={Colors.primary}
            />
            <Text style={[styles.pickerLabel, { flex: 1 }]}>{item}</Text>
            {item === provider && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F6',
  },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, height: 56, paddingHorizontal: 14, marginBottom: 18,
  },
  selectorFlag: { fontSize: 22 },
  selectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  input: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, height: 56, paddingHorizontal: 14,
    fontSize: 15, color: Colors.text, marginBottom: 18,
  },
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primarySoft, borderRadius: 12,
    padding: 14, marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 20 },
  submitBtn: {
    height: 56, borderRadius: 14, backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '65%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F1F4F2',
  },
  pickerFlag: { fontSize: 24 },
  pickerLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
  pickerSub: { fontSize: 13, color: Colors.textSecondary },
});
