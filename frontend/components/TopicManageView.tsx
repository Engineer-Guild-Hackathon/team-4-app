import { useAuth } from '@/hooks/useAuth';
import { checkMentorSelectionRequired } from '@/services/api/mentorship';
import {
  createTopic,
  getAllTopics,
  getMyTopics,
  getTopicLevelInfo,
  joinTopic,
  leaveTopic,
  updateMenteeCapacity,
} from '@/services/api/topic';
import { getMe } from '@/services/api/user';
import { theme } from '@/styles/theme';
import { MyTopicOut, TopicOut } from '@/types/topic';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from './Shared/Button';

interface TopicManageViewProps {
  onBack: () => void;
}

export function TopicManageView({ onBack }: TopicManageViewProps) {
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [myTopics, setMyTopics] = useState<MyTopicOut[]>([]);
  const [availableTopics, setAvailableTopics] = useState<TopicOut[]>([]);
  const [allTopics, setAllTopics] = useState<TopicOut[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [capacityInputs, setCapacityInputs] = useState<{ [topicId: string]: string }>({});
  const { accessToken } = useAuth();
  const router = useRouter();

  // 参加トピック一覧を取得
  const fetchMyTopics = useCallback(async () => {
    try {
      const response = await getMyTopics();
      setMyTopics(response.topics || []);
      // 弟子定員の入力値を初期化
      const initialCapacityInputs: { [topicId: string]: string } = {};
      (response.topics || []).forEach(topic => {
        initialCapacityInputs[topic.id] = topic.mentee_capacity.toString();
      });
      setCapacityInputs(initialCapacityInputs);
    } catch {
      setMyTopics([]);
    }
  }, []);

  // 全トピック一覧を取得
  const fetchAllTopics = useCallback(async () => {
    try {
      const response = await getAllTopics();
      setAllTopics(response.topics || []);
    } catch {
      setAllTopics([]);
    }
  }, []);

  // 初期データ取得
  useEffect(() => {
    if (accessToken) {
      fetchMyTopics();
      fetchAllTopics();
    }
  }, [accessToken, fetchMyTopics, fetchAllTopics]);

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
    } catch (error: unknown) {
      const errorMessage =
        (error as { message?: string })?.message || 'トピックの作成に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピックに参加する
  const handleJoinTopic = async (topicId: string) => {
    try {
      // トピックのレベル情報を取得
      const levelInfo = (await getTopicLevelInfo(topicId)) as {
        max_level: number;
        min_level: number;
        user_count: number;
      };

      // デフォルトレベルを設定（最低レベル-1、誰もいない場合は1）
      const defaultLevel = levelInfo.user_count > 0 ? levelInfo.min_level - 1 : 1;

      // トピックに参加
      await joinTopic(topicId, defaultLevel);
      await fetchMyTopics();
      await fetchAllTopics();

      // 師匠選択が必要かチェック
      const selectionResponse = (await checkMentorSelectionRequired(topicId)) as {
        required: boolean;
      };

      if (selectionResponse.required) {
        // 師匠選択が必要な場合
        Alert.alert('参加完了', '師匠選択が必要です', [
          {
            text: 'OK',
            onPress: () => {
              router.push({ pathname: '/select-level-mentor', params: { topicId } });
            },
          },
        ]);
      } else {
        // 師匠選択が不要な場合（最初のユーザーなど）
        Alert.alert('参加完了', 'トピックに参加しました', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage = error.message || '参加に失敗しました';
      Alert.alert('エラー', errorMessage);
    }
  };

  // トピック作成モーダルを開く
  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  // 弟子定員を更新
  const handleUpdateCapacity = async (topicId: string, newCapacity: number) => {
    try {
      await updateMenteeCapacity(topicId, newCapacity);
      Alert.alert('更新完了', `弟子定員を${newCapacity}人に設定しました`);
      fetchMyTopics(); // トピック一覧を再取得
    } catch (error: any) {
      Alert.alert('エラー', error.message || '弟子定員の更新に失敗しました');
      // エラー時は元の値に戻す
      const topic = myTopics.find(t => t.id === topicId);
      if (topic) {
        setCapacityInputs(prev => ({
          ...prev,
          [topicId]: topic.mentee_capacity.toString(),
        }));
      }
    }
  };

  // 弟子定員入力値の変更を処理
  const handleCapacityInputChange = (topicId: string, value: string) => {
    setCapacityInputs(prev => ({
      ...prev,
      [topicId]: value,
    }));
  };

  // 弟子定員入力完了時の処理
  const handleCapacityInputSubmit = (topicId: string) => {
    const value = capacityInputs[topicId];
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < 1 || numValue > 100) {
      // 無効な値の場合は元の値に戻す
      const topic = myTopics.find(t => t.id === topicId);
      if (topic) {
        setCapacityInputs(prev => ({
          ...prev,
          [topicId]: topic.mentee_capacity.toString(),
        }));
      }
      Alert.alert('エラー', '弟子定員は1〜100の範囲で入力してください');
      return;
    }

    handleUpdateCapacity(topicId, numValue);
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
          <Button variant="secondary" size="sm" onPress={onBack}>
            戻る
          </Button>
        </View>

        {/* 新規トピック作成 */}

        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>新規トピック作成</Text>
          <Button variant="primary" onPress={openCreateModal}>
            新規トピック作成
          </Button>
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
                <Button variant="primary" size="sm" onPress={() => handleJoinTopic(topic.id)}>
                  参加
                </Button>
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
                  <View style={styles.capacitySection}>
                    <Text style={styles.capacityLabel}>弟子定員:</Text>
                    <View style={styles.capacityInputContainer}>
                      <TextInput
                        style={styles.capacityInput}
                        value={capacityInputs[topic.id] || topic.mentee_capacity.toString()}
                        keyboardType="numeric"
                        maxLength={3}
                        onChangeText={text => handleCapacityInputChange(topic.id, text)}
                        onBlur={() => handleCapacityInputSubmit(topic.id)}
                        onSubmitEditing={() => handleCapacityInputSubmit(topic.id)}
                      />
                      <Text style={styles.capacityUnit}>人</Text>
                    </View>
                  </View>
                </View>
                <Button variant="secondary" size="sm" onPress={() => handleLeaveTopic(topic.id)}>
                  抜ける
                </Button>
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
            <Button variant="secondary" size="sm" onPress={() => setShowCreateModal(false)}>
              閉じる
            </Button>
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
            <Button variant="primary" onPress={handleCreateTopic}>
              作成
            </Button>
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
  capacitySection: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  capacityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#374151',
    backgroundColor: '#ffffff',
    minWidth: 40,
    textAlign: 'center',
  },
  capacityUnit: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});
