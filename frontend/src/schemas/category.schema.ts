import { z } from 'zod';

/**
 * カテゴリ作成用のZodバリデーションスキーマ
 * 
 * バリデーションルール:
 * - code: 1-3文字、英数字のみ、必須
 * - name: 1-50文字、必須
 * - description: 最大200文字、任意
 * - display_order: 1以上の整数、必須
 * - is_active: 真偽値、デフォルトtrue
 */
export const createCategorySchema = z.object({
  code: z
    .string()
    .min(1, 'カテゴリコードは必須です')
    .max(3, 'カテゴリコードは3文字以内で入力してください')
    .regex(/^[A-Za-z0-9]+$/, '英数字のみ使用可能です'),
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(50, '50文字以内で入力してください'),
  description: z
    .string()
    .max(200, '200文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  display_order: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int('整数を入力してください')
    .min(1, '1以上の数値を入力してください'),
  is_active: z.boolean().default(true),
});

/**
 * カテゴリ更新用のZodバリデーションスキーマ
 * 
 * バリデーションルール:
 * - code: 変更不可（スキーマに含めない）
 * - name: 1-50文字、任意（部分更新対応）
 * - description: 最大200文字、任意
 * - display_order: 1以上の整数、任意
 * - is_active: 真偽値、任意
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'カテゴリ名は必須です')
    .max(50, '50文字以内で入力してください')
    .optional(),
  description: z
    .string()
    .max(200, '200文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  display_order: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int('整数を入力してください')
    .min(1, '1以上の数値を入力してください')
    .optional(),
  is_active: z.boolean().optional(),
});

/**
 * 並び替え用のZodバリデーションスキーマ
 */
export const reorderCategorySchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1, '並び替え対象が指定されていません'),
});

// 型推論
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoryInput = z.infer<typeof reorderCategorySchema>;
