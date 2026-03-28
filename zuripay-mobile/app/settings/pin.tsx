import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getPinStatus, changePin } from '../../services/api';

function PinInput({ label, value, onChangeText, show, onToggleShow }: {
  label: string; value: string; onChangeText: (v: string) => void;
  show: boolean; onToggleShow: () => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry={!show}
          placeholder="••••••"
          placeholderTextColor="#98A2B3"
          style={styles.input}
        />
        <TouchableOpacity onPress={onToggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#98A2B3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePinScreen() {
  const { token } = useAuth();
  const [hasPin, setHasPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPinStatus(token)
      .then(s => setHasPin(s.has_pin))
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [token]);

  const handleUpdate = async () => {
    if (!token) return;
    if (newPin.length !== 6) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation do not match.');
      return;
    }
    if (hasPin && !currentPin) {
      Alert.alert('Required', 'Enter your current PIN.');
      return;
    }
    setLoading(true);
    try {
      await changePin({
        current_pin: hasPin ? currentPin : undefined,
        new_pin: newPin,
        confirm_pin: confirmPin,
      }, token);
      Alert.alert('Success', 'Your PIN has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{hasPin ? 'Change PIN' : 'Set PIN'}</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.heading}>{hasPin ? 'Update PIN' : 'Create PIN'}</Text>
        <Text style={styles.subheading}>
          {hasPin
            ? 'Enter your current PIN and choose a new 6-digit PIN.'
            : 'Set a 6-digit transaction PIN to secure your transfers.'}
        </Text>

        {hasPin && (
          <PinInput label="Current PIN" value={currentPin} onChangeText={setCurrentPin} show={show} onToggleShow={() => setShow(s => !s)} />
        )}
        <PinInput label="New PIN" value={newPin} onChangeText={setNewPin} show={show} onToggleShow={() => setShow(s => !s)} />
        <PinInput label="Confirm New PIN" value={confirmPin} onChangeText={setConfirmPin} show={show} onToggleShow={() => setShow(s => !s)} />

        <TouchableOpacity
          style={[styles.primaryBtn, (loading || newPin.length !== 6) && { opacity: 0.6 }]}
          onPress={handleUpdate}
          disabled={loading || newPin.length !== 6}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>{hasPin ? 'Update PIN' : 'Set PIN'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.pinStrength}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < newPin.length && styles.pinDotFilled,
                newPin.length === 6 && styles.pinDotComplete,
              ]}
            />
          ))}
        </View>
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
  heading: { marginTop: 18, fontSize: 30, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 21, marginBottom: 18 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: Colors.text },
  inputWrap: {
    height: 52, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff', paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, color: Colors.text, fontSize: 22, letterSpacing: 10 },
  primaryBtn: {
    marginTop: 8, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pinStrength: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
  pinDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#D0D5DD', backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pinDotComplete: { backgroundColor: Colors.success, borderColor: Colors.success },
});
