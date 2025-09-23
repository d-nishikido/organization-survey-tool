import { SurveyService } from '../services/survey.service';
import { db } from '../config/database';
import { CreateSurveyDto, UpdateSurveyDto } from '../types/survey.types';

// Type the mocked db
const mockDb = db as jest.Mocked<typeof db>;

describe('SurveyService', () => {
  let surveyService: SurveyService;

  beforeEach(() => {
    surveyService = new SurveyService();
    jest.clearAllMocks();
  });

  describe('getAllSurveys', () => {
    it('should return paginated surveys', async () => {
      const mockSurveys = [
        {
          id: 1,
          title: 'Test Survey',
          description: 'Test Description',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          is_anonymous: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          response_count: 5,
        },
      ];

      mockDb.queryOne.mockResolvedValueOnce({ total: '1' });
      mockDb.query.mockResolvedValueOnce(mockSurveys);

      const result = await surveyService.getAllSurveys({
        page: 1,
        pageSize: 10,
      });

      expect(result).toEqual({
        data: mockSurveys,
        total: 1,
        page: 1,
        pageSize: 10,
      });
      expect(mockDb.queryOne).toHaveBeenCalledTimes(1);
      expect(mockDb.query).toHaveBeenCalledTimes(1);
    });

    it('should apply status filter', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ total: '0' });
      mockDb.query.mockResolvedValueOnce([]);

      await surveyService.getAllSurveys({
        page: 1,
        pageSize: 10,
        status: 'active',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('AND status = $1'),
        ['active']
      );
    });

    it('should apply search filter', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ total: '0' });
      mockDb.query.mockResolvedValueOnce([]);

      await surveyService.getAllSurveys({
        page: 1,
        pageSize: 10,
        search: 'test',
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        ['%test%']
      );
    });
  });

  describe('getSurveyById', () => {
    it('should return survey by id', async () => {
      const mockSurvey = {
        id: 1,
        title: 'Test Survey',
        description: 'Test Description',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_anonymous: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        response_count: 5,
      };

      mockDb.queryOne.mockResolvedValueOnce(mockSurvey);

      const result = await surveyService.getSurveyById(1);

      expect(result).toEqual(mockSurvey);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
    });

    it('should return null for non-existent survey', async () => {
      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await surveyService.getSurveyById(999);

      expect(result).toBeNull();
    });
  });

  describe('createSurvey', () => {
    it('should create a new survey', async () => {
      const createData: CreateSurveyDto = {
        title: 'New Survey',
        description: 'New Description',
        status: 'draft',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        is_anonymous: true,
      };

      const mockCreatedSurvey = {
        id: 1,
        ...createData,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockDb.queryOne.mockResolvedValueOnce(mockCreatedSurvey);

      const result = await surveyService.createSurvey(createData);

      expect(result).toEqual({
        ...mockCreatedSurvey,
        response_count: 0,
      });
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO surveys'),
        [
          createData.title,
          createData.description,
          createData.status,
          createData.start_date,
          createData.end_date,
          createData.is_anonymous,
        ]
      );
    });

    it('should throw error if creation fails', async () => {
      const createData: CreateSurveyDto = {
        title: 'New Survey',
        status: 'draft',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        is_anonymous: true,
      };

      mockDb.queryOne.mockResolvedValueOnce(null);

      await expect(surveyService.createSurvey(createData)).rejects.toThrow(
        'Failed to create survey'
      );
    });
  });

  describe('updateSurvey', () => {
    it('should update survey with provided fields', async () => {
      const updateData: UpdateSurveyDto = {
        title: 'Updated Title',
        status: 'active',
      };

      const mockUpdatedSurvey = {
        id: 1,
        title: 'Updated Title',
        description: 'Original Description',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_anonymous: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        response_count: 5,
      };

      mockDb.queryOne
        .mockResolvedValueOnce({ id: 1 }) // Update result
        .mockResolvedValueOnce(mockUpdatedSurvey); // getSurveyById result

      const result = await surveyService.updateSurvey(1, updateData);

      expect(result).toEqual(mockUpdatedSurvey);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE surveys'),
        expect.arrayContaining(['Updated Title', 'active'])
      );
    });

    it('should return current survey if no fields to update', async () => {
      const mockSurvey = {
        id: 1,
        title: 'Test Survey',
        description: 'Test Description',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_anonymous: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        response_count: 5,
      };

      mockDb.queryOne.mockResolvedValueOnce(mockSurvey);

      const result = await surveyService.updateSurvey(1, {});

      expect(result).toEqual(mockSurvey);
    });

    it('should return null for non-existent survey', async () => {
      const updateData: UpdateSurveyDto = {
        title: 'Updated Title',
      };

      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await surveyService.updateSurvey(999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteSurvey', () => {
    it('should delete survey and return true', async () => {
      mockDb.query.mockResolvedValueOnce([{ id: 1 }]);

      const result = await surveyService.deleteSurvey(1);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM surveys WHERE id = $1',
        [1]
      );
    });

    it('should return false for non-existent survey', async () => {
      mockDb.query.mockResolvedValueOnce([]);

      const result = await surveyService.deleteSurvey(999);

      expect(result).toBe(false);
    });
  });

  describe('surveyExists', () => {
    it('should return true if survey exists', async () => {
      mockDb.queryOne.mockResolvedValueOnce({ id: 1 });

      const result = await surveyService.surveyExists(1);

      expect(result).toBe(true);
    });

    it('should return false if survey does not exist', async () => {
      mockDb.queryOne.mockResolvedValueOnce(null);

      const result = await surveyService.surveyExists(999);

      expect(result).toBe(false);
    });
  });
});