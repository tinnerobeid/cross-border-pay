import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppInput from '../../components/AppInput';
import PrimaryButton from '../../components/PrimaryButton';
import Colors from '../../constants/colors';
import { countryCodes, CountryCode } from '../../constants/countryCodes';
import { registerUser } from '../../services/api';

const RESIDENCE_COUNTRIES = [
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Burundi', flag: '🇧🇮' },
];

const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  return null;
};

export default function RegisterScreen() {
  const [agree, setAgree] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>(
    countryCodes.find((c) => c.code === 'US') || countryCodes[0]
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [residence, setResidence] = useState<typeof RESIDENCE_COUNTRIES[0] | null>(null);
  const [showResidencePicker, setShowResidencePicker] = useState(false);

  const filteredCountries = countryCodes.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.dial_code.includes(searchText)
  );

  const handleRegister = async () => {
    if (!agree) {
      Alert.alert('Agreement', 'You must agree to the terms first');
      return;
    }
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }
    if (!residence) {
      Alert.alert('Missing field', 'Please select your country of residence');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Invalid Password', passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirm password do not match');
      return;
    }

    setLoading(true);
    console.log('Starting registration...');
    try {
      console.log('Calling registerUser with:', {
        full_name: `${firstName} ${lastName}`,
        email,
        password,
        phone: `${country.dial_code} ${phone}`,
      });
      const user = await registerUser({
        full_name: `${firstName} ${lastName}`,
        email,
        password,
        phone: `${country.dial_code} ${phone}`,
        country_of_residence: residence?.name,
      });
      console.log('Registration successful:', user);
      Alert.alert(
        'Registration Successful',
        'Please check your email for the verification code.',
        [{ text: 'OK', onPress: () => router.replace({
          pathname: '/(auth)/verify',
          params: { email: email }
        }) }]
      );
    } catch (e: any) {
      console.error('Registration error:', e);
      Alert.alert('Registration failed', e.message || 'Unknown error occurred');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.inner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
          label="First Name"
          placeholder="Enter your first name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <AppInput
          label="Last Name"
          placeholder="Enter your last name"
          value={lastName}
          onChangeText={setLastName}
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
        {/* Country of Residence */}
        <Text style={styles.inputLabel}>Country of Residence</Text>
        <TouchableOpacity style={styles.residenceSelector} onPress={() => setShowResidencePicker(true)}>
          <Text style={styles.residenceSelectorText}>
            {residence ? `${residence.flag}  ${residence.name}` : 'Select your country of residence'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        <AppInput
          label="Password"
          placeholder="Create a secure password"
          secureTextEntry={!showPassword}
          rightIcon={<Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#98A2B3" />}
          onRightPress={() => setShowPassword(!showPassword)}
          value={password}
          onChangeText={setPassword}
        />
        <AppInput
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry={!showConfirmPassword}
          rightIcon={<Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#98A2B3" />}
          onRightPress={() => setShowConfirmPassword(!showConfirmPassword)}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Residence country picker */}
      <Modal visible={showResidencePicker} transparent animationType="slide" onRequestClose={() => setShowResidencePicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowResidencePicker(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Country of Residence</Text>
          <FlatList
            data={RESIDENCE_COUNTRIES}
            keyExtractor={item => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.residenceRow}
                onPress={() => { setResidence(item); setShowResidencePicker(false); }}
              >
                <Text style={styles.residenceFlag}>{item.flag}</Text>
                <Text style={styles.residenceLabel}>{item.name}</Text>
                {residence?.name === item.name && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => {
        setPickerVisible(false);
        setSearchText('');
      }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          <View style={{ flex: 1, padding: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text }}>Select country code</Text>
            <TextInput
              placeholder="Search countries..."
              value={searchText}
              onChangeText={setSearchText}
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 8,
                padding: 12,
                marginVertical: 8,
                backgroundColor: '#fff',
                color: Colors.text,
              }}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                  onPress={() => {
                    setCountry(item);
                    setPickerVisible(false);
                    setSearchText('');
                  }}
                >
                  <Text style={{ color: Colors.text }}>{item.name}</Text>
                  <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>{item.dial_code}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: Colors.textSecondary }}>No countries found</Text>
                </View>
              }
            />
            <TouchableOpacity onPress={() => {
              setPickerVisible(false);
              setSearchText('');
            }} style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 },
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
  inputLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, marginTop: 4 },
  residenceSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border, height: 52, paddingHorizontal: 14, marginBottom: 18,
  },
  residenceSelectorText: { fontSize: 15, color: Colors.text, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40, maxHeight: '60%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  residenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F1F4F2',
  },
  residenceFlag: { fontSize: 26 },
  residenceLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
});