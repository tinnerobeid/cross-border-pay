import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';

type Props = TextInputProps & {
  label: string;
  leftText?: string;
  onLeftPress?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
};

export default function AppInput({
  label,
  leftText,
  onLeftPress,
  rightIcon,
  onRightPress,
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

  const Right = () => {
    if (!rightIcon) return null;
    if (onRightPress) {
      return (
        <TouchableOpacity onPress={onRightPress} style={styles.rightIconWrapper}>
          {rightIcon}
        </TouchableOpacity>
      );
    }
    return <View style={styles.rightIconWrapper}>{rightIcon}</View>;
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
        <Right />
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
  rightIconWrapper: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.text,
    fontSize: 15,
  },
});