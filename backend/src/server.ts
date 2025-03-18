import express, { Request, Response } from 'express';
import cors from 'cors';
import { Client } from 'ssh2';
import { MonitoringData, ConnectionConfig, SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo, HistoricalDataPoint } from './types/monitoring';

const app = express();
app.use(cors());
app.use(express.json());

// Store SSH connections and historical data
const connections: { [key: string]: Client } = {};
const historicalData: {
  [connectionId: string]: {
    cpu: {
      usage: HistoricalDataPoint[];
      temperature?: HistoricalDataPoint[];
    };
    memory: {
      usage: HistoricalDataPoint[];
      swapUsage: HistoricalDataPoint[];
    };
    storage: {
      [mountPoint: string]: {
        usage: HistoricalDataPoint[];
        readSpeed: HistoricalDataPoint[];
        writeSpeed: HistoricalDataPoint[];
      };
    };
    gpu?: {
      usage: HistoricalDataPoint[];
      memoryUsage: HistoricalDataPoint[];
      temperature?: HistoricalDataPoint[];
    };
  };
} = {};

// Maximum number of historical data points to keep
const MAX_HISTORY_POINTS = 100; // Keep 100 data points (about 8.3 minutes at 5-second intervals)

// Helper function to add a data point to history
function addHistoricalDataPoint(array: HistoricalDataPoint[], value: number) {
  if (!array) return; // Skip if array is undefined
  const timestamp = Date.now();
  
  // Only add a new point if we don't have one in the last 4.5 seconds
  // This ensures we get a point every 5 seconds even with slight timing variations
  const lastPoint = array[array.length - 1];
  if (!lastPoint || (timestamp - lastPoint.timestamp) >= 4500) {
    array.push({ timestamp, value });
    if (array.length > MAX_HISTORY_POINTS) {
      array.shift();
    }
  }
}

// Helper function to initialize historical data for a connection
function initializeHistoricalData(connectionId: string) {
  if (!historicalData[connectionId]) {
    historicalData[connectionId] = {
      cpu: {
        usage: [],
        temperature: undefined,
      },
      memory: {
        usage: [],
        swapUsage: [],
      },
      storage: {},
      gpu: undefined,
    };
  }
}

// Helper function to execute SSH commands
async function executeCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      stream.on('data', (data: Buffer) => {
        output += data.toString();
      });

      stream.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Command failed with code ${code}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  });
}

// Get system information
async function getSystemInfo(conn: Client): Promise<SystemInfo> {
  try {
    const [hostname, uptime] = await Promise.all([
      executeCommand(conn, 'hostname'),
      executeCommand(conn, 'cat /proc/uptime | cut -d " " -f1').catch(() => '0')
    ]);

    return {
      hostname: hostname.trim(),
      uptime: Math.floor(parseFloat(uptime) || 0),
      os: 'linux'
    };
  } catch (error) {
    console.error('Failed to get system info:', error);
    return {
      hostname: 'Unknown',
      uptime: 0,
      os: 'linux'
    };
  }
}

// Get CPU information
async function getCPUInfo(conn: Client, connectionId: string): Promise<CPUInfo> {
  try {
    const [usage, cores, temp] = await Promise.all([
      executeCommand(conn, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").catch(() => '0'),
      executeCommand(conn, 'nproc').catch(() => '1'),
      executeCommand(conn, 'cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | awk "{print $1/1000}"').catch(() => '')
    ]);

    const usageValue = parseFloat(usage) || 0;
    const tempValue = temp ? parseFloat(temp) : undefined;

    // Update historical data
    addHistoricalDataPoint(historicalData[connectionId].cpu.usage, usageValue);
    if (tempValue !== undefined) {
      if (!historicalData[connectionId].cpu.temperature) {
        historicalData[connectionId].cpu.temperature = [];
      }
      addHistoricalDataPoint(historicalData[connectionId].cpu.temperature!, tempValue);
    }

    return {
      usage: usageValue,
      cores: parseInt(cores) || 1,
      temperature: tempValue,
      historicalUsage: historicalData[connectionId].cpu.usage,
      historicalTemperature: historicalData[connectionId].cpu.temperature
    };
  } catch (error) {
    console.error('Failed to get CPU info:', error);
    return {
      usage: 0,
      cores: 1,
      historicalUsage: historicalData[connectionId].cpu.usage,
      historicalTemperature: historicalData[connectionId].cpu.temperature
    };
  }
}

// Get memory information
async function getMemoryInfo(conn: Client, connectionId: string): Promise<MemoryInfo> {
  try {
    const output = await executeCommand(conn, 'free -b').catch(() => '');
    if (!output) {
      throw new Error('Failed to get memory info');
    }

    const lines = output.split('\n');
    const memLine = lines[1]?.split(/\s+/).filter(Boolean) || [];
    const swapLine = lines[2]?.split(/\s+/).filter(Boolean) || [];

    // Ensure we have all required fields
    if (memLine.length < 4 || swapLine.length < 3) {
      console.error('Invalid memory info format:', { memLine, swapLine });
      throw new Error('Invalid memory info format');
    }

    const total = parseInt(memLine[1]) || 0;
    const used = parseInt(memLine[2]) || 0;
    const swapTotal = parseInt(swapLine[1]) || 0;
    const swapUsed = parseInt(swapLine[2]) || 0;

    // Calculate usage percentages
    const usagePercent = total > 0 ? (used / total) * 100 : 0;
    const swapUsagePercent = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;

    // Initialize memory history if it doesn't exist
    if (!historicalData[connectionId]?.memory) {
      historicalData[connectionId] = {
        ...historicalData[connectionId],
        memory: {
          usage: [],
          swapUsage: []
        }
      };
    }

    // Update historical data
    addHistoricalDataPoint(historicalData[connectionId].memory.usage, usagePercent);
    addHistoricalDataPoint(historicalData[connectionId].memory.swapUsage, swapUsagePercent);

    return {
      total,
      used,
      free: parseInt(memLine[3]) || 0,
      swapTotal,
      swapUsed,
      historicalUsage: historicalData[connectionId].memory.usage,
      historicalSwapUsage: historicalData[connectionId].memory.swapUsage
    };
  } catch (error) {
    console.error('Failed to get memory info:', error);
    // Initialize memory history if it doesn't exist
    if (!historicalData[connectionId]?.memory) {
      historicalData[connectionId] = {
        ...historicalData[connectionId],
        memory: {
          usage: [],
          swapUsage: []
        }
      };
    }
    return {
      total: 0,
      used: 0,
      free: 0,
      swapTotal: 0,
      swapUsed: 0,
      historicalUsage: historicalData[connectionId].memory.usage,
      historicalSwapUsage: historicalData[connectionId].memory.swapUsage
    };
  }
}

// Get storage information
async function getStorageInfo(conn: Client, connectionId: string): Promise<StorageInfo[]> {
  try {
    const [dfOutput, iostatOutput] = await Promise.all([
      executeCommand(conn, 'df -B1').catch(() => ''),
      executeCommand(conn, 'iostat -d -k 1 1').catch(() => '')
    ]);

    if (!dfOutput) {
      throw new Error('Failed to get storage info');
    }

    const lines = dfOutput.split('\n').slice(1);
    const storageInfo: StorageInfo[] = [];

    // Initialize storage history if it doesn't exist
    if (!historicalData[connectionId]?.storage) {
      historicalData[connectionId] = {
        ...historicalData[connectionId],
        storage: {}
      };
    }

    // Parse iostat output for read/write speeds
    const deviceStats: { [device: string]: { read: number; write: number } } = {};
    if (iostatOutput) {
      const iostatLines = iostatOutput.split('\n');
      let deviceSection = false;
      for (const line of iostatLines) {
        if (line.trim().startsWith('Device')) {
          deviceSection = true;
          continue;
        }
        if (deviceSection && line.trim()) {
          const parts = line.trim().split(/\s+/).filter(Boolean);
          if (parts.length >= 4) {
            deviceStats[parts[0]] = {
              read: parseFloat(parts[2]) * 1024 || 0, // Convert KB/s to B/s
              write: parseFloat(parts[3]) * 1024 || 0
            };
          }
        }
      }
    }

    for (const line of lines) {
      try {
        const parts = line.split(/\s+/).filter(Boolean);
        if (parts.length < 6) continue;

        const [filesystem, total, used, free, , mountPoint] = parts;
        if (!filesystem || !mountPoint) continue;

        // Initialize historical data for this mount point if it doesn't exist
        if (!historicalData[connectionId].storage[mountPoint]) {
          historicalData[connectionId].storage[mountPoint] = {
            usage: [],
            readSpeed: [],
            writeSpeed: []
          };
        }

        const totalBytes = parseInt(total) || 0;
        const usedBytes = parseInt(used) || 0;
        const usagePercent = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;

        // Update usage history
        addHistoricalDataPoint(historicalData[connectionId].storage[mountPoint].usage, usagePercent);

        // Update I/O speed history if available
        const device = filesystem.split('/').pop();
        if (device && deviceStats[device]) {
          addHistoricalDataPoint(historicalData[connectionId].storage[mountPoint].readSpeed, deviceStats[device].read);
          addHistoricalDataPoint(historicalData[connectionId].storage[mountPoint].writeSpeed, deviceStats[device].write);
        } else {
          // If no I/O stats available, add 0 to maintain the time series
          addHistoricalDataPoint(historicalData[connectionId].storage[mountPoint].readSpeed, 0);
          addHistoricalDataPoint(historicalData[connectionId].storage[mountPoint].writeSpeed, 0);
        }

        storageInfo.push({
          total: totalBytes,
          used: usedBytes,
          free: parseInt(free) || 0,
          mountPoint,
          historicalUsage: historicalData[connectionId].storage[mountPoint].usage,
          historicalReadSpeed: historicalData[connectionId].storage[mountPoint].readSpeed,
          historicalWriteSpeed: historicalData[connectionId].storage[mountPoint].writeSpeed
        });
      } catch (error) {
        console.error('Failed to parse storage line:', line, error);
      }
    }

    return storageInfo;
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return [];
  }
}

// Get GPU information
async function getGPUInfo(conn: Client, connectionId: string): Promise<GPUInfo | undefined> {
  try {
    const [usage, memory, temp] = await Promise.all([
      executeCommand(conn, 'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits').catch(() => ''),
      executeCommand(conn, 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits').catch(() => ''),
      executeCommand(conn, 'nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits').catch(() => '')
    ]);

    if (!usage && !memory && !temp) {
      return undefined;
    }

    const usageValue = parseFloat(usage) || 0;
    const [memUsed, memTotal] = memory.split(',').map(v => parseFloat(v) * 1024 * 1024 || 0); // Convert MiB to bytes
    const tempValue = parseFloat(temp) || undefined;
    const memoryUsagePercent = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;

    // Initialize GPU historical data if not exists
    if (!historicalData[connectionId].gpu) {
      historicalData[connectionId].gpu = {
        usage: [],
        memoryUsage: [],
        temperature: tempValue !== undefined ? [] : undefined
      };
    }

    // Update historical data
    addHistoricalDataPoint(historicalData[connectionId].gpu!.usage, usageValue);
    addHistoricalDataPoint(historicalData[connectionId].gpu!.memoryUsage, memoryUsagePercent);
    if (tempValue !== undefined && historicalData[connectionId].gpu!.temperature) {
      addHistoricalDataPoint(historicalData[connectionId].gpu!.temperature, tempValue);
    }

    return {
      usage: usageValue,
      memoryUsed: memUsed,
      memoryTotal: memTotal,
      temperature: tempValue,
      historicalUsage: historicalData[connectionId].gpu!.usage,
      historicalMemoryUsage: historicalData[connectionId].gpu!.memoryUsage,
      historicalTemperature: historicalData[connectionId].gpu!.temperature
    };
  } catch (error) {
    console.error('Failed to get GPU info:', error);
    return undefined;
  }
}

// Connect to SSH
app.post('/api/connect', async (req: Request<{}, {}, ConnectionConfig>, res: Response) => {
  const { host, port, username, password } = req.body;
  const connectionId = `${username}@${host}:${port}`;

  console.log(`Attempting to connect to ${host}:${port} as ${username}`);

  // Initialize historical data for this connection
  initializeHistoricalData(connectionId);

  // Check if connection exists and is still active
  if (connections[connectionId]) {
    const conn = connections[connectionId];
    try {
      console.log(`Found existing connection for ${connectionId}, testing if alive...`);
      // Try to execute a simple command to check if connection is still alive
      await executeCommand(conn, 'echo "test"');
      // If we get here, the connection is still active
      console.log(`Existing connection is active, cleaning up...`);
      conn.end();
      delete connections[connectionId];
    } catch {
      console.log(`Existing connection is dead, cleaning up...`);
      // If command fails, connection is dead, clean it up
      conn.end();
      delete connections[connectionId];
    }
  }

  const conn = new Client();

  // Set up connection error handling
  conn.on('error', (err) => {
    console.error('SSH connection error:', err);
    console.error('Connection details:', { host, port, username });
    delete connections[connectionId];
    delete historicalData[connectionId];
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Set up connection ready handler
  conn.once('ready', () => {
    console.log(`Successfully connected to ${connectionId}`);
    connections[connectionId] = conn;
    if (!res.headersSent) {
      res.json({ success: true, connectionId });
    }
  });

  // Add debug events
  conn.on('handshake', (negotiated) => {
    console.log(`Handshake completed for ${connectionId}`, negotiated);
  });

  conn.on('timeout', () => {
    console.log(`Connection timed out for ${connectionId}`);
  });

  // Attempt to connect
  try {
    console.log(`Initiating connection to ${connectionId}...`);
    conn.connect({
      host,
      port,
      username,
      password,
      // Increase timeouts
      readyTimeout: 30000, // 30 seconds
      keepaliveInterval: 10000, // 10 seconds
      debug: (message: string) => console.log(`SSH Debug: ${message}`),
      algorithms: {
        kex: [
          'ecdh-sha2-nistp256',
          'ecdh-sha2-nistp384',
          'ecdh-sha2-nistp521',
          'diffie-hellman-group-exchange-sha256',
          'diffie-hellman-group14-sha1'
        ],
        cipher: [
          'aes128-ctr',
          'aes192-ctr',
          'aes256-ctr',
          'aes128-gcm',
          'aes256-gcm'
        ],
        serverHostKey: [
          'ssh-rsa',
          'ecdsa-sha2-nistp256',
          'ecdsa-sha2-nistp384',
          'ecdsa-sha2-nistp521'
        ]
      }
    });
  } catch (error: any) {
    console.error('SSH connection setup failed:', error);
    console.error('Connection details:', { host, port, username });
    delete historicalData[connectionId];
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || 'Connection failed' });
    }
  }
});

// Disconnect from SSH
app.delete('/api/disconnect/:connectionId', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connections[connectionId];

  if (!conn) {
    return res.status(404).json({ success: false, error: 'Connection not found' });
  }

  try {
    conn.end();
    delete connections[connectionId];
    delete historicalData[connectionId];
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to disconnect:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to disconnect' });
  }
});

// Get monitoring data
app.get('/api/monitoring-data/:connectionId', async (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = connections[connectionId];

  if (!conn) {
    console.error(`Connection not found for ID: ${connectionId}`);
    return res.status(404).json({ success: false, error: 'Connection not found' });
  }

  // Ensure historical data exists for this connection
  if (!historicalData[connectionId]) {
    console.log(`Initializing historical data for ${connectionId}`);
    initializeHistoricalData(connectionId);
  }

  try {
    // Test connection is still alive
    await executeCommand(conn, 'echo "test"').catch((error) => {
      console.error(`Connection test failed for ${connectionId}:`, error);
      throw new Error('Connection lost');
    });

    const [system, cpu, memory, storage, gpu] = await Promise.all([
      getSystemInfo(conn),
      getCPUInfo(conn, connectionId),
      getMemoryInfo(conn, connectionId),
      getStorageInfo(conn, connectionId),
      getGPUInfo(conn, connectionId)
    ]);

    const monitoringData: MonitoringData = {
      system,
      cpu,
      memory,
      storage,
      gpu
    };

    res.json({ success: true, data: monitoringData });
  } catch (error: any) {
    console.error('Failed to get monitoring data:', error);
    // If connection is lost, clean up
    if (error.message === 'Connection lost') {
      console.log(`Cleaning up lost connection for ${connectionId}`);
      delete connections[connectionId];
      delete historicalData[connectionId];
      return res.status(404).json({ success: false, error: 'Connection lost' });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to get monitoring data' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 