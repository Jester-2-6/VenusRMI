import { APIService } from '../api';
import { ConnectionConfig } from '../../types/monitoring';

// Mock the global fetch function
global.fetch = jest.fn();

describe('APIService', () => {
  let apiService: APIService;
  const mockConfig: ConnectionConfig = {
    host: 'test-host',
    port: 22,
    username: 'test-user',
    password: 'test-password',
    os: 'linux'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of APIService
    apiService = new APIService();
  });

  describe('connect', () => {
    it('should successfully connect to API', async () => {
      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id' })
      });

      await apiService.connect(mockConfig);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/connect',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockConfig),
        }
      );
    });

    it('should throw error when API connection fails', async () => {
      // Mock failed API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Connection failed' })
      });

      await expect(apiService.connect(mockConfig)).rejects.toThrow('Connection failed');
    });

    it('should disconnect existing connection before connecting', async () => {
      // Mock successful first connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id-1' })
      });

      // Mock successful disconnect
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true })
      });

      // Mock successful second connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id-2' })
      });

      // First connect
      await apiService.connect(mockConfig);

      // Connect again
      await apiService.connect(mockConfig);

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:3001/api/connect',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockConfig)
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/api/disconnect',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ connectionId: 'test-connection-id-1' })
        })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        'http://localhost:3001/api/connect',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockConfig)
        })
      );
    });
  });

  describe('disconnect', () => {
    it('should successfully disconnect from API', async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id' })
      });

      // Mock successful disconnect
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true })
      });

      // First connect to set connectionId
      await apiService.connect(mockConfig);

      await apiService.disconnect();

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/api/disconnect',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ connectionId: 'test-connection-id' }),
        }
      );
    });

    it('should not make API call when not connected', async () => {
      await apiService.disconnect();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error when API disconnect fails', async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id' })
      });

      // Mock failed disconnect
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Disconnect failed' })
      });

      // First connect to set connectionId
      await apiService.connect(mockConfig);

      await expect(apiService.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('getMonitoringData', () => {
    const mockMonitoringData = {
      system: {
        hostname: 'test-host',
        os: 'linux',
        uptime: 3600
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
      }]
    };

    it('should successfully get monitoring data', async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id' })
      });

      // Mock successful monitoring data response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockMonitoringData })
      });

      // First connect to set connectionId
      await apiService.connect(mockConfig);

      const data = await apiService.getMonitoringData();

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:3001/api/monitoring-data/test-connection-id'
      );
      expect(data).toEqual(mockMonitoringData);
    });

    it('should throw error when not connected', async () => {
      await expect(apiService.getMonitoringData()).rejects.toThrow('Not connected to any system');
    });

    it('should throw error when API request fails', async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, connectionId: 'test-connection-id' })
      });

      // Mock failed monitoring data response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Failed to get monitoring data' })
      });

      // First connect to set connectionId
      await apiService.connect(mockConfig);

      await expect(apiService.getMonitoringData()).rejects.toThrow('Failed to get monitoring data');
    });
  });
}); 