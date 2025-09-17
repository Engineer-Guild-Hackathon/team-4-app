export const isJapanese = (text: string) => /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(text);

export const segmentByScript = (text: string): { segment: string; isJapanese: boolean }[] => {
  const regex =
    /([\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]+|[0-9]+|[^\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF0-9]+)/g;
  const matches = text.match(regex) || [];

  return matches.map(segment => ({
    segment,
    isJapanese: /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(segment),
  }));
};
