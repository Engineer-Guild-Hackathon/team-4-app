import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'error';

/**
 * 触覚フィードバックを提供するユーティリティ関数
 */
export const triggerHaptic = (type: HapticType = 'light'): void => {
  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // 触覚フィードバックが利用できない環境では無視
    console.warn('Haptic feedback not available:', error);
  }
};

/**
 * ボタンタップ時の軽い触覚フィードバック
 */
export const buttonHaptic = (): void => {
  triggerHaptic('light');
};

/**
 * 重要な操作時の触覚フィードバック
 */
export const importantActionHaptic = (): void => {
  triggerHaptic('medium');
};

/**
 * 成功時の触覚フィードバック
 */
export const successHaptic = (): void => {
  triggerHaptic('success');
};

/**
 * エラー時の触覚フィードバック
 */
export const errorHaptic = (): void => {
  triggerHaptic('error');
};

/**
 * 選択時の触覚フィードバック
 */
export const selectionHaptic = (): void => {
  triggerHaptic('selection');
};

/**
 * モーダル開閉時の触覚フィードバック
 */
export const modalHaptic = (): void => {
  triggerHaptic('light');
};

/**
 * フォーム送信時の触覚フィードバック
 */
export const formSubmitHaptic = (): void => {
  triggerHaptic('medium');
};
