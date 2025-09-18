import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme, remToPx } from '@/styles/theme';
import { Button } from '../Shared/Button';
import { MixedFontText } from '@/components/Shared/MixedFontText';

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
        Alert.alert('エラー', '報告に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <MixedFontText style={styles.title}>ポスト報告</MixedFontText>
          <TextInput
            style={styles.input}
            placeholder="報告理由を入力"
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Button
            variant="secondary"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            {loading ? '報告中...' : '報告する'}
          </Button>
          <Button variant="secondary" onPress={onClose} style={styles.button}>
            閉じる
          </Button>
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
    backgroundColor: theme.colors.background.primary,
    borderRadius: remToPx(theme.borderRadius.xl),
    padding: remToPx(theme.spacing[20]), // xxl
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: remToPx(theme.spacing[8]), // lg
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: remToPx(theme.borderRadius.md),
    padding: remToPx(theme.spacing[4]), // md
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[8]), // lg
    backgroundColor: theme.colors.background.secondary,
    minHeight: 60,
    textAlignVertical: 'top',
    color: theme.colors.text.primary,
  },
  button: {
    marginBottom: remToPx(theme.spacing[3]),
  },
});
