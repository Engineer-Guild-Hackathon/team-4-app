import ReportModal from '@/components/children/ReportModal';
import { useAuth } from '@/hooks/AuthProvider';
import { getPosts } from '@/services/api/post';
import { theme } from '@/styles/theme';
import { PostOut } from '@/types/post';
import Fontisto from '@expo/vector-icons/Fontisto';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const VideoItem = ({ uri, style, isActive }: { uri: string; style: any; isActive: boolean }) => {
  const player = useVideoPlayer(uri, player => {
    player.loop = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
    return () => player.pause();
  }, [isActive, player]);

  return <VideoView player={player} style={style} contentFit="cover" />;
};

const PostCard = ({
  post,
  onSwipe,
  isActive,
  selfUserId,
  onAuthorPress,
}: {
  post: PostOut;
  onSwipe: () => void;
  isActive: boolean;
  selfUserId?: number;
  onAuthorPress: (userId: number) => void;
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetPost, setReportTargetPost] = useState<PostOut | null>(null);

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      translateX.value = event.translationX;
    })
    .onEnd(event => {
      if (Math.abs(event.velocityX) > 500 || Math.abs(translateX.value) > screenWidth * 0.4) {
        const direction = Math.sign(event.velocityX || translateX.value);
        translateX.value = withSpring(screenWidth * 1.2 * direction, { damping: 20 }, () => {
          runOnJS(onSwipe)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-screenWidth / 2, 0, screenWidth / 2],
          [-10, 0, 10]
        )}deg`,
      },
    ],
  }));

  const handleOpenMenu = (targetPost: PostOut) => {
    Alert.alert('気づきメニュー', '', [
      { text: 'ユーザーブロック（未実装）', onPress: () => {} },
      {
        text: 'ポスト報告',
        onPress: () => {
          setReportTargetPost(targetPost);
          setShowReportModal(true);
        },
      },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleDelete = (postId: number) => {
    Alert.alert('気づきを削除', '本当にこの気づきを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: onSwipe },
    ]);
  };

  const isTextOnly = !post.media || post.media.length === 0;

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, animatedStyle]}>
          {isTextOnly ? (
            <LinearGradient
              colors={['#2c3e50', '#34495e', '#2c3e50']}
              style={styles.textOnlyBackground}
            >
              <Text style={[styles.postContent, styles.textOnlyContent]}>{post.content}</Text>
            </LinearGradient>
          ) : (
            <>
              <View style={styles.mediaContainer}>
                {post.media.map((media, index) =>
                  media.media_type === 'image' ? (
                    <Image
                      key={index}
                      source={{ uri: media.file }}
                      style={styles.media}
                      contentFit="cover"
                    />
                  ) : (
                    <VideoItem
                      key={index}
                      uri={media.file}
                      style={styles.media}
                      isActive={isActive}
                    />
                  )
                )}
              </View>
              <View style={styles.contentOverlay}>
                <Text style={styles.postContent}>{post.content}</Text>
              </View>
            </>
          )}

          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => onAuthorPress(post.author.id)}
            >
              <Image source={{ uri: post.author.avatar }} style={styles.authorAvatar} />
              <Text style={styles.authorName}>{post.author.username}</Text>
            </TouchableOpacity>

            <View>
              {selfUserId === post.author?.id ? (
                <Pressable style={styles.menuButton} onPress={() => handleDelete(post.id)}>
                  <Text style={styles.menuButtonText}>削除</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.menuButton} onPress={() => handleOpenMenu(post)}>
                  <Text style={styles.menuButtonText}>⋮</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={async (reason: string) => {
          console.log(`Reporting post ${reportTargetPost?.id} for: ${reason}`);
          setShowReportModal(false);
        }}
      />
    </>
  );
};

export default function ListPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const fetchedPosts = await getPosts(
          params.topicId as string,
          undefined,
          1,
        );
        setPosts(fetchedPosts);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('気づきの読み込みに失敗しました。');
        }
      } finally {
        setLoading(false);
      }
    };
    if (params.topicId) {
      loadPosts();
    }
  }, [params.topicId]);

  const handleSwipe = () => {
    setPosts(prevPosts => prevPosts.slice(1));
  };

  const handleAuthorPress = (userId: number) => {
    // Alert.alert('ユーザー情報', `ユーザーID: ${userId} のプロフィールを開きます`);
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#fff" />;
    }
    if (error) {
      return <Text style={styles.infoText}>{error}</Text>;
    }

    return (
      <View style={styles.deckContainer}>
        {posts
          .map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              onSwipe={handleSwipe}
              isActive={index === 0}
              selfUserId={user?.id}
              onAuthorPress={handleAuthorPress}
            />
          ))
          .reverse()}
      </View>
    );
  };

  return (
    <BlurView intensity={95} tint="dark" style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>気づき</Text>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Fontisto name="close-a" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.contentContainer}>{renderContent()}</View>
      </SafeAreaView>
    </BlurView>
  );
}

const remToPx = (rem: string) => parseFloat(rem) * 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Klee One',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deckContainer: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: '100%',
    borderRadius: remToPx(theme.borderRadius.xl),
    backgroundColor: theme.colors.background.secondary,
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: remToPx(theme.spacing[6]),
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  postContent: {
    color: 'white',
    fontSize: remToPx(theme.typography.fontSize.lg),
    fontFamily: 'Klee One',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  infoText: {
    color: 'white',
    fontSize: remToPx(theme.typography.fontSize.lg),
    fontFamily: 'Klee One',
    textAlign: 'center',
  },
  menuButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  menuButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  textOnlyBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: remToPx(theme.spacing[8]),
  },
  textOnlyContent: {
    fontSize: remToPx(theme.typography.fontSize.xl),
    textAlign: 'center',
  },
  cardHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: remToPx(theme.spacing[4]),
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  authorName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});
