import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onDismiss: () => void;
}

const COLORS = {
  primary: '#39E53D',
  error: '#DC2626',
  backgroundLight: '#F5F7F6',
  surfaceLight: '#FFFFFF',
  textDark: '#121811',
  textGray: '#6B7280',
  textLightGray: '#9CA3AF',
  googleBorder: '#E5E7EB',
};

export default function StyledAlert({
  visible,
  title,
  message,
  type = 'warning',
  onDismiss,
}: StyledAlertProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'error':
        return 'error';
      case 'success':
        return 'check-circle';
      case 'info':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon and Title */}
          <View style={styles.header}>
            <MaterialIcons 
              name={getTypeIcon()} 
              size={40} 
              color={type === 'error' || type === 'warning' ? COLORS.error : COLORS.primary}
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* OK Button - Centered */}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertContainer: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    maxWidth: 350,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 24,
    width: '100%',
  },
  message: {
    fontSize: 15,
    color: COLORS.textGray,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
});