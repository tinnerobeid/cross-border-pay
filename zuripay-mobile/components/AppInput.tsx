import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';

type Props = TextInputProps & {
  label: string;
  leftText?: string;
  onLeftPress?: () => void;
};

export default function AppInput({
  label,
  leftText,
  onLeftPress,
  style,
  ...props
}: Props) {
  const Left = () => {
    if (!leftText) return null;
    if (onLeftPress) {
      return (
        <TouchableOpacity onPress={onLeftPress} style={styles.leftTextWrapper}>
          <Text style={styles.leftText}>{leftText}</Text>
        </TouchableOpacity>
      );
    }
    return <Text style={styles.leftText}>{leftText}</Text>;
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Left />
        <TextInput
          placeholderTextColor="#98A2B3"
          style={[styles.input, leftText ? { paddingLeft: 8 } : null, style]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  leftText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  leftTextWrapper: {
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.text,
    fontSize: 15,
  },
});