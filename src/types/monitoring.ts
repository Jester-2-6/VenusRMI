export type OS = 'linux' | 'windows';

export interface SystemInfo {
  hostname: string;
  os: OS;
  uptime: number;
}

export interface CPUInfo {
  usage: number;
  cores: number;
  temperature?: number;
  historicalUsage: HistoricalDataPoint[];
  historicalTemperature?: HistoricalDataPoint[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  swapTotal: number;
  swapUsed: number;
  historicalUsage: HistoricalDataPoint[];
  historicalSwapUsage: HistoricalDataPoint[];
}

export interface StorageInfo {
  total: number;
  used: number;
  free: number;
  mountPoint: string;
  historicalUsage: HistoricalDataPoint[];
  historicalReadSpeed: HistoricalDataPoint[];
  historicalWriteSpeed: HistoricalDataPoint[];
}

export interface GPUInfo {
  usage: number;
  memoryUsed: number;
  memoryTotal: number;
  temperature?: number;
  historicalUsage: HistoricalDataPoint[];
  historicalMemoryUsage: HistoricalDataPoint[];
  historicalTemperature?: HistoricalDataPoint[];
}

export interface MonitoringData {
  system: SystemInfo;
  cpu: CPUInfo;
  memory: MemoryInfo;
  storage: StorageInfo[];
  gpu?: GPUInfo;
}

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  os: OS;
}

export interface HistoricalDataPoint {
  timestamp: number;
  value: number;
} 