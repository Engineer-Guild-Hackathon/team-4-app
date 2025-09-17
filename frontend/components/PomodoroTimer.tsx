import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import CreatePostForm from './CreatePostForm';
import { useTimer } from '../contexts/TimerContext';

<<<<<<< HEAD
// 時間フォーマット関数
=======
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
>>>>>>> main
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

<<<<<<< HEAD
const CIRCLE_RADIUS = 120;
const CIRCLE_STROKE_WIDTH = 15;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * (CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2);

// interface PomodoroTimerProps {
//   topicId?: string;
// }

// 時間設定用のUIコンポーネント
const DurationSetter = ({ label, durationMinutes, onUpdate }: { label: string, durationMinutes: number, onUpdate: (newDuration: number) => void }) => (
  <View style={styles.setterContainer}>
    <Text style={styles.setterLabel}>{label}</Text>
    <View style={styles.setterControls}>
      <Pressable onPress={() => onUpdate(Math.max(1, durationMinutes - 1))} style={styles.setterButton}>
        <Text style={styles.setterButtonText}>-</Text>
      </Pressable>
      <Text style={styles.setterValue}>{durationMinutes} 分</Text>
      <Pressable onPress={() => onUpdate(durationMinutes + 1)} style={styles.setterButton}>
        <Text style={styles.setterButtonText}>+</Text>
      </Pressable>
    </View>
  </View>
=======
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
>>>>>>> main
);

export default function PomodoroTimer() {
  // グローバルなstateと関数を取得
  const { 
    phase, secondsLeft, activeTopicId,
    studyDuration, setStudyDuration,
    outputDuration, setOutputDuration,
    breakDuration, setBreakDuration,
    startStudy, closeTimer, endOutputAndBreak 
  } = useTimer();

<<<<<<< HEAD
  // モーダルを表示するのは idle, studying, output のいずれかのフェーズ
  const isVisible = phase === 'idle' || phase === 'studying' || phase === 'output';
  if (!isVisible) {
    return null;
=======
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
>>>>>>> main
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
<<<<<<< HEAD
  
  const totalDuration = 
    phase === 'studying' ? studyDuration :
    phase === 'output' ? outputDuration :
    studyDuration;
  
=======

  const totalDuration =
    phase === 'studying' ? STUDY_DURATION : phase === 'output' ? OUTPUT_DURATION : STUDY_DURATION;

>>>>>>> main
  const progress = secondsLeft / totalDuration;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <Modal visible={true} transparent animationType="fade">
      <BlurView intensity={90} tint="light" style={styles.contentContainer}>
        {phase === 'idle' && (
          <>
            <View style={styles.configContainer}>
              <Text style={styles.configTitle}>集中時間の設定</Text>
              <DurationSetter 
                label="学習" 
                durationMinutes={studyDuration / 60} 
                onUpdate={(mins) => setStudyDuration(mins * 60)} 
              />
              <DurationSetter 
                label="アウトプット" 
                durationMinutes={outputDuration / 60} 
                onUpdate={(mins) => setOutputDuration(mins * 60)} 
              />
              <DurationSetter 
                label="休憩" 
                durationMinutes={breakDuration / 60} 
                onUpdate={(mins) => setBreakDuration(mins * 60)} 
              />
            </View>
            <Pressable style={styles.button} onPress={startStudy}>
              <Text style={styles.buttonText}>開始</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={closeTimer}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </>
        )}

        {phase === 'studying' && (
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
            <View style={styles.buttonDisabled}>
              <Text style={styles.buttonText}>集中</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={closeTimer}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </>
        )}
        
        {phase === 'output' && (
          <View style={styles.outputContainer}>
            <View style={styles.outputHeader}>
              <Text style={styles.outputPhaseText}>アウトプット</Text>
              <Text style={styles.outputTimerText}>{formatTime(secondsLeft)}</Text>
            </View>
            { activeTopicId? (
              <CreatePostForm topicId={activeTopicId} />
            ) : (
<<<<<<< HEAD
              <Text style={styles.errorText}>投稿先のトピックが選択されていません。</Text>
=======
              <Text style={{ textAlign: 'center', marginTop: 20 }}>
                投稿先のトピックが選択されていません。
              </Text>
>>>>>>> main
            )}
            <Pressable style={styles.PostFinishButton} onPress={endOutputAndBreak}>
              <Text style={styles.PostFinishText}>投稿を終了して休憩する</Text>
            </Pressable>
          </View>
        )}
<<<<<<< HEAD
      </BlurView>
=======

        {/* 閉じるボタン (学習中は非表示) */}
        {phase === 'idle' && (
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        )}
      </View>
>>>>>>> main
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  configContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    alignItems: 'center',
  },
  configTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  setterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  setterLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  setterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setterButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555',
  },
  setterValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    width: 60,
    textAlign: 'center',
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
    color: '#111',
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
  PostFinishButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  PostFinishText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
  }
});
