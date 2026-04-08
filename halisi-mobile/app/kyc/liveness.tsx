import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/colors';

export default function KycLivenessScreen() {
  const params = useLocalSearchParams<{ idType?: string; idNumber?: string; idFront?: string; idBack?: string }>();
  const [selfie, setSelfie] = useState<string | null>(null);

  const takeSelfie = async () => {
    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm.status === 'granted') {
      const result = await ImagePicker.launchCameraAsync({ cameraType: ImagePicker.CameraType.front, quality: 0.8 });
      if (!result.canceled && result.assets[0]) { setSelfie(result.assets[0].uri); return; }
    }
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libPerm.status !== 'granted') { Alert.alert('Permission needed', 'Allow camera or photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setSelfie(result.assets[0].uri);
  };

  const handleContinue = () => {
    if (!selfie) { Alert.alert('Required', 'Please take a selfie photo.'); return; }
    router.push({ pathname: '/kyc/address', params: { ...params, selfie } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
          <Text style={styles.title}>Selfie Check</Text>
          <Text style={styles.step}>Step 2 of 3</Text>
        </View>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: '66%' }]} /></View>

        <View style={styles.cameraBox}>
          <Text style={styles.heading}>Take a Selfie</Text>
          <Text style={styles.subheading}>Position your face clearly and ensure good lighting.</Text>
          {selfie ? <Image source={{ uri: selfie }} style={styles.selfiePreview} /> : (
            <View style={styles.faceCircle}><View style={styles.innerCircle} /></View>
          )}
          <View style={styles.instructionChip}>
            <Ionicons name="eye-outline" size={14} color={Colors.primaryDark} />
            <Text style={styles.instructionText}>LOOK STRAIGHT AT THE CAMERA</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie}>
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.captureBtnText}>{selfie ? 'Retake Selfie' : 'Take Selfie'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.primaryBtn, !selfie && { opacity: 0.5 }]} onPress={handleContinue} disabled={!selfie}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>END-TO-END ENCRYPTED VERIFICATION</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  step: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark },
  progressBg: { marginTop: 10, height: 6, borderRadius: 99, backgroundColor: '#E5F2E7', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  cameraBox: { marginTop: 18, backgroundColor: '#F5F7F5', borderRadius: 22, padding: 18, alignItems: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: Colors.text },
  subheading: { textAlign: 'center', color: Colors.textSecondary, marginTop: 8, lineHeight: 20 },
  faceCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: Colors.primary, marginTop: 22, alignItems: 'center', justifyContent: 'center' },
  innerCircle: { width: 178, height: 178, borderRadius: 89, borderWidth: 2, borderStyle: 'dashed', borderColor: '#B7E3BE' },
  selfiePreview: { width: 200, height: 200, borderRadius: 100, marginTop: 22 },
  instructionChip: { marginTop: 16, backgroundColor: '#ECF8ED', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' },
  instructionText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 12 },
  captureBtn: { marginTop: 18, height: 54, borderRadius: 14, borderWidth: 2, borderColor: Colors.primary, backgroundColor: Colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  captureBtnText: { color: Colors.primaryDark, fontWeight: '800', fontSize: 16 },
  primaryBtn: { marginTop: 12, height: 54, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  footerText: { textAlign: 'center', marginTop: 16, color: '#98A2B3', fontSize: 12, fontWeight: '700' },
});
