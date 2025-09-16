import { useAuth } from '@/hooks/useAuth';
import { createTopic, getAllTopics, getMyTopics, leaveTopic } from '@/services/api/topic';
import { theme } from '@/styles/theme';
import { getMe } from '@/services/api/user';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Topic {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface TopicManageViewProps {
  onBack: () => void;
}

export function TopicManageView({ onBack }: TopicManageViewProps) {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [myTopics, setMyTopics] = useState<Topic[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { accessToken } = useAuth();
  const router = useRouter();

  // 参加トピック一覧を取得
  const fetchMyTopics = useCallback(async () => {
    try {
      const response = await getMyTopics();
      setMyTopics(response.topics || []);
    } catch {
      setMyTopics([]);
    }
  }, []);

  // 全トピック一覧を取得
  const fetchAllTopics = async () => {
    try {
      const response = await getAllTopics();
      setAllTopics(response.topics || []);
    } catch {
      setAllTopics([]);
    }
  };

  // 初期データ取得
  useEffect(() => {
    if (accessToken) {
      fetchMyTopics();
      fetchAllTopics();
    }
  }, [accessToken]);

  // 参加可能なトピックを更新するuseEffect
  useEffect(() => { 
      const myTopicIds = myTopics.map(topic => topic.id);
      setAvailableTopics(allTopics.filter(topic => !myTopicIds.includes(topic.id)));
  }, [allTopics, myTopics]);


  // トピック作成
  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    try {
      await createTopic(newTopicTitle.trim(), newTopicDescription.trim());
      setNewTopicTitle('');
      setNewTopicDescription('');
      await fetchMyTopics();
      await fetchAllTopics();
      Alert.alert('成功', 'トピックを作成しました');
    } catch (error: any) {
      const errorMessage = error?.message || 'トピックの作成に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピックに参加する（画面遷移）
  const handleJoinTopic = (topicId: string) => {
    router.push({ pathname: '/select-level-mentor', params: { topicId } });
  };

  // トピック作成モーダルを開く
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // トピックから抜ける
  const handleLeaveTopic = async (topicId: string) => {
    Alert.alert('確認', 'このトピックから抜けますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '抜ける',
        style: 'destructive',
        onPress: async () => {
          try {
            // ユーザーIDを取得（現在のユーザー情報から）
            const userResponse = await getMe();
            await leaveTopic(topicId, userResponse.id);
            await fetchMyTopics();
            await fetchAllTopics();
            Alert.alert('成功', 'トピックから抜けました');
          } catch {
            Alert.alert('エラー', 'トピックからの退出に失敗しました');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.manageContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.manageTitle}>トピック管理</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>

        {/* 新規トピック作成 */}

        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>新規トピック作成</Text>
          <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
            <Text style={styles.createButtonText}>新規トピック作成</Text>
          </TouchableOpacity>
        </View>

        {/* トピック参加 */}
        <Text style={styles.sectionTitle}>参加可能なトピック</Text>
        <ScrollView style={styles.joinSection}>
          {availableTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <Text style={styles.emptyTopicsText}>参加可能なトピックがありません</Text>
              <Text style={styles.emptyTopicsSubText}>
                新しいトピックを作成するか、他のユーザーがトピックを作成するまでお待ちください
              </Text>
            </View>
          ) : (
            availableTopics.map(topic => (
              <View key={topic.id} style={styles.availableTopicItem}>
                <View style={styles.availableTopicInfo}>
                  <Text style={styles.availableTopicTitle}>{topic.title}</Text>
                  <Text style={styles.availableTopicDescription}>{topic.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.joinTopicButton}
                  onPress={() => handleJoinTopic(topic.id)}
                >
                  <Text style={styles.joinTopicButtonText}>参加</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* 参加中トピック一覧 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>参加中のトピック</Text>
          {myTopics.length === 0 ? (
            <View style={styles.emptyTopicsContainer}>
              <Text style={styles.emptyTopicsText}>参加しているトピックがありません</Text>
              <Text style={styles.emptyTopicsSubText}>トピックを作成してください</Text>
            </View>
          ) : (
            myTopics.map(topic => (
              <View key={topic.id} style={styles.topicItem}>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicItemTitle}>{topic.title}</Text>
                  <Text style={styles.topicItemDescription}>{topic.description}</Text>
                </View>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={() => handleLeaveTopic(topic.id)}
                >
                  <Text style={styles.leaveButtonText}>抜ける</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* トピック作成モーダル */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>新規トピック作成</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="タイトル"
              value={newTopicTitle}
              onChangeText={setNewTopicTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="説明（任意）"
              value={newTopicDescription}
              onChangeText={setNewTopicDescription}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateTopic}>
              <Text style={styles.createButtonText}>作成</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: remToPx(theme.typography.fontSize.lg),
    color: theme.colors.text.tertiary,
    fontFamily: 'Klee One',
  },
  manageContainer: {
    flex: 1,
    paddingHorizontal: remToPx(theme.spacing[8]), // xl
    paddingTop: remToPx(theme.spacing[32]), // 6xl
    paddingBottom: remToPx(theme.spacing[8]),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: remToPx(theme.spacing[12]), // 3xl
  },
  manageTitle: {
    fontSize: remToPx(theme.typography.fontSize['2xl']),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  backButton: {
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: remToPx(theme.spacing[6]), // lg
    paddingVertical: remToPx(theme.spacing[3]), // sm
  },
  backButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
  createSection: {
    marginBottom: remToPx(theme.spacing[12]),
  },
  listSection: {
    marginBottom: remToPx(theme.spacing[12]),
  },
  sectionTitle: {
    fontSize: remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginBottom: remToPx(theme.spacing[6]) - 1,
    fontFamily: 'Klee One',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: remToPx(theme.spacing[4]), // md
    paddingVertical: remToPx(theme.spacing[4]) - 2,
    fontSize: remToPx(theme.typography.fontSize.base),
    marginBottom: remToPx(theme.spacing[4]) - 2,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    paddingVertical: remToPx(theme.spacing[4]),
    alignItems: 'center',
  },
  createButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: remToPx(theme.spacing[6]) - 1,
    marginBottom: remToPx(theme.spacing[4]) - 2,
  },
  topicInfo: {
    flex: 1,
  },
  topicItemTitle: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[2]), // xs
    fontFamily: 'Klee One',
  },
  topicItemDescription: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.tertiary,
    fontFamily: 'Klee One',
  },
  leaveButton: {
    backgroundColor: theme.colors.semantic.warning.main,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: remToPx(theme.spacing[4]),
    paddingVertical: remToPx(theme.spacing[3]),
  },
  leaveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
  emptyTopicsContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: remToPx(theme.spacing[8]),
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.tertiary,
    marginBottom: remToPx(theme.spacing[3]),
    textAlign: 'center',
    fontFamily: 'Klee One',
  },
  emptyTopicsSubText: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.placeholder,
    textAlign: 'center',
    lineHeight: remToPx(theme.typography.lineHeight.tight),
    fontFamily: 'Klee One',
  },
  joinSection: {
    marginBottom: remToPx(theme.spacing[12]),
  },
  joinButton: {
    backgroundColor: theme.colors.semantic.success.main,
    borderRadius: theme.borderRadius.md,
    paddingVertical: remToPx(theme.spacing[4]),
    alignItems: 'center',
  },
  joinButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: remToPx(theme.spacing[6]),
    paddingTop: remToPx(theme.spacing[6]),
    paddingBottom: remToPx(theme.spacing[8]),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  modalTitle: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: 'Klee One',
  },
  modalCloseButton: {
    backgroundColor: theme.colors.text.tertiary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: remToPx(theme.spacing[6]),
    paddingVertical: remToPx(theme.spacing[3]),
  },
  modalCloseButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: remToPx(theme.spacing[8]),
    paddingTop: remToPx(theme.spacing[8]),
  },
  availableTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: remToPx(theme.spacing[6]) - 1,
    marginBottom: remToPx(theme.spacing[4]) - 2,
  },
  availableTopicInfo: {
    flex: 1,
  },
  availableTopicTitle: {
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: remToPx(theme.spacing[2]),
    fontFamily: 'Klee One',
  },
  availableTopicDescription: {
    fontSize: remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.tertiary,
    fontFamily: 'Klee One',
  },
  joinTopicButton: {
    backgroundColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: remToPx(theme.spacing[6]),
    paddingVertical: remToPx(theme.spacing[3]),
  },
  joinTopicButtonText: {
    color: theme.colors.text.inverse,
    fontSize: remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: 'Klee One',
  },
});
