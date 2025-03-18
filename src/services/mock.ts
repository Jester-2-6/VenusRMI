import { ConnectionConfig, MonitoringData, SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo } from '../types/monitoring';

export class MockService {
  private config: ConnectionConfig | null = null;
  private interval: NodeJS.Timeout | null = null;

  async connect(config: ConnectionConfig): Promise<void> {
    this.config = config;
  }

  async disconnect(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.config = null;
  }

  async getMonitoringData(): Promise<MonitoringData> {
    if (!this.config) {
      throw new Error('Not connected to any system');
    }

    // Generate random data
    const now = new Date();
    const uptime = Math.floor((now.getTime() - new Date(now.getTime() - 24 * 60 * 60 * 1000).getTime()) / 1000);

    const systemInfo: SystemInfo = {
      hostname: 'mock-system',
      os: this.config.os,
      uptime,
    };

    const cpuInfo: CPUInfo = {
      usage: Math.random() * 100,
      cores: 8,
      temperature: 45 + Math.random() * 20,
      historicalUsage: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: Math.random() * 100
      })),
      historicalTemperature: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: 45 + Math.random() * 20
      }))
    };

    const memoryInfo: MemoryInfo = {
      total: 16 * 1024 * 1024 * 1024, // 16GB
      used: Math.random() * 8 * 1024 * 1024 * 1024, // Random usage up to 8GB
      free: 8 * 1024 * 1024 * 1024, // 8GB free
      swapTotal: 4 * 1024 * 1024 * 1024, // 4GB swap
      swapUsed: Math.random() * 2 * 1024 * 1024 * 1024, // Random swap usage up to 2GB
      historicalUsage: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: Math.random() * 100
      })),
      historicalSwapUsage: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: Math.random() * 100
      }))
    };

    const storageInfo: StorageInfo[] = [
      {
        total: 512 * 1024 * 1024 * 1024, // 512GB
        used: Math.random() * 256 * 1024 * 1024 * 1024, // Random usage up to 256GB
        free: 256 * 1024 * 1024 * 1024, // 256GB free
        mountPoint: '/',
        historicalUsage: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: 30 + Math.random() * 40 // Random usage between 30% and 70%
        })),
        historicalReadSpeed: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: Math.random() * 100 * 1024 * 1024 // Random read speed up to 100MB/s
        })),
        historicalWriteSpeed: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: Math.random() * 50 * 1024 * 1024 // Random write speed up to 50MB/s
        }))
      },
      {
        total: 1 * 1024 * 1024 * 1024 * 1024, // 1TB
        used: Math.random() * 512 * 1024 * 1024 * 1024, // Random usage up to 512GB
        free: 512 * 1024 * 1024 * 1024, // 512GB free
        mountPoint: '/data',
        historicalUsage: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: 20 + Math.random() * 30 // Random usage between 20% and 50%
        })),
        historicalReadSpeed: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: Math.random() * 80 * 1024 * 1024 // Random read speed up to 80MB/s
        })),
        historicalWriteSpeed: Array.from({ length: 60 }, (_, i) => ({
          timestamp: now.getTime() - (60 - i) * 1000,
          value: Math.random() * 40 * 1024 * 1024 // Random write speed up to 40MB/s
        }))
      }
    ];

    const gpuInfo: GPUInfo = {
      name: 'NVIDIA GeForce RTX 3080',
      usage: Math.random() * 100,
      memory: {
        total: 10 * 1024 * 1024 * 1024, // 10GB
        used: Math.random() * 5 * 1024 * 1024 * 1024, // Random usage up to 5GB
        free: 5 * 1024 * 1024 * 1024, // 5GB free
      },
      temperature: 65 + Math.random() * 15,
      historicalUsage: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: Math.random() * 100
      })),
      historicalMemoryUsage: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: Math.random() * 100
      })),
      historicalTemperature: Array.from({ length: 60 }, (_, i) => ({
        timestamp: now.getTime() - (60 - i) * 1000,
        value: 65 + Math.random() * 15
      }))
    };

    return {
      system: systemInfo,
      cpu: cpuInfo,
      memory: memoryInfo,
      storage: storageInfo,
      gpu: gpuInfo,
    };
  }
}

export const mockService = new MockService(); 