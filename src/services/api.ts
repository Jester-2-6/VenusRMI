import { ConnectionConfig, MonitoringData } from '../types/monitoring';

const API_BASE_URL = 'http://localhost:3001/api';

export class APIService {
  private connectionId: string | null = null;

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      // Disconnect first if we're already connected
      if (this.connectionId) {
        await this.disconnect();
      }

      const response = await fetch(`${API_BASE_URL}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Connection failed');
      }

      this.connectionId = data.connectionId;
    } catch (error) {
      console.error('API connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connectionId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId: this.connectionId }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Disconnect failed');
      }

      this.connectionId = null;
    } catch (error) {
      console.error('API disconnect failed:', error);
      throw error;
    }
  }

  async getMonitoringData(): Promise<MonitoringData> {
    if (!this.connectionId) {
      throw new Error('Not connected to any system');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/monitoring-data/${this.connectionId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get monitoring data');
      }

      return data.data;
    } catch (error) {
      console.error('API get monitoring data failed:', error);
      throw error;
    }
  }
}

export const apiService = new APIService(); 