import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import {
  getReceivedMentorRequests,
  approveMentorRequest,
  rejectMentorRequest,
  getMentees,
  expelMentee,
  graduateMentee,
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
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees'>('requests');

  const fetchRequests = async () => {
    try {
      const data = await getReceivedMentorRequests() as MentorRequest[];
      setRequests(data);
    } catch (error) {
      console.error('リクエスト取得エラー:', error);
      Alert.alert('エラー', 'リクエストの取得に失敗しました');
    }
  };

  const fetchMentees = async () => {
    if (!topicId) return;
    try {
      const data = await getMentees(topicId) as Mentee[];
      setMentees(data);
    } catch (error) {
      console.error('弟子一覧取得エラー:', error);
      Alert.alert('エラー', '弟子一覧の取得に失敗しました');
    }
  };

  useEffect(() => {
    if (accessToken && visible) {
      fetchRequests();
      if (topicId) {
        fetchMentees();
      }
    }
  }, [accessToken, visible, topicId]);


  const handleApprove = async (requestId: number, fromUserName: string) => {
    Alert.alert(
      '承認確認',
      `${fromUserName}さんの師匠選択リクエストを承認しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '承認',
          onPress: async () => {
            try {
              await approveMentorRequest(requestId);
              Alert.alert('承認完了', '師匠選択リクエストを承認しました');
              fetchRequests(); // リストを更新
            } catch (error) {
              console.error('承認エラー:', error);
              Alert.alert('エラー', '承認に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestId: number, fromUserName: string) => {
    Alert.alert(
      '拒否確認',
      `${fromUserName}さんの師匠選択リクエストを拒否しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '拒否',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectMentorRequest(requestId);
              Alert.alert('拒否完了', '師匠選択リクエストを拒否しました');
              fetchRequests(); // リストを更新
            } catch (error) {
              console.error('拒否エラー:', error);
              Alert.alert('エラー', '拒否に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleExpelMentee = async (menteeId: number, menteeName: string) => {
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
              Alert.alert('破門完了', '弟子を破門しました');
              fetchMentees(); // リストを更新
            } catch (error) {
              console.error('破門エラー:', error);
              Alert.alert('エラー', '破門に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleGraduateMentee = async (menteeId: number, menteeName: string) => {
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
              Alert.alert('卒業完了', '弟子を卒業させました');
              fetchMentees(); // リストを更新
            } catch (error) {
              console.error('卒業エラー:', error);
              Alert.alert('エラー', '卒業に失敗しました');
            }
          },
        },
      ]
    );
  };


  const renderRequest = ({ item }: { item: MentorRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.userName}>
          {item.from_user.first_name} {item.from_user.last_name}
        </Text>
        <Text style={styles.username}>@{item.from_user.username}</Text>
      </View>
      
      <Text style={styles.topicTitle}>トピック: {item.topic.title}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item.id, item.from_user.username)}
        >
          <Text style={styles.approveButtonText}>承認</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id, item.from_user.username)}
        >
          <Text style={styles.rejectButtonText}>拒否</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMentee = ({ item }: { item: Mentee }) => (
    <View style={styles.menteeCard}>
      <View style={styles.menteeHeader}>
        <Text style={styles.menteeName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.menteeUsername}>@{item.username}</Text>
      </View>
      
      <Text style={styles.menteeLevel}>レベル: {item.level}</Text>
      <Text style={styles.menteeDate}>入門日: {new Date(item.created_at).toLocaleDateString()}</Text>
      
      <View style={styles.menteeButtonContainer}>
        <TouchableOpacity
          style={[styles.menteeButton, styles.graduateButton]}
          onPress={() => handleGraduateMentee(item.id, item.username)}
        >
          <Text style={styles.graduateButtonText}>卒業</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.menteeButton, styles.expelButton]}
          onPress={() => handleExpelMentee(item.id, item.username)}
        >
          <Text style={styles.expelButtonText}>破門</Text>
        </TouchableOpacity>
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>師匠ダッシュボード</Text>
        </View>

        <View style={styles.content}>
          {/* タブ切り替え */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                リクエスト ({requests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'mentees' && styles.activeTab]}
              onPress={() => setActiveTab('mentees')}
            >
              <Text style={[styles.tabText, activeTab === 'mentees' && styles.activeTabText]}>
                弟子 ({mentees.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* リクエストタブ */}
          {activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    現在、師匠選択リクエストはありません
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={requests}
                  renderItem={renderRequest}
                  keyExtractor={(item) => item.id.toString()}
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
                  <Text style={styles.emptyText}>
                    現在、弟子はいません
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={mentees}
                  renderItem={renderMentee}
                  keyExtractor={(item) => item.id.toString()}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    marginRight: 16,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestHeader: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  topicTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  approveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  rejectButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  // タブ関連のスタイル
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '600',
  },
  // 弟子関連のスタイル
  menteeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menteeHeader: {
    marginBottom: 8,
  },
  menteeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menteeUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  menteeLevel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  menteeDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  menteeButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menteeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  graduateButton: {
    backgroundColor: '#4CAF50',
  },
  expelButton: {
    backgroundColor: '#f44336',
  },
  graduateButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  expelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});
