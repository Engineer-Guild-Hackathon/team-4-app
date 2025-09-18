import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Switch, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import CreatePostForm from './CreatePostForm';
import { useTimer } from '../contexts/TimerContext';
import { MixedFontText } from '@/components/Shared/MixedFontText';
import { buttonHaptic, importantActionHaptic, successHaptic } from '@/utils/haptics';
import { Button } from './Shared/Button';
import { theme } from '@/styles/theme';

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
      <Pressable
        onPress={() => {
          buttonHaptic();
          onUpdate(Math.max(1, durationMinutes - 1));
        }}
        style={styles.setterButton}
        textStyle={styles.setterButtonText}
      >
        <MixedFontText style={styles.setterButtonText}>-</MixedFontText>
      </Pressable>
      <MixedFontText style={styles.setterValue}>{durationMinutes} 分</MixedFontText>
      <Pressable 
        onPress={() => {
          buttonHaptic();
          onUpdate(durationMinutes + 1);
        }} 
        style={styles.setterButton}
      >
        <MixedFontText style={styles.setterButtonText}>+</MixedFontText>
      </Pressable>
    </View>
  </View>
);

export default function PomodoroTimer() {
  const {
    phase, secondsLeft, activeTopicId,
    studyDuration, setStudyDuration,
    outputDuration, setOutputDuration,
    breakDuration, setBreakDuration,
    isSoundEnabled, setIsSoundEnabled,
    startStudy, closeTimer, endOutputAndBreak 
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
              <MixedFontText style={styles.configTitle}>集中時間の設定</MixedFontText>
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
              <View style={styles.setterContainer}>
                <MixedFontText style={styles.setterLabel}>通知音</MixedFontText>
                <Switch
                  trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[300] }}
                  thumbColor={theme.colors.neutral[50]}
                  ios_backgroundColor={theme.colors.neutral[300]}
                  value={isSoundEnabled}
                  onValueChange={setIsSoundEnabled}
                />
              </View>
            </View>
            <Pressable 
              style={styles.button} 
              onPress={() => {
                importantActionHaptic();
                startStudy();
              }}
            >
              <MixedFontText style={styles.buttonText}>開始</MixedFontText>
            </Pressable>
            <Pressable 
              style={styles.closeButton} 
              onPress={() => {
                buttonHaptic();
                closeTimer();
              }}
            >
              <MixedFontText style={styles.closeText}>×</MixedFontText>
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
                >{formatTime(secondsLeft)}</MixedFontText>
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
              <MixedFontText style={styles.closeText}>×</MixedFontText>
            </Pressable>
          </>
        )}

        {phase === 'output' && (
          <View style={styles.outputContainer}>
            <View style={styles.outputHeader}>
              <MixedFontText style={styles.outputPhaseText}>アウトプット</MixedFontText>
              <MixedFontText style={styles.outputTimerText}>{formatTime(secondsLeft)}</MixedFontText>
            </View>
            {activeTopicId ? (
              <CreatePostForm topicId={activeTopicId} />
            ) : (
              <MixedFontText style={styles.errorText}>投稿先のトピックが選択されていません。</MixedFontText>
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
    flexDirection: 'row',
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
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 0,
  },
  setterButtonText: {
    fontSize: parseFloat(theme.typography.fontSize.xl) * 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
  },
  setterValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginHorizontal: 15,
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
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    backgroundColor: theme.colors.neutral[200],
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
});
