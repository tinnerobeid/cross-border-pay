import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword } from '../../services/api';

function PasswordInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow(s => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color="#98A2B3" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const { token } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!token) return;
    if (!current || !next || !confirm) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Too short', 'New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next, token);
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = current.length > 0 && next.length >= 8 && next === confirm;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Change Password</Text>
            <View style={{ width: 22 }} />
          </View>

          <Text style={styles.heading}>Update Password</Text>
          <Text style={styles.subheading}>Enter your current password, then choose a new one.</Text>

          <PasswordInput label="Current Password" value={current} onChangeText={setCurrent} />
          <PasswordInput label="New Password" value={next} onChangeText={setNext} />
          <PasswordInput label="Confirm New Password" value={confirm} onChangeText={setConfirm} />

          {next.length > 0 && next.length < 8 && (
            <Text style={styles.hint}>Password must be at least 8 characters</Text>
          )}
          {next.length >= 8 && confirm.length > 0 && next !== confirm && (
            <Text style={styles.hint}>Passwords do not match</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || loading) && { opacity: 0.5 }]}
            onPress={handleUpdate}
            disabled={!canSubmit || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Update Password</Text>
              </>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  heading: { marginTop: 18, fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, color: Colors.textSecondary, lineHeight: 21, marginBottom: 20 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: Colors.text },
  inputWrap: {
    height: 52, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff', paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  input: { flex: 1, color: Colors.text, fontSize: 16 },
  hint: { marginTop: -8, marginBottom: 10, fontSize: 12, color: '#F04438' },
  primaryBtn: {
    marginTop: 8, height: 54, borderRadius: 14, backgroundColor: Colors.primary,
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
