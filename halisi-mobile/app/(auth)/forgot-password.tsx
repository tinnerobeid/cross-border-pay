import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import PrimaryButton from '../../components/PrimaryButton';
import Colors from '../../constants/colors';
import { forgotPassword, resetPassword } from '../../services/api';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep]               = useState<Step>('email');
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.'); return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep('reset');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!otp.trim() || !newPassword || !confirm) {
      Alert.alert('Required', 'Please fill in all fields.'); return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.'); return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.'); return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), otp.trim(), newPassword);
      Alert.alert('Success', 'Password reset successfully. Please log in.', [
        { text: 'Login', onPress: () => router.replace('/(auth)/login') },
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
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.iconBox}>
            <Ionicons name="lock-open-outline" size={30} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Forgot Password</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.subtitle}>
                Enter the email address linked to your account and we'll send you a reset code.
              </Text>
              <AppInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <PrimaryButton title="Send Reset Code" onPress={handleSendCode} loading={loading} style={{ marginTop: 16 }} />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                A 6-digit code was sent to <Text style={{ fontWeight: '700', color: Colors.text }}>{email}</Text>. Enter it below along with your new password.
              </Text>
              <AppInput
                label="Reset Code"
                placeholder="6-digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <AppInput
                label="New Password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <AppInput
                label="Confirm New Password"
                placeholder="Repeat new password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
              <PrimaryButton title="Reset Password" onPress={handleReset} loading={loading} style={{ marginTop: 16 }} />
              <TouchableOpacity style={styles.resendBtn} onPress={() => { setStep('email'); setOtp(''); }}>
                <Text style={styles.resendText}>Didn't get the code? Go back</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF8' },
  inner: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 60 },
  backBtn: { marginBottom: 18 },
  iconBox: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontSize: 28, fontWeight: '800', color: Colors.text,
    textAlign: 'center', marginBottom: 10,
  },
  subtitle: {
    fontSize: 15, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 14 },
});
