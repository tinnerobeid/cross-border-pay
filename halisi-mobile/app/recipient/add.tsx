import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { createRecipient } from '../../services/api';

export default function AddRecipientScreen() {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [country, setCountry] = useState('South Korea');
  const [currency, setCurrency] = useState('KRW');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !country.trim() || !currency.trim()) {
      Alert.alert('Required', 'Please fill in name, phone, country, and currency.'); return;
    }
    if (!token) return;
    setLoading(true);
    try {
      await createRecipient({ name: name.trim(), phone: phone.trim(), bank_name: bankName.trim() || undefined, account_number: accountNumber.trim() || undefined, country: country.trim(), currency: currency.trim().toUpperCase() }, token);
      Alert.alert('Success', 'Recipient saved!', [{ text: 'OK', onPress: () => router.back() }]);
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
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={styles.title}>Add Recipient</Text>
          <View style={{ width: 22 }} />
        </View>

        {([
          { label: 'Full Name *', value: name, setter: setName, placeholder: 'e.g. Kim Soo-min' },
          { label: 'Phone Number *', value: phone, setter: setPhone, placeholder: '+82 10 XXXX XXXX', type: 'phone-pad' as const },
          { label: 'Country *', value: country, setter: setCountry, placeholder: 'e.g. South Korea' },
          { label: 'Currency *', value: currency, setter: setCurrency, placeholder: 'e.g. KRW' },
          { label: 'Bank Name', value: bankName, setter: setBankName, placeholder: 'e.g. Kookmin Bank (optional)' },
          { label: 'Account Number', value: accountNumber, setter: setAccountNumber, placeholder: 'Bank account number (optional)' },
        ] as const).map(field => (
          <View key={field.label}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#98A2B3"
              value={field.value}
              onChangeText={field.setter}
              keyboardType={'type' in field ? field.type : 'default'}
            />
          </View>
        ))}

        <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <><Ionicons name="person-add-outline" size={18} color="#fff" /><Text style={styles.primaryBtnText}>Save Recipient</Text></>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  fieldLabel: { marginTop: 16, marginBottom: 6, fontSize: 14, fontWeight: '700', color: Colors.text },
  input: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 16, color: Colors.text },
  primaryBtn: { marginTop: 28, height: 54, borderRadius: 14, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
