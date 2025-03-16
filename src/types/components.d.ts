import { SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo, ConnectionConfig } from '../types/monitoring';

declare module '../components/SystemMonitor' {
  interface SystemMonitorProps {
    data?: SystemInfo;
  }
  const SystemMonitor: React.FC<SystemMonitorProps>;
  export default SystemMonitor;
}

declare module '../components/CPUMonitor' {
  interface CPUMonitorProps {
    data?: CPUInfo;
  }
  const CPUMonitor: React.FC<CPUMonitorProps>;
  export default CPUMonitor;
}

declare module '../components/MemoryMonitor' {
  interface MemoryMonitorProps {
    data?: MemoryInfo;
  }
  const MemoryMonitor: React.FC<MemoryMonitorProps>;
  export default MemoryMonitor;
}

declare module '../components/StorageMonitor' {
  interface StorageMonitorProps {
    data?: StorageInfo[];
  }
  const StorageMonitor: React.FC<StorageMonitorProps>;
  export default StorageMonitor;
}

declare module '../components/GPUMonitor' {
  interface GPUMonitorProps {
    data?: GPUInfo;
  }
  const GPUMonitor: React.FC<GPUMonitorProps>;
  export default GPUMonitor;
}

declare module '../components/ConnectionForm' {
  interface ConnectionFormProps {
    onConnect: (config: ConnectionConfig) => void;
    onDisconnect?: () => void;
    isConnected: boolean;
  }
  const ConnectionForm: React.FC<ConnectionFormProps>;
  export default ConnectionForm;
} 