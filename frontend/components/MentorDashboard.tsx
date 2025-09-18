import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { theme } from '@/styles/theme';
import { Button } from './Shared/Button';
import { MixedFontText } from './Shared/MixedFontText';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import {
  getReceivedMentorRequests,
  approveMentorRequest,
  rejectMentorRequest,
  getMentees,
  expelMentee,
  graduateMentee,
  getMentorCapacity,
} from '@/services/api/mentorship';

interface MentorRequest {
  id: number;
  from_user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  topic: {
    id: string;
    title: string;
  };
  created_at: string;
  status: string;
}

interface Mentee {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  level: number;
  created_at: string;
}

interface MentorDashboardProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
}

export default function MentorDashboard({ visible, onClose, topicId }: MentorDashboardProps) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees'>('requests');
  const [capacityInfo, setCapacityInfo] = useState<{
    current_count: number;
    capacity: number;
    is_within_capacity: boolean;
    remaining_slots: number;
  } | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = (await getReceivedMentorRequests()) as MentorRequest[];
      setRequests(data);
    } catch (error) {
      console.error('リクエスト取得エラー:', error);
      Alert.alert('エラー', 'リクエストの取得に失敗しました');
    }
  }, []);

  const fetchMentees = useCallback(async () => {
    if (!topicId) return;
    try {
      const data = (await getMentees(topicId)) as Mentee[];
      setMentees(data);
    } catch (error) {
      console.error('弟子一覧取得エラー:', error);
      Alert.alert('エラー', '弟子一覧の取得に失敗しました');
    }
  }, [topicId]);

  const fetchCapacityInfo = useCallback(async () => {
    if (!topicId) return;
    try {
      const data = (await getMentorCapacity(topicId)) as {
        current_count: number;
        capacity: number;
        is_within_capacity: boolean;
        remaining_slots: number;
      };
      setCapacityInfo(data);
    } catch (error) {
      console.error('定員情報取得エラー:', error);
    }
  }, [topicId]);

  useEffect(() => {
    if (accessToken && visible) {
      fetchRequests();
      if (topicId) {
        fetchMentees();
        fetchCapacityInfo();
      }
    }
  }, [accessToken, visible, topicId, fetchRequests, fetchMentees, fetchCapacityInfo]);

  const handleApprove = useCallback(
    (requestId: number, fromUserName: string) => {
      // 定員チェック
      if (capacityInfo && !capacityInfo.is_within_capacity) {
        Alert.alert(
          '定員満員',
          `弟子の定員がいっぱいです。\n現在: ${capacityInfo.current_count}/${capacityInfo.capacity}人\n\n既存の弟子を破門または卒業させてから承認してください。`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert('承認確認', `${fromUserName}さんの師匠選択リクエストを承認しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '承認',
          onPress: async () => {
            try {
              await approveMentorRequest(requestId);
              Alert.alert('承認完了', '師匠選択リクエストを承認しました', [
                {
                  text: 'OK',
                  onPress: () => {
                    onClose();
                    router.replace('/');
                  },
                },
              ]);
            } catch (error: any) {
              console.error('承認エラー:', error);
              // 定員超過の場合は特別なメッセージを表示
              if (error?.response?.data?.message?.includes('Capacity exceeded')) {
                Alert.alert(
                  '定員満員',
                  '弟子の定員がいっぱいです。\n既存の弟子を破門または卒業させてから承認してください。'
                );
              } else {
                Alert.alert('エラー', '承認に失敗しました');
              }
            }
          },
        },
      ]);
    },
    [capacityInfo]
  );

  const handleReject = useCallback(
    (requestId: number, fromUserName: string) => {
      Alert.alert('拒否確認', `${fromUserName}さんの師匠選択リクエストを拒否しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '拒否',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectMentorRequest(requestId);
              Alert.alert('拒否完了', '師匠選択リクエストを拒否しました', [
                {
                  text: 'OK',
                  onPress: () => {
                    onClose();
                    router.replace('/');
                  },
                },
              ]);
            } catch (error) {
              console.error('拒否エラー:', error);
              Alert.alert('エラー', '拒否に失敗しました');
            }
          },
        },
      ]);
    },
    [fetchRequests]
  );

  const handleExpelMentee = useCallback(
    (menteeId: number, menteeName: string) => {
      if (!topicId) return;

      Alert.alert(
        '破門確認',
        `${menteeName}さんを破門しますか？\n破門すると師弟関係が解消され、弟子のステータスが「破門済み」になります。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '破門',
            style: 'destructive',
            onPress: async () => {
              try {
                await expelMentee(menteeId, topicId);
                // 定員情報を再取得
                await fetchCapacityInfo();
                await fetchMentees();
                Alert.alert('破門完了', '弟子を破門しました', [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      router.replace('/');
                    },
                  },
                ]);
              } catch (error) {
                console.error('破門エラー:', error);
                Alert.alert('エラー', '破門に失敗しました');
              }
            },
          },
        ]
      );
    },
    [topicId, fetchMentees, fetchCapacityInfo]
  );

  const handleGraduateMentee = useCallback(
    (menteeId: number, menteeName: string) => {
      if (!topicId) return;

      Alert.alert(
        '卒業確認',
        `${menteeName}さんを卒業させますか？\n卒業すると師弟関係が解消され、弟子のレベルが上がります。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '卒業',
            onPress: async () => {
              try {
                await graduateMentee(menteeId, topicId);
                // 定員情報を再取得
                await fetchCapacityInfo();
                await fetchMentees();
                Alert.alert('卒業完了', '弟子を卒業させました', [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      router.replace('/');
                    },
                  },
                ]);
              } catch (error) {
                console.error('卒業エラー:', error);
                Alert.alert('エラー', '卒業に失敗しました');
              }
            },
          },
        ]
      );
    },
    [topicId, fetchMentees, fetchCapacityInfo]
  );

  const renderRequest = ({ item }: { item: MentorRequest }) => {
    const isCapacityFull = capacityInfo && !capacityInfo.is_within_capacity;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <MixedFontText style={styles.userName}>
            {item.from_user.first_name} {item.from_user.last_name}
          </MixedFontText>
          <MixedFontText style={styles.username}>@{item.from_user.username}</MixedFontText>
        </View>

        <MixedFontText style={styles.topicTitle}>トピック: {item.topic.title}</MixedFontText>

        {/* 定員情報表示 */}
        {capacityInfo && (
          <View style={styles.capacityInfo}>
            <MixedFontText style={styles.capacityText}>
              定員: {capacityInfo.current_count}/{capacityInfo.capacity}人
            </MixedFontText>
            {isCapacityFull && (
              <MixedFontText style={styles.capacityFullText}>満員です</MixedFontText>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={() => handleApprove(item.id, item.from_user.username)}
            style={
              isCapacityFull
                ? { ...styles.actionButton, ...styles.disabledButton }
                : styles.actionButton
            }
            disabled={isCapacityFull || false}
          >
            承認
          </Button>
          <Button
            variant="secondary"
            onPress={() => handleReject(item.id, item.from_user.username)}
            style={styles.actionButton}
          >
            拒否
          </Button>
        </View>
      </View>
    );
  };

  const renderMentee = ({ item }: { item: Mentee }) => (
    <View style={styles.menteeCard}>
      <View style={styles.menteeHeader}>
        <MixedFontText style={styles.menteeName}>
          {item.first_name} {item.last_name}
        </MixedFontText>
        <MixedFontText style={styles.menteeUsername}>@{item.username}</MixedFontText>
      </View>

      <MixedFontText style={styles.menteeDate}>
        入門日: {new Date(item.created_at).toLocaleDateString()}
      </MixedFontText>

      <View style={styles.menteeButtonContainer}>
        <Button
          variant="primary"
          onPress={() => handleGraduateMentee(item.id, item.username)}
          style={styles.actionButton}
        >
          卒業
        </Button>
        <Button
          variant="secondary"
          onPress={() => handleExpelMentee(item.id, item.username)}
          style={styles.actionButton}
        >
          破門
        </Button>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            variant="ghost"
            onPress={onClose}
            style={styles.closeButton}
            textStyle={styles.closeButtonText}
          >
            ✕
          </Button>
          <MixedFontText style={styles.title}>師匠ダッシュボード</MixedFontText>
        </View>

        <View style={styles.content}>
          {/* タブ切り替え */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <MixedFontText
                style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}
              >
                リクエスト ({requests.length})
              </MixedFontText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'mentees' && styles.activeTab]}
              onPress={() => setActiveTab('mentees')}
            >
              <MixedFontText
                style={[styles.tabText, activeTab === 'mentees' && styles.activeTabText]}
              >
                弟子 ({mentees.length})
              </MixedFontText>
            </TouchableOpacity>
          </View>

          {/* リクエストタブ */}
          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MixedFontText style={styles.emptyText}>
                    現在、師匠選択リクエストはありません
                  </MixedFontText>
                </View>
              ) : (
                <FlatList
                  data={requests}
                  renderItem={renderRequest}
                  keyExtractor={item => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}

          {/* 弟子タブ */}
          {activeTab === 'mentees' && (
            <>
              {mentees.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MixedFontText style={styles.emptyText}>現在、弟子はいません</MixedFontText>
                </View>
              ) : (
                <FlatList
                  data={mentees}
                  renderItem={renderMentee}
                  keyExtractor={item => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.remToPx(theme.spacing[6]), // lg
    paddingTop: theme.remToPx(theme.spacing[24]), // 5xl
    paddingBottom: theme.remToPx(theme.spacing[6]),
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.tertiary,
  },
  closeButton: {
    marginRight: theme.remToPx(theme.spacing[6]),
  },
  closeButtonText: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    color: theme.colors.primary[300],
    fontWeight: theme.typography.fontWeight.bold,
  },
  title: {
    fontSize: theme.remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: theme.remToPx(theme.spacing[6]),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.remToPx(theme.borderRadius.lg),
    padding: theme.remToPx(theme.spacing[6]),
    marginBottom: theme.remToPx(theme.spacing[4]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  requestHeader: {
    marginBottom: theme.remToPx(theme.spacing[3]),
  },
  userName: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  username: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginTop: theme.remToPx(theme.spacing[1]), // xxs
  },
  topicTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: theme.remToPx(theme.spacing[2]), // xs
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.remToPx(theme.spacing[2]), // xs
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: theme.remToPx(theme.spacing[6]),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.remToPx(theme.spacing[2]), // xs
  },
  tab: {
    flex: 1,
    paddingVertical: theme.remToPx(theme.spacing[3]), // sm
    paddingHorizontal: theme.remToPx(theme.spacing[6]), // lg
    borderRadius: theme.remToPx(theme.borderRadius.sm),
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  menteeCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.remToPx(theme.borderRadius.lg),
    padding: theme.remToPx(theme.spacing[6]),
    marginBottom: theme.remToPx(theme.spacing[4]),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  menteeHeader: {
    marginBottom: theme.remToPx(theme.spacing[3]),
  },
  menteeName: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  menteeUsername: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.secondary,
    marginTop: theme.remToPx(theme.spacing[1]),
  },
  menteeLevel: {
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    color: theme.colors.text.primary,
    marginBottom: theme.remToPx(theme.spacing[2]),
  },
  menteeDate: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.tertiary,
    marginBottom: theme.remToPx(theme.spacing[4]),
  },
  menteeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityInfo: {
    marginBottom: theme.remToPx(theme.spacing[3]),
    padding: theme.remToPx(theme.spacing[2]),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.remToPx(theme.borderRadius.sm),
  },
  capacityText: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  capacityFullText: {
    fontSize: theme.remToPx(theme.typography.fontSize.sm),
    color: theme.colors.semantic.error.main,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    marginTop: theme.remToPx(theme.spacing[1]),
  },
  disabledButton: {
    opacity: 0.5,
  },
});
