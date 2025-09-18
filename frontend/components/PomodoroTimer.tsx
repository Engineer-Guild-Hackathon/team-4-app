import { MixedFontText } from '@/components/Shared/MixedFontText';
import { theme } from '@/styles/theme';
import { buttonHaptic, importantActionHaptic, successHaptic } from '@/utils/haptics';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTimer } from '../contexts/TimerContext';
import CreatePostForm from './CreatePostForm';
import { Button } from './Shared/Button';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const CIRCLE_RADIUS = 120;
const CIRCLE_STROKE_WIDTH = 15;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * (CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2);

const DurationSetter = ({
  label,
  durationMinutes,
  onUpdate,
}: {
  label: string;
  durationMinutes: number;
  onUpdate: (newDuration: number) => void;
}) => (
  <View style={styles.setterContainer}>
    <MixedFontText style={styles.setterLabel}>{label}</MixedFontText>
    <View style={styles.setterControls}>
      <Button
        onPress={() => {
          buttonHaptic();
          onUpdate(Math.max(1, durationMinutes - 1));
        }}
        style={styles.setterButton}
      >
        <Feather name="minus" size={16} color={theme.colors.white} />
      </Button>
      <View style={styles.setterValueContainer}>
        <MixedFontText style={styles.setterValue}>{durationMinutes}</MixedFontText>
        <MixedFontText style={styles.setterUnit}>分</MixedFontText>
      </View>
      <Button
        onPress={() => {
          buttonHaptic();
          onUpdate(durationMinutes + 1);
        }}
        style={styles.setterButton}
      >
        <Feather name="plus" size={16} color={theme.colors.white} />
      </Button>
    </View>
  </View>
);

export default function PomodoroTimer() {
  const {
    phase,
    secondsLeft,
    activeTopicId,
    studyDuration,
    setStudyDuration,
    outputDuration,
    setOutputDuration,
    breakDuration,
    setBreakDuration,
    isSoundEnabled,
    setIsSoundEnabled,
    startStudy,
    closeTimer,
    endOutputAndBreak,
  } = useTimer();

  const isVisible = phase === 'idle' || phase === 'studying' || phase === 'output';
  if (!isVisible) {
    return null;
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
    phase === 'studying' ? studyDuration : phase === 'output' ? outputDuration : studyDuration;

  const progress = secondsLeft / totalDuration;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress);

  return (
    <Modal visible={true} transparent animationType="fade">
      <BlurView intensity={90} tint="light" style={styles.contentContainer}>
        {phase === 'idle' && (
          <>
            <View style={styles.configContainer}>
              <MixedFontText style={styles.configTitle}>タイマーの設定</MixedFontText>
              <DurationSetter
                label="学習"
                durationMinutes={studyDuration / 60}
                onUpdate={mins => setStudyDuration(mins * 60)}
              />
              <DurationSetter
                label="アウトプット"
                durationMinutes={outputDuration / 60}
                onUpdate={mins => setOutputDuration(mins * 60)}
              />
              <DurationSetter
                label="休憩"
                durationMinutes={breakDuration / 60}
                onUpdate={mins => setBreakDuration(mins * 60)}
              />
              <View style={styles.notificationSetterContainer}>
                <MixedFontText style={styles.setterLabel}>通知</MixedFontText>
                <Switch
                  trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
                  thumbColor={theme.colors.neutral[50]}
                  ios_backgroundColor={theme.colors.neutral[300]}
                  value={isSoundEnabled}
                  onValueChange={setIsSoundEnabled}
                />
              </View>
            </View>
            <Button
              style={styles.startButton}
              textStyle={styles.startButtonText}
              onPress={() => {
                importantActionHaptic();
                startStudy();
              }}
            >
              開始
            </Button>

            <Button
              variant="icon"
              style={styles.closeButton}
              textStyle={styles.closeButtonText}
              onPress={() => {
                buttonHaptic();
                closeTimer();
              }}
            >
              ×
            </Button>
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
                  stroke={theme.colors.neutral[300]}
                  strokeWidth={CIRCLE_STROKE_WIDTH}
                  fill="none"
                />
                <Circle
                  cx={CIRCLE_RADIUS}
                  cy={CIRCLE_RADIUS}
                  r={CIRCLE_RADIUS - CIRCLE_STROKE_WIDTH / 2}
                  stroke={theme.colors.primary[500]}
                  strokeWidth={CIRCLE_STROKE_WIDTH}
                  strokeDasharray={CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90, ${CIRCLE_RADIUS}, ${CIRCLE_RADIUS})`}
                  fill="none"
                />
              </Svg>
              <View style={styles.timerTextContainer}>
                <MixedFontText style={styles.phaseText}>{getPhaseText()}</MixedFontText>
                <MixedFontText
                  fontSize={theme.remToPx(theme.typography.fontSize['5xl'])}
                  style={styles.timerText}
                >
                  {formatTime(secondsLeft)}
                </MixedFontText>
              </View>
            </View>
            <View style={styles.buttonDisabled}>
              <MixedFontText style={styles.buttonText}>集中</MixedFontText>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                buttonHaptic();
                closeTimer();
              }}
            >
              <MixedFontText style={styles.closeButtonText}>×</MixedFontText>
            </Pressable>
          </>
        )}

        {phase === 'output' && (
          <View style={styles.outputContainer}>
            <View style={styles.outputHeader}>
              <MixedFontText style={styles.outputPhaseText}>アウトプット</MixedFontText>
              <MixedFontText style={styles.outputTimerText}>
                {formatTime(secondsLeft)}
              </MixedFontText>
            </View>
            {activeTopicId ? (
              <CreatePostForm topicId={activeTopicId} />
            ) : (
              <MixedFontText style={styles.errorText}>
                投稿先のトピックが選択されていません。
              </MixedFontText>
            )}
            <Pressable
              style={styles.PostFinishButton}
              onPress={() => {
                successHaptic();
                endOutputAndBreak();
              }}
            >
              <MixedFontText style={styles.PostFinishText}>投稿を終了して休憩する</MixedFontText>
            </Pressable>
          </View>
        )}
      </BlurView>
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
    backgroundColor: theme.colors.neutral[300],
    borderRadius: CIRCLE_RADIUS,
    width: CIRCLE_RADIUS * 2 - CIRCLE_STROKE_WIDTH * 2,
    height: CIRCLE_RADIUS * 2 - CIRCLE_STROKE_WIDTH * 2,
  },
  configContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    alignItems: 'center',
  },
  configTitle: {
    fontSize: parseFloat(theme.typography.fontSize['2xl']) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 20,
  },
  setterContainer: {
    // flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  setterLabel: {
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  setterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setterButton: {
    // width: 40,
    // height: 40,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setterButtonText: {
    // flex: 1,
    // fontSize: 40, 
    // color: theme.colors.text.secondary,
  },
  setterValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginHorizontal: 5,
    width: 60,
  },
  setterValue: {
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.latinMedium,
    color: theme.colors.text.primary,
  },
  setterUnit: {
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.primary,
    marginLeft: 4,
  },
  phaseText: {
    fontSize: parseFloat(theme.typography.fontSize.xl) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  timerText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[400],
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  button: {
    marginTop: 60,
  },
  closeText: {
    fontSize: parseFloat(theme.typography.fontSize['3xl']) * 16,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.regular,
  },
  outputContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'column',
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexShrink: 0,
  },
  outputPhaseText: {
    fontSize: parseFloat(theme.typography.fontSize.xl) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  outputTimerText: {
    fontSize: parseFloat(theme.typography.fontSize.xl) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
    color: theme.colors.text.primary,
  },
  postFinishButton: {
    marginTop: 'auto',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.danger,
  },
  PostFinishButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  PostFinishText: {
    color: '#fff',
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  buttonText: {
    color: '#fff',
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  buttonDisabled: {
    marginTop: 60,
    backgroundColor: theme.colors.neutral[400],
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButton: {
    marginTop: 60,
    backgroundColor: theme.colors.background.primary, 
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  startButtonText: {
    color: theme.colors.text.primary, 
    fontSize: parseFloat(theme.typography.fontSize.lg) * 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  closeButton: {
    position: 'absolute',
    top: 60, 
    right: 40, 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary, 
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeButtonText: {
    fontSize: parseFloat(theme.typography.fontSize['2xl']) * 16,
    color: theme.colors.text.secondary, 
    fontWeight: theme.typography.fontWeight.regular,
    lineHeight: parseFloat(theme.typography.fontSize['2xl']) * 16 * 1.2,
    textAlign: 'center',
  },
    notificationSetterContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // 中央揃えに変更
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 16, // ラベルとスイッチの間のスペース
  },
});
