import React, { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/colors';

const ID_TYPES = ['National ID', 'Passport', 'Driver License'];

export default function KycIdScreen() {
  const [idType, setIdType] = useState('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);

  const pick = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to upload ID.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  };

  const handleContinue = () => {
    if (!idNumber.trim()) { Alert.alert('Required', 'Please enter your ID number.'); return; }
    if (!idFront) { Alert.alert('Required', 'Please upload the front of your ID.'); return; }
    router.push({ pathname: '/kyc/liveness', params: { idType, idNumber: idNumber.trim(), idFront, idBack: idBack ?? '' } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={styles.title}>Verify Identity</Text>
          <Text style={styles.step}>Step 1 of 3</Text>
        </View>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: '33%' }]} /></View>

        <View style={styles.iconWrap}><Ionicons name="card-outline" size={28} color={Colors.primary} /></View>
        <Text style={styles.heading}>Upload Your ID</Text>
        <Text style={styles.subheading}>Provide a clear photo of your National ID or Passport.</Text>

        <Text style={styles.fieldLabel}>ID Type</Text>
        <View style={styles.typeRow}>
          {ID_TYPES.map(t => (
            <TouchableOpacity key={t} style={[styles.typeChip, idType === t && styles.typeChipActive]} onPress={() => setIdType(t)}>
              <Text style={[styles.typeChipText, idType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>ID Number</Text>
        <TextInput style={styles.input} placeholder="Enter your ID number" placeholderTextColor="#98A2B3" value={idNumber} onChangeText={setIdNumber} />

        <Text style={styles.fieldLabel}>Front of ID</Text>
        <TouchableOpacity style={styles.uploadCard} onPress={() => pick(setIdFront)}>
          {idFront ? <Image source={{ uri: idFront }} style={styles.previewImg} /> : (
            <><View style={styles.uploadIcon}><Ionicons name="camera-outline" size={26} color={Colors.primary} /></View><Text style={styles.uploadTitle}>Tap to upload front</Text></>
          )}
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Back of ID <Text style={{ fontWeight: '400', color: Colors.textSecondary }}>(optional)</Text></Text>
        <TouchableOpacity style={styles.uploadCard} onPress={() => pick(setIdBack)}>
          {idBack ? <Image source={{ uri: idBack }} style={styles.previewImg} /> : (
            <><View style={styles.uploadIcon}><Ionicons name="camera-outline" size={26} color={Colors.primary} /></View><Text style={styles.uploadTitle}>Tap to upload back</Text></>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>Your data is encrypted and handled securely.</Text>
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
  step: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  progressBg: { marginTop: 10, height: 6, borderRadius: 99, backgroundColor: '#E5F2E7', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  iconWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24 },
  heading: { marginTop: 18, textAlign: 'center', fontSize: 28, fontWeight: '800', color: Colors.text },
  subheading: { marginTop: 8, textAlign: 'center', color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  fieldLabel: { marginTop: 16, marginBottom: 8, fontSize: 15, fontWeight: '700', color: Colors.text },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff' },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  typeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.primaryDark },
  input: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', paddingHorizontal: 14, fontSize: 16, color: Colors.text },
  uploadCard: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFE8D4', borderRadius: 18, backgroundColor: '#FBFFFB', padding: 22, alignItems: 'center', minHeight: 100, justifyContent: 'center' },
  uploadIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF8EF', alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { marginTop: 10, fontSize: 16, fontWeight: '700', color: Colors.text },
  previewImg: { width: '100%', height: 140, borderRadius: 12, resizeMode: 'cover' },
  primaryBtn: { marginTop: 28, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerText: { textAlign: 'center', marginTop: 14, color: '#98A2B3', fontSize: 12 },
});
