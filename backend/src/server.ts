import express, { Request, Response } from 'express';
import cors from 'cors';
import { Client } from 'ssh2';
import { MonitoringData, ConnectionConfig, SystemInfo, CPUInfo, MemoryInfo, StorageInfo, GPUInfo } from './types/monitoring';

const app = express();
app.use(cors());
app.use(express.json());

// Store SSH connections
const connections: { [key: string]: Client } = {};

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
  const [hostname, uptime] = await Promise.all([
    executeCommand(conn, 'hostname'),
    executeCommand(conn, 'cat /proc/uptime | cut -d " " -f1')
  ]);

  return {
    hostname,
    uptime: Math.floor(parseFloat(uptime)),
    os: 'linux' // We'll determine this from the connection config
  };
}

// Get CPU information
async function getCPUInfo(conn: Client): Promise<CPUInfo> {
  const [usage, cores, temp] = await Promise.all([
    executeCommand(conn, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"),
    executeCommand(conn, 'nproc'),
    executeCommand(conn, 'cat /sys/class/thermal/thermal_zone*/temp 2>/dev/null | awk "{print $1/1000}"').catch(() => '')
  ]);

  return {
    usage: parseFloat(usage),
    cores: parseInt(cores),
    temperature: temp ? parseFloat(temp) : undefined
  };
}

// Get memory information
async function getMemoryInfo(conn: Client): Promise<MemoryInfo> {
  const output = await executeCommand(conn, 'free -b');
  const lines = output.split('\n');
  const memLine = lines[1].split(/\s+/);
  const swapLine = lines[2].split(/\s+/);

  return {
    total: parseInt(memLine[1]),
    used: parseInt(memLine[2]),
    free: parseInt(memLine[3]),
    swapTotal: parseInt(swapLine[1]),
    swapUsed: parseInt(swapLine[2])
  };
}

// Get storage information
async function getStorageInfo(conn: Client): Promise<StorageInfo[]> {
  const output = await executeCommand(conn, 'df -B1');
  const lines = output.split('\n').slice(1);

  return lines.map(line => {
    const [filesystem, total, used, free, mountPoint] = line.split(/\s+/);
    return {
      total: parseInt(total),
      used: parseInt(used),
      free: parseInt(free),
      mountPoint
    };
  });
}

// Get GPU information
async function getGPUInfo(conn: Client): Promise<GPUInfo | undefined> {
  try {
    // Check if nvidia-smi is available
    await executeCommand(conn, 'which nvidia-smi');
    
    const [name, usage, memory, temp] = await Promise.all([
      executeCommand(conn, "nvidia-smi --query-gpu=gpu_name --format=csv,noheader"),
      executeCommand(conn, "nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader"),
      executeCommand(conn, "nvidia-smi --query-gpu=memory.total,memory.used,memory.free --format=csv,noheader"),
      executeCommand(conn, "nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader")
    ]);

    const [total, used, free] = memory.split(',').map(v => parseInt(v) * 1024 * 1024); // Convert MB to bytes

    return {
      name: name.trim(),
      usage: parseFloat(usage),
      memory: {
        total,
        used,
        free
      },
      temperature: parseFloat(temp)
    };
  } catch {
    return undefined;
  }
}

// Connect to SSH
app.post('/api/connect', async (req: Request<{}, {}, ConnectionConfig>, res: Response) => {
  const { host, port, username, password } = req.body;
  const connectionId = `${username}@${host}:${port}`;

  // Check if connection exists and is still active
  if (connections[connectionId]) {
    const conn = connections[connectionId];
    try {
      // Try to execute a simple command to check if connection is still alive
      await executeCommand(conn, 'echo "test"');
      return res.status(400).json({ success: false, error: 'Connection already exists' });
    } catch {
      // If command fails, connection is dead, clean it up
      conn.end();
      delete connections[connectionId];
    }
  }

  const conn = new Client();
  connections[connectionId] = conn;

  conn.on('ready', () => {
    res.json({ success: true, connectionId });
  }).on('error', (err) => {
    delete connections[connectionId];
    res.status(500).json({ success: false, error: err.message });
  }).connect({
    host,
    port,
    username,
    password
  });
});

// Disconnect from SSH
app.post('/api/disconnect/:connectionId', (req: Request<{ connectionId: string }>, res: Response) => {
  const { connectionId } = req.params;
  const conn = connections[connectionId];

  if (!conn) {
    return res.status(404).json({ success: false, error: 'Connection not found' });
  }

  conn.end();
  delete connections[connectionId];
  res.json({ success: true, message: 'Disconnected successfully' });
});

// Get monitoring data
app.get('/api/monitoring-data/:connectionId', async (req: Request<{ connectionId: string }>, res: Response) => {
  const { connectionId } = req.params;
  const conn = connections[connectionId];

  if (!conn) {
    return res.status(404).json({ success: false, error: 'Connection not found' });
  }

  try {
    const [system, cpu, memory, storage, gpu] = await Promise.all([
      getSystemInfo(conn),
      getCPUInfo(conn),
      getMemoryInfo(conn),
      getStorageInfo(conn),
      getGPUInfo(conn)
    ]);

    const monitoringData: MonitoringData = {
      system,
      cpu,
      memory,
      storage,
      gpu
    };

    res.json({ success: true, data: monitoringData });
  } catch (error) {
    console.error('Failed to get monitoring data:', error);
    res.status(500).json({ success: false, error: 'Failed to get monitoring data' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 