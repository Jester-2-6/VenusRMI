import { ConnectionConfig, MonitoringData } from '../types/monitoring';

const API_BASE_URL = 'http://localhost:3001/api';
const STORAGE_KEY = 'venus_rmi_connection';

interface StoredConnection {
  connectionId: string;
  config: ConnectionConfig;
}

export class APIService {
  private connectionId: string | null = null;
  private isConnected: boolean = false;
  private connectionConfig: ConnectionConfig | null = null;
  private restorationPromise: Promise<void> | null = null;

  constructor() {
    // Don't automatically restore in constructor
    this.isConnected = false;
  }

  private async restoreConnection(): Promise<void> {
    if (this.restorationPromise) {
      return this.restorationPromise;
    }

    this.restorationPromise = (async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const { config } = JSON.parse(stored) as StoredConnection;
          await this.connect(config, true);
        } catch (error) {
          console.error('Failed to restore connection:', error);
          this.clearStoredConnection();
        }
      }
    })();

    try {
      await this.restorationPromise;
    } finally {
      this.restorationPromise = null;
    }
  }

  private storeConnection() {
    if (this.connectionId && this.connectionConfig) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        connectionId: this.connectionId,
        config: this.connectionConfig
      }));
    }
  }

  private clearStoredConnection() {
    localStorage.removeItem(STORAGE_KEY);
    this.connectionId = null;
    this.isConnected = false;
    this.connectionConfig = null;
  }

  async connect(config: ConnectionConfig, isRestore: boolean = false): Promise<void> {
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

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Connection failed' }));
        throw new Error(data.error || 'Connection failed');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Connection failed');
      }

      this.connectionId = data.connectionId;
      this.isConnected = true;
      this.connectionConfig = config;

      // Only store connection if it's not a restoration attempt
      if (!isRestore) {
        this.storeConnection();
      }

      // Verify connection by getting initial monitoring data
      await this.getMonitoringData();
    } catch (error) {
      console.error('API connection failed:', error);
      this.clearStoredConnection();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connectionId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/disconnect/${this.connectionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Disconnect failed');
      }
    } catch (error) {
      console.error('API disconnect failed:', error);
      throw error;
    } finally {
      this.clearStoredConnection();
    }
  }

  async getMonitoringData(): Promise<MonitoringData> {
    // If we're not connected, try to restore the connection first
    if (!this.connectionId) {
      await this.restoreConnection();
      // If still not connected after restoration attempt, throw error
      if (!this.connectionId) {
        throw new Error('Not connected to any system');
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/monitoring-data/${this.connectionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          this.clearStoredConnection();
          throw new Error('Connection lost. Please reconnect.');
        }
        throw new Error('Failed to get monitoring data');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get monitoring data');
      }

      // Connection is confirmed working
      this.isConnected = true;
      return data.data;
    } catch (error) {
      console.error('API get monitoring data failed:', error);
      if (error instanceof Error && 
          (error.message.includes('Connection lost') || 
           error.message.includes('Failed to fetch'))) {
        this.clearStoredConnection();
      }
      throw error;
    }
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.restoreConnection();
    }
  }

  isCurrentlyConnected(): boolean {
    return this.isConnected && this.connectionId !== null;
  }

  getCurrentConfig(): ConnectionConfig | null {
    return this.connectionConfig;
  }
}

export const apiService = new APIService(); 