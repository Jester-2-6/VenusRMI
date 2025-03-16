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
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  swapTotal: number;
  swapUsed: number;
}

export interface StorageInfo {
  total: number;
  used: number;
  free: number;
  mountPoint: string;
}

export interface GPUInfo {
  name: string;
  usage: number;
  memory: {
    total: number;
    used: number;
    free: number;
  };
  temperature?: number;
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