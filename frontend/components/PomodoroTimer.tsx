import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import CreatePostForm from './CreatePostForm';

// --- 初期設定と定数 ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STUDY_DURATION = 5; // 22分
const OUTPUT_DURATION = 20; // 3分
const BREAK_DURATION = 20; // 5分

const CIRCLE_RADIUS = 120;
const CIRCLE_STROKE_WIDTH = 15;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * (CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2);

// --- 型定義 ---
type TimerPhase = 'idle' | 'studying' | 'output' | 'break';

interface PomodoroTimerProps {
  visible: boolean;
  onClose: () => void;
  topicId?: string;
}

// --- ヘルパー関数とコンポーネント ---
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const BreakTimerOverlay = ({
  secondsLeft,
  onClose,
}: {
  secondsLeft: number;
  onClose: () => void;
}) => (
  <Pressable style={styles.breakOverlay} onPress={onClose}>
    <Text style={styles.breakText}>休憩中: {formatTime(secondsLeft)}</Text>
  </Pressable>
);

// --- メインコンポーネント ---
export default function PomodoroTimer({ visible, onClose, topicId }: PomodoroTimerProps) {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(STUDY_DURATION);
  const router = useRouter();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      if (phase === 'studying') {
        Notifications.scheduleNotificationAsync({
          content: { title: '集中お疲れ様でした！', body: '3分間のアウトプットを始めましょう。' },
          trigger: null,
        });
        setPhase('output');
        setSecondsLeft(OUTPUT_DURATION);
      } else if (phase === 'output') {
        Notifications.scheduleNotificationAsync({
          content: { title: 'アウトプット完了！', body: '5分間の休憩です。' },
          trigger: null,
        });
        setPhase('break');
        setSecondsLeft(BREAK_DURATION);
      } else if (phase === 'break') {
        Notifications.scheduleNotificationAsync({
          content: { title: '休憩終了', body: 'よく頑張りました！' },
          trigger: null,
        });
        setIsActive(false);
        setPhase('idle');
        setSecondsLeft(STUDY_DURATION);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, phase]);

  const handleStart = () => {
    setIsActive(true);
    setPhase('studying');
    setSecondsLeft(STUDY_DURATION);
  };

  const handleClose = () => {
    setIsActive(false);
    setPhase('idle');
    setSecondsLeft(STUDY_DURATION);
    onClose();
  };

  const handlePostSuccess = () => {
    Notifications.scheduleNotificationAsync({
      content: { title: 'アウトプット完了！', body: '5分間の休憩です。' },
      trigger: null,
    });
    setPhase('break');
    setSecondsLeft(BREAK_DURATION);
  };

  if (!visible) return null;

  if (phase === 'break') {
    return <BreakTimerOverlay secondsLeft={secondsLeft} onClose={handleClose} />;
  }

  const getPhaseText = () => {
    switch (phase) {
      case 'studying':
        return '学習時間';
      case 'output':
        return 'アウトプット';
      default:
        return '準備中';
    }
  };

  const totalDuration =
    phase === 'studying' ? STUDY_DURATION : phase === 'output' ? OUTPUT_DURATION : STUDY_DURATION;

  const progress = secondsLeft / totalDuration;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <Modal visible={true} transparent animationType="fade">
      {/* 背景用のすりガラス */}
      <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />

      {/* 操作可能なUIを、すりガラスの上に重ねる */}
      <View style={styles.contentContainer}>
        {/* 開始前と学習中 */}
        {(phase === 'idle' || phase === 'studying') && (
          <>
            <View style={styles.timerUiContainer}>
              <Svg height={CIRCLE_RADIUS * 2} width={CIRCLE_RADIUS * 2}>
                <Circle
                  cx={CIRCLE_RADIUS}
                  cy={CIRCLE_RADIUS}
                  r={CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2}
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={CIRCLE_STROKE_WIDTH}
                />
                <Circle
                  cx={CIRCLE_RADIUS}
                  cy={CIRCLE_RADIUS}
                  r={CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2}
                  stroke="#007AFF"
                  strokeWidth={CIRCLE_STROKE_WIDTH}
                  strokeDasharray={CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90, ${CIRCLE_RADIUS}, ${CIRCLE_RADIUS})`}
                />
              </Svg>
              <View style={styles.timerTextContainer}>
                <Text style={styles.phaseText}>{getPhaseText()}</Text>
                <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
              </View>
            </View>
            {phase === 'idle' ? (
              <Pressable style={styles.button} onPress={handleStart}>
                <Text style={styles.buttonText}>開始</Text>
              </Pressable>
            ) : (
              <View style={styles.buttonDisabled}>
                <Text style={styles.buttonText}>集中</Text>
              </View>
            )}
          </>
        )}

        {/* アウトプット中 */}
        {phase === 'output' && (
          <View style={styles.outputContainer}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputPhaseText}>アウトプット</Text>
              <Text style={styles.outputTimerText}>{formatTime(secondsLeft)}</Text>
            </View>
            {topicId ? (
              <CreatePostForm topicId={topicId} />
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 20 }}>
                投稿先のトピックが選択されていません。
              </Text>
            )}
          </View>
        )}

        {/* 閉じるボタン (学習中は非表示) */}
        {phase === 'idle' && (
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerUiContainer: {
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Hiragino Mincho ProN',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#ffffffff',
    fontFamily: 'Courier New',
    letterSpacing: 2,
  },
  button: {
    marginTop: 60,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  buttonDisabled: {
    marginTop: 60,
    backgroundColor: '#aaa',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
  },
  closeText: {
    fontSize: 30,
    color: '#555',
    fontWeight: '300',
  },
  outputContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 15,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  outputPhaseText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  outputTimerText: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Courier New',
  },
  breakOverlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  breakText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
