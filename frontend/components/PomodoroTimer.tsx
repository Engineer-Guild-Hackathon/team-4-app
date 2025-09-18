import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Circle } from 'react-native-svg';
import CreatePostForm from './CreatePostForm';
import { useTimer } from '../contexts/TimerContext';
import * as Haptics from 'expo-haptics';
import { MixedFontText } from '@/components/Shared/MixedFontText';
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
      <Button
        variant="secondary"
        onPress={() => onUpdate(Math.max(1, durationMinutes - 1))}
        style={styles.setterButton}
        textStyle={styles.setterButtonText}
      >
        -
      </Button>
      <View style={styles.setterValueContainer}>
        <MixedFontText style={styles.setterValue}>{durationMinutes}</MixedFontText>
        <MixedFontText style={styles.setterUnit}>分</MixedFontText>
      </View>
      <Button variant="secondary" onPress={() => onUpdate(durationMinutes + 1)} style={styles.setterButton} textStyle={styles.setterButtonText}>
        +
      </Button>
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
                onUpdate={mins => setStudyDuration(mins * 10)}
              />
              <DurationSetter
                label="アウトプット"
                durationMinutes={outputDuration / 60}
                onUpdate={mins => setOutputDuration(mins * 10)}
              />
              <DurationSetter
                label="休憩"
                durationMinutes={breakDuration / 60}
                onUpdate={mins => setBreakDuration(mins * 10)}
              />
              <View style={styles.setterContainer}>
                <Text style={styles.setterLabel}>通知音</Text>
                <Switch value={isSoundEnabled} onValueChange={setIsSoundEnabled} />
              </View>
            </View>
            <Button variant="primary" size="lg" style={styles.button} onPress={startStudy}>
              開始
            </Button>
            <Button variant="icon" size="icon" style={styles.closeButton} onPress={closeTimer}>
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
                  stroke="rgba(0,0,0,0.1)"
                  strokeWidth={CIRCLE_STROKE_WIDTH}
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
                />
              </Svg>
              <View style={styles.timerTextContainer}>
                <MixedFontText style={styles.phaseText}>{getPhaseText()}</MixedFontText>
                <MixedFontText style={styles.timerText}>{formatTime(secondsLeft)}</MixedFontText>
              </View>
            </View>
            <Button variant="primary" size="lg" style={styles.button} disabled>
              集中
            </Button>
            <Button variant="icon" size="icon" style={styles.closeButton} onPress={closeTimer}><MixedFontText style={styles.closeText}>×</MixedFontText></Button>
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
            <Button
              variant="secondary"
              style={styles.postFinishButton}
              textStyle={styles.postFinishText}
              onPress={endOutputAndBreak}
            >
              投稿を終了して休憩する
            </Button>
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
  },
  configContainer: {
    width: '80%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    alignItems: 'center',
  },
  configTitle: {
    fontSize: theme.remToPx(theme.typography.fontSize['2xl']),
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
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  setterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 0,
  },
  setterButtonText: {
    fontSize: theme.remToPx(theme.typography.fontSize['3xl']),
    fontWeight: theme.typography.fontWeight.bold,
  },
  setterValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginHorizontal: 15,
    width: 60,
  },
  setterValue: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.latinMedium, 
    color: theme.colors.text.primary,
  },
  setterUnit: {
    fontSize: theme.remToPx(theme.typography.fontSize.lg),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.primary, 
    marginLeft: 4,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 10,
  },
  timerText: {
    fontSize: theme.remToPx(theme.typography.fontSize['6xl']),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
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
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  closeText: {
    fontSize: theme.remToPx(theme.typography.fontSize['3xl']),
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.regular,
  },
  outputContainer: {
    width: '90%',
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    fontSize: theme.remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  outputTimerText: {
    fontSize: theme.remToPx(theme.typography.fontSize.xl),
    fontWeight: theme.typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
    color: theme.colors.text.primary,
  },
  postFinishButton: {
    marginTop: 10,
    backgroundColor: theme.colors.primary[600],
  },
  postFinishText: {
    color: theme.colors.text.inverse,
    fontSize: theme.remToPx(theme.typography.fontSize.base),
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: theme.colors.danger,
  },
});
