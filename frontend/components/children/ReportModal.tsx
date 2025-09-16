import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
