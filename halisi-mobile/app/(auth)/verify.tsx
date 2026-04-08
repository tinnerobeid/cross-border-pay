import React, { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { verifyOTP, sendOTP, getCurrentUser } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function VerifyScreen() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setAuth } = useAuth();

  const code = useMemo(() => digits.join(''), [digits]);

  const handleVerify = async () => {
    if (code.length < 6 || !email) return;

    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp_code: code });
      if (res.access_token) {
        const user = await getCurrentUser(res.access_token);
        await setAuth(res.access_token, user);
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Success', 'Account verified! Please log in.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') }
        ]);
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setResendLoading(true);
    try {
      await sendOTP({ email });
      Alert.alert('OTP Sent', 'A new verification code has been sent to your email');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (value: string, index: number) => {
    if (!value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Verification</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={30} color={Colors.primary} />
        </View>

        <Text style={styles.heading}>Enter 6-digit code</Text>
        <Text style={styles.subheading}>
          We’ve sent a 2FA code to {email || 'your registered email'}.
        </Text>

        <View style={styles.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(digits[index], index);
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
            />
          ))}
        </View>

        <View style={styles.timerRow}>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>01</Text>
            <Text style={styles.timerLabel}>MINUTES</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>59</Text>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, (code.length < 6 || loading) && { opacity: 0.6 }]}
          disabled={code.length < 6 || loading}
          onPress={handleVerify}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Verifying...' : 'Verify Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
          <Text style={styles.resendText}>
            Didn’t receive the code?{' '}
            <Text style={[styles.link, resendLoading && { opacity: 0.6 }]}>
              {resendLoading ? 'Sending...' : 'Resend'}
            </Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={16} color={Colors.primary} />
          <Text style={styles.footerText}>SECURE 256-BIT ENCRYPTION</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 16 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.primarySoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  heading: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  subheading: {
    marginTop: 10,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  otpInput: {
    width: 48,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 18,
  },
  timerBox: {
    flex: 1,
    backgroundColor: '#EEF8EE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  timerLabel: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 1,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resendText: {
    textAlign: 'center',
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: { color: Colors.primaryDark, fontWeight: '800' },
  footer: {
    marginTop: 'auto',
    marginBottom: 18,
    backgroundColor: '#EFF7EF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});