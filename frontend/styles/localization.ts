export const localization = {
  // Japanese language support
  japanese: {
    // Font settings optimized for Japanese text
    fontSettings: {
      
      fontFeatureSettings: '"palt" 1', // Proportional alternate widths
      textRendering: 'optimizeLegibility',
      fontKerning: 'normal',
    },

    // Line height adjustments for Japanese text
    lineHeight: {
      tight: 1.4, // For headlines
      normal: 1.6, // For body text
      relaxed: 1.8, // For long-form content
    },

    // Character spacing for readability
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.02em',
    },

    // Text direction and writing modes
    writingMode: {
      horizontal: 'horizontal-tb',
      vertical: 'vertical-rl', // Traditional Japanese vertical text
      verticalLeft: 'vertical-lr',
    },
  },

  // Common UI text translations
  uiText: {
    en: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      profile: 'Profile',
      settings: 'Settings',
      notifications: 'Notifications',
      messages: 'Messages',
      connect: 'Connect',
      disconnect: 'Disconnect',
    } as { [key: string]: string },
    ja: {
      loading: '読み込み中...',
      error: 'エラー',
      retry: '再試行',
      cancel: 'キャンセル',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      save: '保存',
      edit: '編集',
      delete: '削除',
      search: '検索',
      filter: 'フィルター',
      sort: '並び替え',
      profile: 'プロフィール',
      settings: '設定',
      notifications: '通知',
      messages: 'メッセージ',
      connect: '接続',
      disconnect: '切断',
    } as { [key: string]: string },
  },

  // Educational platform specific terms
  educationalTerms: {
    en: {
      learningPath: 'Learning Path',
      mentor: 'Mentor',
      student: 'Student',
      lesson: 'Lesson',
      progress: 'Progress',
      achievement: 'Achievement',
      discussion: 'Discussion',
      assignment: 'Assignment',
      feedback: 'Feedback',
      knowledge: 'Knowledge',
      skill: 'Skill',
      mastery: 'Mastery',
    } as { [key: string]: string },
    ja: {
      learningPath: '学習パス',
      mentor: 'メンター',
      student: '学習者',
      lesson: 'レッスン',
      progress: '進捗',
      achievement: '達成',
      discussion: 'ディスカッション',
      assignment: '課題',
      feedback: 'フィードバック',
      knowledge: '知識',
      skill: 'スキル',
      mastery: '習得',
    } as { [key: string]: string },
  },
};

// Localization utility functions
export const l10nUtils = {
  // Get text based on current language
  getText: (
    key: string,
    language: 'en' | 'ja' = 'en',
    category: 'uiText' | 'educationalTerms' = 'uiText'
  ) => {
    return localization[category][language][key] || key;
  },

  // Apply Japanese font settings
  applyJapaneseFonts: () => ({
    ...localization.japanese.fontSettings,
    lineHeight: localization.japanese.lineHeight.normal,
    letterSpacing: localization.japanese.letterSpacing.normal,
  }),

  // Format numbers for Japanese locale
  formatNumber: (number: number, locale: 'en' | 'ja' = 'en') => {
    return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US').format(number);
  },

  // Format dates for Japanese locale
  formatDate: (date: Date, locale: 'en' | 'ja' = 'en') => {
    return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },
};
