import { SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo, ConnectionConfig } from '../types/monitoring';

declare module '../components/SystemMonitor' {
  interface SystemMonitorProps {
    data?: SystemInfo;
  }
}

declare module '../components/CPUMonitor' {
  interface CPUMonitorProps {
    data?: CPUInfo;
  }
}

declare module '../components/MemoryMonitor' {
  interface MemoryMonitorProps {
    data?: MemoryInfo;
  }
}

declare module '../components/StorageMonitor' {
  interface StorageMonitorProps {
    data?: StorageInfo[];
  }
}

declare module '../components/GPUMonitor' {
  interface GPUMonitorProps {
    data?: GPUInfo;
  }
}

declare module '../components/ConnectionForm' {
  interface ConnectionFormProps {
    onConnect: (config: ConnectionConfig) => void;
    onDisconnect?: () => void;
    isConnected: boolean;
  }
} 