import { PostMediaOut, PostOut } from '@/types/post';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReportModal from './ReportModal';

interface PostViewProps {
  posts: PostOut[];
  loading: boolean;
  error: string | null;
  selfUserId?: number;
  onDelete: (postId: number) => void;
}

const VideoItem = ({ uri, style }: { uri: string; style: any }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <VideoView
      player={player}
      style={style}
      // allowsFullscreen
      // allowsPictureInPicture
    />
  );
};

export default function PostView({ posts, loading, error, selfUserId, onDelete }: PostViewProps) {
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportTargetPost, setReportTargetPost] = React.useState<PostOut | null>(null);

  const handleOpenMenu = (post: PostOut) => {
    Alert.alert('投稿メニュー', '', [
      {
        text: 'ユーザーブロック（ダミー）',
        onPress: () => Alert.alert('ダミー', 'ユーザーブロック機能は未実装です'),
      },
      {
        text: 'ポスト報告',
        onPress: () => {
          setReportTargetPost(post);
          setShowReportModal(true);
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const renderPost = ({ item }: { item: PostOut }) => (
    <View style={styles.post}>
      <View style={{ position: 'absolute', top: 15, right: 0, flexDirection: 'row', zIndex: 2 }}>
        {Number(selfUserId) === Number(item.author?.id) ? (
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
            <Text style={styles.deleteButtonText}>削除</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => handleOpenMenu(item)} style={styles.menuButton}>
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
      <View>
        {item.media.map((media: PostMediaOut, index: number) => {
          const mediaUrl = media.file;
          if (media.media_type === 'image') {
            return <Image key={index} source={{ uri: mediaUrl }} style={styles.media} />;
          } else if (media.media_type === 'video') {
            return <VideoItem key={index} uri={mediaUrl} style={styles.media} />;
          }
          return null;
        })}
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }
  if (error) {
    return <Text style={styles.centered}>エラー: {error}</Text>;
  }
  if (posts.length === 0) {
    return <Text style={styles.centered}>まだ投稿がありません。</Text>;
  }
  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList data={posts} renderItem={renderPost} keyExtractor={item => item.id.toString()} />
      {/* 報告モーダル（必要ならpropsでonSubmitを渡す） */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTargetPost(null);
        }}
        onSubmit={async (reason: string) => {
          if (!reportTargetPost) return;
          const { reportPost } = await import('@/services/api/report');
          await reportPost(reportTargetPost.id, reason);
          setShowReportModal(false);
          setReportTargetPost(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  post: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  media: {
    width: '100%',
    height: 200,
    marginTop: 5,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: 15,
    right: 0,
    backgroundColor: '#ff4d4d',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 4,
  },
  menuButtonText: {
    color: '#374151',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
