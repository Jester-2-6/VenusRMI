import { SSHService } from '../ssh';
import { ConnectionConfig } from '../../types/monitoring';
import { NodeSSH } from 'node-ssh';
import type { SSHExecCommandResponse } from 'node-ssh';

// Mock the node-ssh module
jest.mock('node-ssh');

describe('SSHService', () => {
  let sshService: SSHService;
  let mockSSH: jest.Mocked<NodeSSH>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of SSHService
    sshService = new SSHService();
    
    // Get the mocked NodeSSH instance
    mockSSH = (sshService as any).ssh;
  });

  describe('connect', () => {
    const mockConfig: ConnectionConfig = {
      host: 'test-host',
      port: 22,
      username: 'test-user',
      password: 'test-password',
      os: 'linux'
    };

    it('should successfully connect to SSH server', async () => {
      // Mock successful connection
      mockSSH.connect.mockResolvedValue({} as NodeSSH);

      await sshService.connect(mockConfig);

      expect(mockSSH.connect).toHaveBeenCalledWith({
        host: mockConfig.host,
        port: mockConfig.port,
        username: mockConfig.username,
        password: mockConfig.password,
        privateKey: mockConfig.privateKey,
      });
    });

    it('should throw error when connection fails', async () => {
      // Mock failed connection
      const error = new Error('Connection failed');
      mockSSH.connect.mockRejectedValue(error);

      await expect(sshService.connect(mockConfig)).rejects.toThrow('Connection failed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from SSH server', async () => {
      await sshService.disconnect();
      expect(mockSSH.dispose).toHaveBeenCalled();
    });
  });

  describe('getMonitoringData', () => {
    const mockConfig: ConnectionConfig = {
      host: 'test-host',
      port: 22,
      username: 'test-user',
      password: 'test-password',
      os: 'linux'
    };

    beforeEach(async () => {
      // Mock successful connection
      mockSSH.connect.mockResolvedValue({} as NodeSSH);
      await sshService.connect(mockConfig);
    });

    it('should throw error when not connected', async () => {
      await sshService.disconnect();
      await expect(sshService.getMonitoringData()).rejects.toThrow('Not connected to any system');
    });

    it('should return monitoring data for Linux system', async () => {
      // Mock command outputs
      mockSSH.execCommand.mockImplementation((command: string) => {
        const outputs: { [key: string]: string } = {
          'hostname': 'test-hostname',
          'uptime -s': '2024-01-01 00:00:00',
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'": '50.0',
          'nproc': '4',
          "cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | awk '{print $1/1000}'": '45.0',
          'free -b': '              total        used        free      shared  buff/cache   available\nMem:   8589934592  4294967296  4294967296         0           0           0\nSwap:  2147483648         0  2147483648',
          'df -B1': 'Filesystem 1K-blocks Used Available Mounted on\n/dev/sda1 1000000000 500000000 500000000 /',
          'which nvidia-smi': '/usr/bin/nvidia-smi',
          "nvidia-smi --query-gpu=gpu_name --format=csv,noheader": 'NVIDIA GeForce RTX 3080',
          "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader": '75.0',
          "nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader": '10240,5120,5120',
          "nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader": '70.0'
        };
        return Promise.resolve({
          stdout: outputs[command] || '',
          stderr: '',
          code: 0,
          signal: null
        } as SSHExecCommandResponse);
      });

      const data = await sshService.getMonitoringData();

      expect(data).toEqual({
        system: {
          hostname: 'test-hostname',
          os: 'linux',
          uptime: expect.any(Number)
        },
        cpu: {
          usage: 50.0,
          cores: 4,
          temperature: 45.0
        },
        memory: {
          total: 8589934592,
          used: 4294967296,
          free: 4294967296,
          swapTotal: 2147483648,
          swapUsed: 0
        },
        storage: [{
          total: 1000000000,
          used: 500000000,
          free: 500000000,
          mountPoint: '/'
        }],
        gpu: {
          name: 'NVIDIA GeForce RTX 3080',
          usage: 75.0,
          memory: {
            total: 10737418240,
            used: 5368709120,
            free: 5368709120
          },
          temperature: 70.0
        }
      });
    });

    it('should return monitoring data for Windows system', async () => {
      // Update config to Windows
      const windowsConfig: ConnectionConfig = { ...mockConfig, os: 'windows' };
      await sshService.connect(windowsConfig);

      // Mock Windows-specific command outputs
      mockSSH.execCommand.mockImplementation((command: string) => {
        const outputs: { [key: string]: string } = {
          'hostname': 'test-hostname',
          'uptime -s': '2024-01-01 00:00:00',
          "wmic cpu get loadpercentage | findstr /v 'LoadPercentage'": '50.0',
          "wmic cpu get NumberOfCores | findstr /v 'NumberOfCores'": '4',
          'wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value': 'TotalVisibleMemorySize=8388608\nFreePhysicalMemory=4194304',
          'wmic logicaldisk get size,freespace,caption /format:value': 'Caption=C:\nSize=1000000000\nFreeSpace=500000000',
          'wmic path win32_VideoController get name,AdapterRAM,VideoProcessor /format:value': 'Name=NVIDIA GeForce RTX 3080\nAdapterRAM=8589934592\nVideoProcessor=NVIDIA'
        };
        return Promise.resolve({
          stdout: outputs[command] || '',
          stderr: '',
          code: 0,
          signal: null
        } as SSHExecCommandResponse);
      });

      const data = await sshService.getMonitoringData();

      expect(data).toEqual({
        system: {
          hostname: 'test-hostname',
          os: 'windows',
          uptime: expect.any(Number)
        },
        cpu: {
          usage: 50.0,
          cores: 4
        },
        memory: {
          total: 8589934592,
          used: 4294967296,
          free: 4294967296,
          swapTotal: 0,
          swapUsed: 0
        },
        storage: [{
          total: 1000000000,
          used: 500000000,
          free: 500000000,
          mountPoint: 'C:'
        }],
        gpu: {
          name: 'NVIDIA GeForce RTX 3080',
          usage: 0,
          memory: {
            total: 8589934592,
            used: 0,
            free: 8589934592
          }
        }
      });
    });
  });
}); 