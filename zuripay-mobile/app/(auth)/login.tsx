import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import PrimaryButton from '../../components/PrimaryButton';
import Colors from '../../constants/colors';
import { loginUser, getCurrentUser } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Required', 'Email/phone and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ email: identifier, password });
      const user = await getCurrentUser(res.access_token);
      await setAuth(res.access_token, user);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.headerLine} />

        <View style={styles.logoBox}>
          <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
        </View>

        <Text style={styles.brand}>Zuri Pay</Text>
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subheading}>Securely login to your Zuri Pay account</Text>

        <AppInput
          label="Email or Phone Number"
          placeholder="Enter your email or phone"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <AppInput
          label="Password"
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Login"
          onPress={handleLogin}
          style={{ marginTop: 10 }}
          loading={loading}
        />

        <Text style={styles.orText}>OR LOGIN WITH</Text>

        <View style={styles.bioCard}>
          <Ionicons name="finger-print" size={44} color={Colors.primary} />
          <Text style={styles.bioText}>Biometric Login</Text>
        </View>

        <Text style={styles.bottomText}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/register')}>
            Create Account
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBF8' },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 10 },
  headerLine: {
    height: 3,
    borderRadius: 99,
    backgroundColor: Colors.primary,
    opacity: 0.4,
    marginBottom: 26,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
    alignSelf: 'center',
    marginBottom: 14,
  },
  brand: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  heading: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  subheading: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 22,
  },
  forgot: {
    textAlign: 'right',
    color: Colors.primaryDark,
    fontWeight: '700',
    marginBottom: 6,
  },
  orText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 18,
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '700',
  },
  bioCard: {
    backgroundColor: '#F3FBF4',
    borderRadius: 22,
    paddingVertical: 24,
    alignItems: 'center',
  },
  bioText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomText: {
    textAlign: 'center',
    marginTop: 22,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
});