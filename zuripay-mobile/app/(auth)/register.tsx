import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import PrimaryButton from '../../components/PrimaryButton';
import Colors from '../../constants/colors';
import { countryCodes, CountryCode } from '../../constants/countryCodes';
import { registerUser } from '../../services/api';

export default function RegisterScreen() {
  const [agree, setAgree] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>(
    countryCodes.find((c) => c.code === 'US') || countryCodes[0]
  );
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleRegister = async () => {
    if (!agree) {
      Alert.alert('Agreement', 'You must agree to the terms first');
      return;
    }
    if (!fullName || !email || !password || !phone) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const user = await registerUser({
        full_name: fullName,
        email,
        password,
        phone: `${country.dial_code} ${phone}`,
      });
      console.log('registered user', user);
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Registration failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Create Account</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={28} color={Colors.primary} />
        </View>

        <Text style={styles.heading}>Join Zuri Pay</Text>
        <Text style={styles.subheading}>Start your journey to seamless payments today.</Text>

        <AppInput
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        <AppInput
          label="Email Address"
          placeholder="name@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <AppInput
          label="Phone Number"
          placeholder="800 000 0000"
          keyboardType="phone-pad"
          leftText={country.dial_code}
          onLeftPress={() => setPickerVisible(true)}
          value={phone}
          onChangeText={setPhone}
        />
        <AppInput
          label="Password"
          placeholder="Create a secure password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(!agree)}>
          <View style={[styles.checkbox, agree && styles.checkboxActive]}>
            {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={styles.checkboxText}>
            By clicking &quot;Create Account&quot;, I agree to Zuri Pay’s{' '}
            <Text style={styles.link}>Terms of Service</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

        <PrimaryButton title="Create Account" onPress={handleRegister} loading={loading} />

        <Text style={styles.bottomText}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
            Sign In
          </Text>
        </Text>
      </View>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>Select country code</Text>
            <TextInput
              placeholder="Search"
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 8,
                padding: 8,
                marginVertical: 8,
              }}
            />
            <FlatList
              data={countryCodes}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}
                  onPress={() => {
                    setCountry(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text>{item.name}</Text>
                  <Text>{item.dial_code}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setPickerVisible(false)} style={{ padding: 12 }}>
              <Text style={{ textAlign: 'center', color: Colors.primary }}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: 22, paddingTop: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  topTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 32, fontWeight: '800', color: Colors.text },
  subheading: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, marginBottom: 22 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  link: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  bottomText: {
    textAlign: 'center',
    marginTop: 18,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});