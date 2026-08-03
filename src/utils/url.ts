/**
 * 入力・保存された origin 文字列を URL#origin 相当へ正規化する。
 * スキームが省略された場合は https:// を補って解釈する。
 * 未入力、または URL として解釈できない値は null（重複判定に使えない）を返す。
 */
export const normalizeOrigin = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);

  try {
    return new URL(hasScheme ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
};
