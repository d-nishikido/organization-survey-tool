import { AdminRepository, AdminStatsData, ActivityLogData } from '../repositories/admin.repository';
import { logger } from '../utils/logger';

export interface AdminStats {
  active_surveys: number;
  total_responses: number;
  response_rate: number;
  avg_completion_time: number;
}

export interface RecentActivity {
  id: number;
  type: 'survey_created' | 'responses_received' | 'report_generated';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export class AdminService {
  private adminRepository: AdminRepository;

  constructor() {
    this.adminRepository = new AdminRepository();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStats> {
    try {
      logger.debug('Fetching dashboard statistics');

      const stats = await this.adminRepository.getDashboardStats();

      return {
        active_surveys: stats.active_surveys,
        total_responses: stats.total_responses,
        response_rate: Number(stats.response_rate),
        avg_completion_time: Number(stats.avg_completion_time)
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get recent activity logs
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      logger.debug('Fetching recent activity', { limit });

      const activities = await this.adminRepository.getRecentActivity(limit);

      return activities.map(activity => ({
        id: activity.id,
        type: activity.type as 'survey_created' | 'responses_received' | 'report_generated',
        title: activity.title,
        description: activity.description,
        timestamp: activity.timestamp.toISOString(),
        icon: activity.icon
      }));
    } catch (error) {
      logger.error('Error fetching recent activity:', error);
      throw new Error('Failed to fetch recent activity');
    }
  }
}

export const adminService = new AdminService();
