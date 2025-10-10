import { describe, it, expect } from 'vitest';
import {
  ACTIVE_QUESTION_TYPES,
  LEGACY_QUESTION_TYPES,
  getQuestionTypeLabel
} from '../questionTypes';

describe('questionTypes', () => {
  describe('ACTIVE_QUESTION_TYPES', () => {
    it('不要な質問タイプ（rating、rating_5、rating_10）を含まない', () => {
      const activeTypes = Object.keys(ACTIVE_QUESTION_TYPES);

      expect(activeTypes).not.toContain('rating');
      expect(activeTypes).not.toContain('rating_5');
      expect(activeTypes).not.toContain('rating_10');
    });

    it('yes_noタイプを含まず、booleanのみを含む', () => {
      const activeTypes = Object.keys(ACTIVE_QUESTION_TYPES);

      expect(activeTypes).not.toContain('yes_no');
      expect(activeTypes).toContain('boolean');
    });

    it('必要な質問タイプをすべて含む', () => {
      const activeTypes = Object.keys(ACTIVE_QUESTION_TYPES);

      expect(activeTypes).toContain('text');
      expect(activeTypes).toContain('textarea');
      expect(activeTypes).toContain('radio');
      expect(activeTypes).toContain('checkbox');
      expect(activeTypes).toContain('select');
      expect(activeTypes).toContain('scale');
      expect(activeTypes).toContain('boolean');
    });

    it('正しい日本語ラベルを持つ', () => {
      expect(ACTIVE_QUESTION_TYPES.text).toBe('テキスト(短文)');
      expect(ACTIVE_QUESTION_TYPES.textarea).toBe('テキスト(長文)');
      expect(ACTIVE_QUESTION_TYPES.radio).toBe('単一選択');
      expect(ACTIVE_QUESTION_TYPES.checkbox).toBe('複数選択');
      expect(ACTIVE_QUESTION_TYPES.select).toBe('プルダウン');
      expect(ACTIVE_QUESTION_TYPES.scale).toBe('スケール');
      expect(ACTIVE_QUESTION_TYPES.boolean).toBe('はい/いいえ');
    });
  });

  describe('LEGACY_QUESTION_TYPES', () => {
    it('レガシータイプを含む', () => {
      const legacyTypes = Object.keys(LEGACY_QUESTION_TYPES);

      expect(legacyTypes).toContain('rating');
      expect(legacyTypes).toContain('rating_5');
      expect(legacyTypes).toContain('rating_10');
      expect(legacyTypes).toContain('yes_no');
    });

    it('レガシーとして明示的にラベル付けされている', () => {
      expect(LEGACY_QUESTION_TYPES.rating).toContain('レガシー');
      expect(LEGACY_QUESTION_TYPES.rating_5).toContain('レガシー');
      expect(LEGACY_QUESTION_TYPES.rating_10).toContain('レガシー');
    });
  });

  describe('getQuestionTypeLabel', () => {
    it('アクティブな質問タイプに対して正しいラベルを返す', () => {
      expect(getQuestionTypeLabel('text')).toBe('テキスト(短文)');
      expect(getQuestionTypeLabel('textarea')).toBe('テキスト(長文)');
      expect(getQuestionTypeLabel('radio')).toBe('単一選択');
      expect(getQuestionTypeLabel('checkbox')).toBe('複数選択');
      expect(getQuestionTypeLabel('select')).toBe('プルダウン');
      expect(getQuestionTypeLabel('scale')).toBe('スケール');
      expect(getQuestionTypeLabel('boolean')).toBe('はい/いいえ');
    });

    it('レガシー質問タイプに対して正しいラベルを返す', () => {
      expect(getQuestionTypeLabel('rating')).toBe('評価（レガシー）');
      expect(getQuestionTypeLabel('rating_5')).toBe('評価（5段階・レガシー）');
      expect(getQuestionTypeLabel('rating_10')).toBe('評価（10段階・レガシー）');
      expect(getQuestionTypeLabel('yes_no')).toBe('はい/いいえ');
    });

    it('未知の質問タイプに対してフォールバックラベルを返す', () => {
      expect(getQuestionTypeLabel('unknown_type')).toBe('不明な質問タイプ');
      expect(getQuestionTypeLabel('')).toBe('不明な質問タイプ');
    });
  });
});
