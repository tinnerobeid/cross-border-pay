import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

function PinInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor="#98A2B3"
          style={styles.input}
        />
        <Ionicons name="eye-outline" size={18} color="#98A2B3" />
      </View>
    </View>
  );
}

export default function ChangePinScreen() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Change PIN</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.heading}>Security Settings</Text>
        <Text style={styles.subheading}>
          Enter your current and new PIN to update your Zuri Pay security.
        </Text>

        <PinInput label="Current PIN" value={currentPin} onChangeText={setCurrentPin} />
        <PinInput label="New PIN" value={newPin} onChangeText={setNewPin} />
        <PinInput label="Confirm New PIN" value={confirmPin} onChangeText={setConfirmPin} />

        <TouchableOpacity style={styles.primaryBtn}>
          <Ionicons name="refresh-circle-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Update PIN</Text>
        </TouchableOpacity>

        <View style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => (
            <TouchableOpacity key={i} style={styles.key}>
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
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
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, color: Colors.text, fontSize: 18, letterSpacing: 6 },
  primaryBtn: {
    marginTop: 6,
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  keypad: {
    marginTop: 20,
    backgroundColor: '#F2F4F5',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '30%',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  keyText: { fontSize: 22, fontWeight: '700', color: Colors.text },
});