/**
 * 質問タイプの定数定義
 *
 * このファイルは質問タイプの表示ラベルマッピングを一元管理します。
 * 全コンポーネントで一貫した表示文字列を提供します。
 */

/**
 * アクティブな質問タイプ（UI表示用）
 *
 * 新規質問作成時にプルダウンで表示される質問タイプ。
 * 不要なタイプ（rating、rating_5、rating_10）は除外されています。
 */
export const ACTIVE_QUESTION_TYPES = {
  text: 'テキスト(短文)',
  textarea: 'テキスト(長文)',
  radio: '単一選択',
  checkbox: '複数選択',
  select: 'プルダウン',
  scale: 'スケール',
  boolean: 'はい/いいえ',
} as const;

/**
 * レガシー質問タイプ（既存データ表示用）
 *
 * 既存の質問データに含まれる可能性がある非推奨の質問タイプ。
 * 新規作成はできないが、既存データの表示・編集は可能。
 */
export const LEGACY_QUESTION_TYPES = {
  rating: '評価（レガシー）',
  rating_5: '評価（5段階・レガシー）',
  rating_10: '評価（10段階・レガシー）',
  yes_no: 'はい/いいえ',
} as const;

/**
 * 全質問タイプの統一ラベル取得関数
 *
 * @param type - 質問タイプ
 * @returns 対応する日本語ラベル。未知のタイプの場合はフォールバック文字列を返す
 */
export function getQuestionTypeLabel(type: string): string {
  // アクティブな質問タイプをチェック
  if (type in ACTIVE_QUESTION_TYPES) {
    return ACTIVE_QUESTION_TYPES[type as keyof typeof ACTIVE_QUESTION_TYPES];
  }

  // レガシー質問タイプをチェック
  if (type in LEGACY_QUESTION_TYPES) {
    return LEGACY_QUESTION_TYPES[type as keyof typeof LEGACY_QUESTION_TYPES];
  }

  // 未知のタイプの場合はフォールバック
  return '不明な質問タイプ';
}
