import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';

// --- デフォルトの時間設定（分単位） ---
const DEFAULT_STUDY_MINUTES = 22;
const DEFAULT_OUTPUT_MINUTES = 3;
const DEFAULT_BREAK_MINUTES = 5;

type TimerPhase = 'off' | 'idle' | 'studying' | 'output' | 'break';

// --- コンテキストが提供するデータの「形」を定義 ---
interface TimerContextType {
  phase: TimerPhase;
  secondsLeft: number;
  activeTopicId: string | null; // セッション中のトピックIDを記憶
  studyDuration: number;
  setStudyDuration: React.Dispatch<React.SetStateAction<number>>;
  outputDuration: number;
  setOutputDuration: React.Dispatch<React.SetStateAction<number>>;
  breakDuration: number;
  setBreakDuration: React.Dispatch<React.SetStateAction<number>>;
  isSoundEnabled: boolean; // ★ 通知音設定
  setIsSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>; // ★
  startTimerSession: (topicId?: string) => void; // タイマーセッションを開始する新しい関数
  startStudy: () => void;     // 学習を開始
  closeTimer: () => void;    // タイマーを閉じる
  endOutputAndBreak: () => void; // アウトプットを終了して休憩へ
}

// --- コンテキストの作成 ---
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// --- プロバイダーコンポーネントの作成 ---
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [phase, setPhase] = useState<TimerPhase>('off');
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  // ユーザーが設定可能な時間をstateで管理
  const [studyDuration, setStudyDuration] = useState(DEFAULT_STUDY_MINUTES * 60);
  const [outputDuration, setOutputDuration] = useState(DEFAULT_OUTPUT_MINUTES * 60);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_MINUTES * 60);

  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestNotificationPermission();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // 通知をアラートとして表示
        shouldPlaySound: true, // 通知音の再生
        shouldSetBadge: false, // アプリアイコンのバッジの設定
        shouldShowBanner: true, // バナーの表示
        shouldShowList: true, // 通知リストへの表示
      }),
    });
  }, []);

  // タイマーの心臓部となるロジック
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(s => s - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {

      const notificationContent = (title: string, body: string) => ({
        title,
        body,
        sound: isSoundEnabled ? 'default' : null,
      });
      // フェーズの切り替え
      if (phase === 'studying') {
        Notifications.scheduleNotificationAsync({ content: notificationContent("集中お疲れ様でした！", 'アウトプットを始めましょう。'), trigger: null });
        setPhase('output');
        setSecondsLeft(outputDuration);
      } else if (phase === 'output') {
        endOutputAndBreak();
      } else if (phase === 'break') {
        Notifications.scheduleNotificationAsync({ content: notificationContent("休憩終了", 'よく頑張りました！'), trigger: null });
        setPhase('studying');
        setSecondsLeft(studyDuration);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, phase, isSoundEnabled]);
  
  // --- 他のコンポーネントから呼び出すための関数 ---
  const startTimerSession = (topicId?: string) => {
    setActiveTopicId(topicId ?? null);
    setPhase('idle');
  };
  
  const startStudy = () => {
    setIsActive(true);
    setPhase('studying');
    setSecondsLeft(studyDuration);
  };
  
  const closeTimer = () => {
    setIsActive(false);
    setPhase('off'); // タイマーを非表示にする
    setActiveTopicId(null); // 記憶したトピックIDをリセット
    setStudyDuration(DEFAULT_STUDY_MINUTES * 60);
    setOutputDuration(DEFAULT_OUTPUT_MINUTES * 60);
    setBreakDuration(DEFAULT_BREAK_MINUTES * 60);
  };

  const endOutputAndBreak = () => {
    Notifications.scheduleNotificationAsync({
      content: { 
        title: 'アウトプット終了！', 
        body: '5分間の休憩です。',
        sound: isSoundEnabled ? 'default' : null,
      },
      trigger: null,
    });
    setPhase('break');
    setSecondsLeft(breakDuration);
  };

  const value = { 
    phase, secondsLeft, activeTopicId,
    studyDuration, setStudyDuration,
    outputDuration, setOutputDuration,
    breakDuration, setBreakDuration,
    isSoundEnabled, setIsSoundEnabled,
    startTimerSession, startStudy, closeTimer, endOutputAndBreak 
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

// --- 他のコンポーネントから簡単に使えるようにするためのカスタムフック ---
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

