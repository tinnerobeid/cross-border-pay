import React, { useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { requestPhoneChange, verifyPhoneChange } from '../../services/api';

type Step = 'enter' | 'verify';

export default function ChangePhoneScreen() {
  const { token, user } = useAuth();
  const [step, setStep] = useState<Step>('enter');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ── Step 1: request OTP ───────────────────────────────────────────────────

  const handleRequestOtp = async () => {
    if (!token) return;
    const phone = newPhone.trim();
    if (phone.length < 9) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestPhoneChange(phone, token);
      Alert.alert('Code sent', res.message);
      setStep('verify');
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────

  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    if (!token) return;
    const code = otp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete', 'Enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyPhoneChange(code, token);
      Alert.alert('Success', `Your phone number has been updated to ${res.phone}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await requestPhoneChange(newPhone.trim(), token);
      Alert.alert('Code resent', res.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => step === 'verify' ? setStep('enter') : router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Change Phone</Text>
            <View style={{ width: 22 }} />
          </View>

          {step === 'enter' ? (
            <>
              <Text style={styles.heading}>New Phone Number</Text>
              <Text style={styles.subheading}>
                {user?.phone
                  ? `Current: ${user.phone}\n\nEnter your new phone number. We'll send a verification code to confirm.`
                  : 'Enter your phone number. We\'ll send a verification code to confirm.'}
              </Text>

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputRow}>
                <View style={styles.flagBox}>
                  <Text style={styles.flagText}>📱</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+255 7XX XXX XXX"
                  placeholderTextColor="#98A2B3"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || newPhone.trim().length < 9) && { opacity: 0.5 }]}
                onPress={handleRequestOtp}
                disabled={loading || newPhone.trim().length < 9}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Send Verification Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.heading}>Verify Code</Text>
              <Text style={styles.subheading}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={{ fontWeight: '800', color: Colors.text }}>{newPhone}</Text>
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { inputRefs.current[i] = ref; }}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    value={digit}
                    onChangeText={val => handleOtpChange(val, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (loading || otp.join('').length !== 6) && { opacity: 0.5 }]}
                onPress={handleVerify}
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Confirm Change</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={loading}>
                <Text style={styles.resendText}>Didn't receive it? Resend code</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  heading: { marginTop: 22, fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 22, marginBottom: 24, fontSize: 15 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 12, height: 54,
  },
  flagBox: { width: 32, alignItems: 'center' },
  flagText: { fontSize: 22 },
  phoneInput: { flex: 1, fontSize: 17, color: Colors.text },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 28 },
  otpBox: {
    flex: 1, height: 58, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: '#fff', textAlign: 'center', fontSize: 26, fontWeight: '800', color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  primaryBtn: {
    marginTop: 20, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resendBtn: { marginTop: 16, alignItems: 'center', padding: 10 },
  resendText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
