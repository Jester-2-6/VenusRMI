import { MockService } from '../mock';
import { ConnectionConfig } from '../../types/monitoring';

describe('MockService', () => {
  let mockService: MockService;
  const mockConfig: ConnectionConfig = {
    host: 'test-host',
    port: 22,
    username: 'test-user',
    password: 'test-password',
    os: 'linux'
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockService = new MockService();
  });

  afterEach(() => {
    jest.useRealTimers();
    mockService.disconnect();
  });

  describe('connect', () => {
    it('should successfully connect with delay', async () => {
      const connectPromise = mockService.connect(mockConfig);
      
      // Fast-forward timers to simulate delay
      jest.advanceTimersByTime(1000);
      
      await connectPromise;
      
      // Verify the config was stored
      expect((mockService as any).config).toEqual(mockConfig);
    });
  });

  describe('disconnect', () => {
    it('should clear config and interval', async () => {
      const connectPromise = mockService.connect(mockConfig);
      jest.advanceTimersByTime(1000);
      await connectPromise;
      
      const disconnectPromise = mockService.disconnect();
      jest.advanceTimersByTime(1000);
      await disconnectPromise;
      
      // Verify config and interval are cleared
      expect((mockService as any).config).toBeNull();
      expect((mockService as any).interval).toBeNull();
    }, 10000);
  });

  describe('getMonitoringData', () => {
    it('should throw error when not connected', async () => {
      await expect(mockService.getMonitoringData()).rejects.toThrow('Not connected to any system');
    });

    it('should return mock monitoring data for Linux system', async () => {
      const connectPromise = mockService.connect(mockConfig);
      jest.advanceTimersByTime(1000);
      await connectPromise;
      
      // Fast-forward timers to ensure data is generated
      jest.advanceTimersByTime(1000);
      
      const data = await mockService.getMonitoringData();
      
      // Verify the structure and types of the returned data
      expect(data).toMatchObject({
        system: {
          hostname: expect.any(String),
          os: 'linux',
          uptime: expect.any(Number)
        },
        cpu: {
          usage: expect.any(Number),
          cores: expect.any(Number),
          temperature: expect.any(Number)
        },
        memory: {
          total: expect.any(Number),
          used: expect.any(Number),
          free: expect.any(Number),
          swapTotal: expect.any(Number),
          swapUsed: expect.any(Number)
        },
        storage: expect.arrayContaining([
          expect.objectContaining({
            total: expect.any(Number),
            used: expect.any(Number),
            free: expect.any(Number),
            mountPoint: expect.any(String)
          })
        ])
      });
    }, 10000);

    it('should return mock monitoring data for Windows system', async () => {
      console.log('Starting Windows system test');
      
      // Connect with Windows config
      const windowsConfig: ConnectionConfig = { ...mockConfig, os: 'windows' };
      console.log('Connecting with Windows config:', windowsConfig);
      await mockService.connect(windowsConfig);
      
      console.log('Getting monitoring data');
      const data = await mockService.getMonitoringData();
      console.log('Received data:', data);
      
      // Verify the structure and types of the returned data
      expect(data).toMatchObject({
        system: {
          hostname: expect.any(String),
          os: 'windows',
          uptime: expect.any(Number)
        },
        cpu: {
          usage: expect.any(Number),
          cores: expect.any(Number)
        },
        memory: {
          total: expect.any(Number),
          used: expect.any(Number),
          free: expect.any(Number),
          swapTotal: expect.any(Number),
          swapUsed: expect.any(Number)
        },
        storage: expect.arrayContaining([
          expect.objectContaining({
            total: expect.any(Number),
            used: expect.any(Number),
            free: expect.any(Number),
            mountPoint: expect.any(String)
          })
        ])
      });
      console.log('Test completed successfully');
    });

    it('should return consistent data for multiple calls', async () => {
      const connectPromise = mockService.connect(mockConfig);
      jest.advanceTimersByTime(1000);
      await connectPromise;
      
      // Fast-forward timers to ensure data is generated
      jest.advanceTimersByTime(1000);
      
      // Get monitoring data twice
      const data1 = await mockService.getMonitoringData();
      const data2 = await mockService.getMonitoringData();
      
      // Verify the data structure is consistent, but allow for random values
      expect(data2).toMatchObject({
        system: {
          hostname: data1.system.hostname,
          os: data1.system.os,
          uptime: expect.any(Number)
        },
        cpu: {
          usage: expect.any(Number),
          cores: data1.cpu.cores,
          temperature: expect.any(Number)
        },
        memory: {
          total: data1.memory.total,
          used: expect.any(Number),
          free: expect.any(Number),
          swapTotal: data1.memory.swapTotal,
          swapUsed: expect.any(Number)
        },
        storage: data1.storage.map(s => ({
          total: s.total,
          used: expect.any(Number),
          free: expect.any(Number),
          mountPoint: s.mountPoint
        }))
      });
    }, 10000);
  });
}); 