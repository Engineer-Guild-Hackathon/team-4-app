import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from '@/styles/theme';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ReportModal({ visible, onClose, onSubmit }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('エラー', '報告理由を入力してください');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(reason);
      setReason('');
      onClose();
      Alert.alert('報告完了', 'ポストを報告しました');
    } catch (e: unknown) {
      if (e instanceof Error) {
        Alert.alert('エラー', e?.message || '報告に失敗しました');
      } else {
        Alert.alert('エラー', '不明なエラーが発生しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>ポスト報告</Text>
          <TextInput
            style={styles.input}
            placeholder="報告理由を入力"
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitButtonText}>{loading ? '報告中...' : '報告する'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.layout.radius.xl,
    padding: theme.spacing.xxl,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.textDark,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.layout.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSizes.base,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLighter,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.black,
    borderRadius: theme.layout.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md - 2,
    ...theme.shadows.md,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
  closeButton: {
    backgroundColor: theme.colors.borderExtraLight,
    borderRadius: theme.layout.radius.md,
    paddingVertical: theme.spacing.md - 2,
    alignItems: 'center',
  },
  closeButtonText: {
    color: theme.colors.textMedium,
    fontSize: theme.typography.fontSizes.md + 1,
    fontWeight: theme.typography.fontWeights.bold,
  },
});
