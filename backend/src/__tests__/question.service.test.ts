import { QuestionService } from '../services/question.service';
import { db } from '../config/database';
import { CreateQuestionDto, UpdateQuestionDto } from '../types/question.types';

// Type the mocked db
const mockDb = db as jest.Mocked<typeof db>;

describe('QuestionService', () => {
  let questionService: QuestionService;

  beforeEach(() => {
    questionService = new QuestionService();
    jest.clearAllMocks();
  });

  describe('getAllQuestions', () => {
    it('should return paginated questions', async () => {
      const mockQuestions = [
        {
          id: 1,
          question: 'How satisfied are you?',
          type: 'rating',
          category: 'satisfaction',
          is_required: true,
          options: null,
          min_value: null,
          max_value: null,
          min_label: null,
          max_label: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
      mockDb.query.mockResolvedValueOnce(mockQuestions);

      const result = await questionService.getAllQuestions({
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({
        data: mockQuestions,
        total: 1,
        page: 1,
        pageSize: 10,
      });
      expect(mockDb.queryOne).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('should apply category filter', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ total: '0' });
      mockDb.query.mockResolvedValueOnce([]);

      await questionService.getAllQuestions({
        page: 1,
        pageSize: 10,
        category: 'engagement',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('AND sc.code = $1'),
        ['engagement']
      );
    });

    it('should apply type filter', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ total: '0' });
      mockDb.query.mockResolvedValueOnce([]);

      await questionService.getAllQuestions({
        page: 1,
        pageSize: 10,
        type: 'rating',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('AND q.question_type = $1'),
        ['rating']
      );
    });

    it('should apply search filter', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ total: '0' });
      mockDb.query.mockResolvedValueOnce([]);

      await questionService.getAllQuestions({
        page: 1,
        pageSize: 10,
        search: 'satisfaction',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('AND q.question_text ILIKE $1'),
        ['%satisfaction%']
      );
    });
  });

  describe('getQuestionById', () => {
    it('should return question by id', async () => {
      const mockQuestion = {
        id: 1,
        question: 'How satisfied are you?',
        type: 'rating',
        category: 'satisfaction',
        is_required: true,
        options: null,
        min_value: null,
        max_value: null,
        min_label: null,
        max_label: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.queryOne.mockResolvedValueOnce(mockQuestion);

      const result = await questionService.getQuestionById(1);

      expect(result).toEqual(mockQuestion);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE q.id = $1'),
        [1]
      );
    });

    it('should return null for non-existent question', async () => {
      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await questionService.getQuestionById(999);

      expect(result).toBeNull();
    });
  });

  describe('createQuestion', () => {
    it('should create a new question', async () => {
      const createData: CreateQuestionDto = {
        question: 'How satisfied are you with your job?',
        type: 'rating',
        category: 'satisfaction',
        is_required: true,
        min_value: 1,
        max_value: 5,
      };

      const mockCreatedQuestion = {
        id: 1,
        question_text: createData.question,
        question_type: 'rating_5',
        is_required: createData.is_required,
        options: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock category lookup
      mockDb.queryOne
        .mockResolvedValueOnce({ id: 1 }) // Category lookup
        .mockResolvedValueOnce(mockCreatedQuestion); // Insert result

      const result = await questionService.createQuestion(createData);

      expect(result.question).toBe(createData.question);
      expect(result.type).toBe(createData.type);
      expect(result.category).toBe(createData.category);
      expect(result.is_required).toBe(createData.is_required);
      expect(mockDb.queryOne).toHaveBeenCalledTimes(2);
    });

    it('should create question without category', async () => {
      const createData: CreateQuestionDto = {
        question: 'General question',
        type: 'text',
        category: 'other',
        is_required: false,
      };

      const mockCreatedQuestion = {
        id: 1,
        question_text: createData.question,
        question_type: 'text',
        is_required: createData.is_required,
        options: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // Mock category lookup returning null
      mockDb.queryOne
        .mockResolvedValueOnce(null) // Category lookup
        .mockResolvedValueOnce(mockCreatedQuestion); // Insert result

      const result = await questionService.createQuestion(createData);

      expect(result.question).toBe(createData.question);
      expect(result.category).toBe(createData.category);
    });

    it('should throw error if creation fails', async () => {
      const createData: CreateQuestionDto = {
        question: 'Test question',
        type: 'text',
        category: 'other',
        is_required: false,
      };

      mockDb.queryOne
        .mockResolvedValueOnce(null) // Category lookup
        .mockResolvedValueOnce(null); // Insert fails

      await expect(questionService.createQuestion(createData)).rejects.toThrow(
        'Failed to create question'
      );
    });
  });

  describe('updateQuestion', () => {
    it('should update question with provided fields', async () => {
      const updateData: UpdateQuestionDto = {
        question: 'Updated question text',
        is_required: false,
      };

      const mockUpdatedQuestion = {
        id: 1,
        question: 'Updated question text',
        type: 'rating',
        category: 'satisfaction',
        is_required: false,
        options: null,
        min_value: null,
        max_value: null,
        min_label: null,
        max_label: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.queryOne
        .mockResolvedValueOnce({ id: 1 }) // Update result
        .mockResolvedValueOnce(mockUpdatedQuestion); // getQuestionById result

      const result = await questionService.updateQuestion(1, updateData);

      expect(result).toEqual(mockUpdatedQuestion);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE questions'),
        expect.arrayContaining(['Updated question text', false])
      );
    });

    it('should return current question if no fields to update', async () => {
      const mockQuestion = {
        id: 1,
        question: 'Original question',
        type: 'rating',
        category: 'satisfaction',
        is_required: true,
        options: null,
        min_value: null,
        max_value: null,
        min_label: null,
        max_label: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.queryOne.mockResolvedValueOnce(mockQuestion);

      const result = await questionService.updateQuestion(1, {});

      expect(result).toEqual(mockQuestion);
    });

    it('should return null for non-existent question', async () => {
      const updateData: UpdateQuestionDto = {
        question: 'Updated question',
      };

      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await questionService.updateQuestion(999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question and return true', async () => {
      mockDb.query.mockResolvedValueOnce([{ id: 1 }]);

      const result = await questionService.deleteQuestion(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM questions WHERE id = $1',
        [1]
      );
    });

    it('should return false for non-existent question', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await questionService.deleteQuestion(999);

      expect(result).toBe(false);
    });
  });

  describe('questionExists', () => {
    it('should return true if question exists', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ id: 1 });

      const result = await questionService.questionExists(1);

      expect(result).toBe(true);
    });

    it('should return false if question does not exist', async () => {
      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await questionService.questionExists(999);

      expect(result).toBe(false);
    });
  });
});