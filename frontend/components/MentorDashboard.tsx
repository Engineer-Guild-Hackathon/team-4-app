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

interface MentorDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export default function MentorDashboard({ visible, onClose }: MentorDashboardProps) {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<MentorRequest[]>([]);

  const fetchRequests = async () => {
    try {
      const data = await getReceivedMentorRequests() as MentorRequest[];
      setRequests(data);
    } catch (error) {
      console.error('リクエスト取得エラー:', error);
      Alert.alert('エラー', 'リクエストの取得に失敗しました');
    }
  };

  useEffect(() => {
    if (accessToken && visible) {
      fetchRequests();
    }
  }, [accessToken, visible]);


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
          <Text style={styles.subtitle}>
            師匠選択リクエスト ({requests.length}件)
          </Text>

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
});
