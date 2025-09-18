/**
 * Checks if a string contains Japanese characters.
 */
export const isJapanese = (text: string): boolean =>
  /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/.test(text);

/**
 * Checks if a string contains Latin letters or numbers.
 */
export const isLatinOrNumeric = (text: string): boolean =>
  /[A-Za-z0-9]/.test(text);

/**
 * Segments a string into chunks by script type (Japanese vs. Latin/numeric).
 * Each segment is labeled with whether it should use Japanese font.
 */
export const segmentByScript = (
  text: string
): { segment: string; isJapanese: boolean }[] => {
  const regex =
    /([\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]+|[A-Za-z0-9]+|[^\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFFA-Za-z0-9]+)/g;

  const matches = text.match(regex) || [];

  return matches.map((segment) => ({
    segment,
    isJapanese: isJapanese(segment),
  }));
};
