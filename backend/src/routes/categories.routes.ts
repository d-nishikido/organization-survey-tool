import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CategoryService } from '../services/category.service';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { NotFoundError, ConflictError, ValidationError } from '../types/error.types';

// リクエストスキーマ
const CreateCategorySchema = z.object({
  code: z.string().min(1).max(3).regex(/^[A-Za-z0-9]+$/, '英数字のみ使用可能です'),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  display_order: z.number().int().min(1),
  is_active: z.boolean().optional().default(true),
});

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  display_order: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
});

const ReorderSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1),
});

const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

const QuerySchema = z.object({
  active: z.coerce.boolean().optional(),
});

export const categoriesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const categoryService = new CategoryService();

  /**
   * GET /api/categories
   * カテゴリ一覧を取得
   */
  fastify.get(
    '/categories',
    {
      preHandler: [validateQuery(QuerySchema)],
    },
    async (request, reply) => {
      try {
        const { active } = request.query as z.infer<typeof QuerySchema>;
        const categories = await categoryService.getAllCategories(active);
        return reply.code(200).send(categories);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリ一覧の取得に失敗しました',
          },
        });
      }
    }
  );

  /**
   * GET /api/categories/:id
   * カテゴリ詳細を取得
   */
  fastify.get(
    '/categories/:id',
    {
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const category = await categoryService.getCategoryById(id);
        return reply.code(200).send(category);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリの取得に失敗しました',
          },
        });
      }
    }
  );

  /**
   * POST /api/categories
   * カテゴリを作成
   */
  fastify.post(
    '/categories',
    {
      preHandler: [validateBody(CreateCategorySchema)],
    },
    async (request, reply) => {
      try {
        const categoryData = request.body as z.infer<typeof CreateCategorySchema>;
        const category = await categoryService.createCategory(categoryData);
        return reply.code(201).send(category);
      } catch (error) {
        if (error instanceof ConflictError) {
          return reply.code(409).send({
            error: {
              code: 'CONFLICT',
              message: error.message,
              details: error.details,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリの作成に失敗しました',
          },
        });
      }
    }
  );

  /**
   * PUT /api/categories/:id
   * カテゴリを更新
   */
  fastify.put(
    '/categories/:id',
    {
      preHandler: [validateParams(ParamsSchema), validateBody(UpdateCategorySchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const updateData = request.body as z.infer<typeof UpdateCategorySchema>;
        const category = await categoryService.updateCategory(id, updateData);
        return reply.code(200).send(category);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリの更新に失敗しました',
          },
        });
      }
    }
  );

  /**
   * DELETE /api/categories/:id
   * カテゴリを削除
   */
  fastify.delete(
    '/categories/:id',
    {
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        await categoryService.deleteCategory(id);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリの削除に失敗しました',
          },
        });
      }
    }
  );

  /**
   * PATCH /api/categories/:id/status
   * カテゴリの有効/無効を切り替え
   */
  fastify.patch(
    '/categories/:id/status',
    {
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const category = await categoryService.toggleCategoryStatus(id);
        return reply.code(200).send(category);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリステータスの切り替えに失敗しました',
          },
        });
      }
    }
  );

  /**
   * PATCH /api/categories/reorder
   * カテゴリの並び順を変更
   */
  fastify.patch(
    '/categories/reorder',
    {
      preHandler: [validateBody(ReorderSchema)],
    },
    async (request, reply) => {
      try {
        const { orderedIds } = request.body as z.infer<typeof ReorderSchema>;
        await categoryService.reorderCategories(orderedIds);
        return reply.code(200).send({ message: '並び替えが完了しました' });
      } catch (error) {
        if (error instanceof ValidationError) {
          return reply.code(422).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
              details: error.details,
            },
          });
        }
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'カテゴリの並び替えに失敗しました',
          },
        });
      }
    }
  );
};
