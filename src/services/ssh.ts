import { ConnectionConfig, MonitoringData, SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo } from '../types/monitoring';
import { NodeSSH } from 'node-ssh';

export class SSHService {
  private ssh: NodeSSH;
  private config: ConnectionConfig | null = null;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect(config: ConnectionConfig): Promise<void> {
    try {
      await this.ssh.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        privateKey: config.privateKey,
      });
      this.config = config;
    } catch (error) {
      console.error('SSH connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.ssh.dispose();
    this.config = null;
  }

  async getMonitoringData(): Promise<MonitoringData> {
    if (!this.config) {
      throw new Error('Not connected to any system');
    }

    const [systemInfo, cpuInfo, memoryInfo, storageInfo, gpuInfo] = await Promise.all([
      this.getSystemInfo(),
      this.getCPUInfo(),
      this.getMemoryInfo(),
      this.getStorageInfo(),
      this.getGPUInfo(),
    ]);

    return {
      system: systemInfo,
      cpu: cpuInfo,
      memory: memoryInfo,
      storage: storageInfo,
      gpu: gpuInfo,
    };
  }

  private async getSystemInfo(): Promise<SystemInfo> {
    const hostname = await this.executeCommand('hostname');
    const uptime = await this.executeCommand('uptime -s');
    
    return {
      hostname: hostname.trim(),
      os: this.config!.os,
      uptime: this.parseUptime(uptime),
    };
  }

  private async getCPUInfo(): Promise<CPUInfo> {
    if (this.config!.os === 'linux') {
      const [usage, cores, temp] = await Promise.all([
        this.executeCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"),
        this.executeCommand("nproc"),
        this.executeCommand("cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | awk '{print $1/1000}'"),
      ]);

      const temperature = temp.trim() ? parseFloat(temp.trim()) : undefined;

      return {
        usage: parseFloat(usage),
        cores: parseInt(cores),
        temperature,
      };
    } else {
      // Windows implementation
      const [usage, cores] = await Promise.all([
        this.executeCommand("wmic cpu get loadpercentage | findstr /v 'LoadPercentage'"),
        this.executeCommand("wmic cpu get NumberOfCores | findstr /v 'NumberOfCores'"),
      ]);

      return {
        usage: parseFloat(usage),
        cores: parseInt(cores),
      };
    }
  }

  private async getMemoryInfo(): Promise<MemoryInfo> {
    if (this.config!.os === 'linux') {
      const output = await this.executeCommand('free -b');
      const lines = output.split('\n');
      const memLine = lines[1].split(/\s+/);
      const swapLine = lines[2].split(/\s+/);

      return {
        total: parseInt(memLine[1]),
        used: parseInt(memLine[2]),
        free: parseInt(memLine[3]),
        swapTotal: parseInt(swapLine[1]),
        swapUsed: parseInt(swapLine[2]),
      };
    } else {
      // Windows implementation
      const output = await this.executeCommand('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
      const lines = output.split('\n');
      const total = parseInt(lines[0].split('=')[1]);
      const free = parseInt(lines[1].split('=')[1]);

      return {
        total: total * 1024, // Convert KB to bytes
        used: (total - free) * 1024,
        free: free * 1024,
        swapTotal: 0, // Windows swap info not easily available via WMI
        swapUsed: 0,
      };
    }
  }

  private async getStorageInfo(): Promise<StorageInfo[]> {
    if (this.config!.os === 'linux') {
      const output = await this.executeCommand('df -B1');
      const lines = output.split('\n').slice(1);
      
      return lines.map(line => {
        const [, total, used, free, mountPoint] = line.split(/\s+/);
        return {
          total: parseInt(total),
          used: parseInt(used),
          free: parseInt(free),
          mountPoint,
        };
      });
    } else {
      // Windows implementation
      const output = await this.executeCommand('wmic logicaldisk get size,freespace,caption /format:value');
      const drives = output.split('\n\n').filter(Boolean);
      
      return drives.map(drive => {
        const lines = drive.split('\n');
        const values: { [key: string]: string } = {};
        
        lines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            values[key.trim()] = value.trim();
          }
        });

        const total = parseInt(values['Size']);
        const free = parseInt(values['FreeSpace']);
        const mountPoint = values['Caption'];

        return {
          total,
          used: total - free,
          free,
          mountPoint,
        };
      });
    }
  }

  private async getGPUInfo(): Promise<GPUInfo | undefined> {
    if (this.config!.os === 'linux') {
      try {
        // Check if nvidia-smi is available
        await this.executeCommand('which nvidia-smi');
        
        const [name, usage, memory, temp] = await Promise.all([
          this.executeCommand("nvidia-smi --query-gpu=gpu_name --format=csv,noheader"),
          this.executeCommand("nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader"),
          this.executeCommand("nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader"),
          this.executeCommand("nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader"),
        ]);

        const [total, used, free] = memory.split(',').map(v => parseInt(v) * 1024 * 1024); // Convert MB to bytes

        return {
          name: name.trim(),
          usage: parseFloat(usage),
          memory: {
            total,
            used,
            free,
          },
          temperature: parseFloat(temp),
        };
      } catch {
        return undefined;
      }
    } else {
      // Windows implementation using WMI
      try {
        const output = await this.executeCommand('wmic path win32_VideoController get name,AdapterRAM,VideoProcessor /format:value');
        const lines = output.split('\n');
        const name = lines[0].split('=')[1];
        const memory = parseInt(lines[1].split('=')[1]);

        return {
          name: name.trim(),
          usage: 0, // Windows doesn't provide GPU usage via WMI
          memory: {
            total: memory,
            used: 0,
            free: memory,
          },
        };
      } catch {
        return undefined;
      }
    }
  }

  private async executeCommand(command: string): Promise<string> {
    const result = await this.ssh.execCommand(command);
    if (result.stderr) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    return result.stdout;
  }

  private parseUptime(uptimeStr: string): number {
    const uptimeDate = new Date(uptimeStr);
    return Math.floor((Date.now() - uptimeDate.getTime()) / 1000);
  }
}

export const sshService = new SSHService(); 