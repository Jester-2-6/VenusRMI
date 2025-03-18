import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
  useTheme,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { StorageInfo } from '../types/monitoring';

interface StorageMonitorProps {
  data?: StorageInfo[];
}

interface PhysicalDisk {
  name: string;
  total: number;
  used: number;
  free: number;
  partitions: StorageInfo[];
}

const usePhysicalDisks = (data: StorageInfo[] | undefined): PhysicalDisk[] => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];

    const disks: { [key: string]: PhysicalDisk } = {};
    
    data.forEach(storage => {
      // Extract disk name from mount point (e.g., /dev/sda1 -> sda)
      const diskMatch = storage.mountPoint.match(/\/dev\/([a-z]+)[0-9]*/);
      const diskName = diskMatch ? diskMatch[1] : 'unknown';
      
      if (!disks[diskName]) {
        disks[diskName] = {
          name: diskName,
          total: 0,
          used: 0,
          free: 0,
          partitions: []
        };
      }
      
      disks[diskName].total += storage.total;
      disks[diskName].used += storage.used;
      disks[diskName].free += storage.free;
      disks[diskName].partitions.push(storage);
    });
    
    return Object.values(disks);
  }, [data]);
};

const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const formatSpeed = (bytes: number) => {
  return `${formatBytes(bytes)}/s`;
};

const StorageMonitor: React.FC<StorageMonitorProps> = ({ data }) => {
  const theme = useTheme();
  const [expandedDisks, setExpandedDisks] = useState<{ [key: string]: boolean }>({});
  const physicalDisks = usePhysicalDisks(data);

  if (!data || data.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Storage Usage
        </Typography>
        <Typography color="text.secondary">
          Connect to a system to view information
        </Typography>
      </Box>
    );
  }

  const toggleDisk = (diskName: string) => {
    setExpandedDisks(prev => ({
      ...prev,
      [diskName]: !prev[diskName]
    }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Storage Usage
      </Typography>
      <Grid container spacing={2}>
        {physicalDisks.map((disk) => {
          const usage = (disk.used / disk.total) * 100;
          const color = theme.palette.primary.main;
          const gradientColor = theme.palette.primary.light;
          const isExpanded = expandedDisks[disk.name] || false;

          return (
            <Grid item xs={12} key={disk.name}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Physical Disk Summary */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    Disk {disk.name.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    {usage.toFixed(1)}%
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleDisk(disk.name)}
                    sx={{ color: 'text.secondary' }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={usage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${color} 0%, ${gradientColor} 100%)`,
                    },
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(disk.used)} / {formatBytes(disk.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(disk.free)} free
                  </Typography>
                </Box>

                {/* Remove usage history graph and keep only I/O speed graphs */}
                <Collapse in={expandedDisks[disk.name]}>
                  <Box sx={{ mt: 2 }}>
                    {/* I/O Speed History */}
                    {disk.partitions.map((partition) => (
                      <Box key={partition.mountPoint} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {partition.mountPoint} I/O Speed
                        </Typography>
                        <Box sx={{ height: 150 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={partition.historicalReadSpeed}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                stroke="rgba(255, 255, 255, 0.7)"
                                domain={['dataMin', 'dataMax']}
                                type="number"
                                scale="time"
                                interval="preserveStartEnd"
                              />
                              <YAxis
                                tickFormatter={(value) => `${formatBytes(value)}/s`}
                                stroke="rgba(255, 255, 255, 0.7)"
                                domain={[0, 'auto']}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '4px',
                                }}
                                labelFormatter={(value) => new Date(value).toLocaleString()}
                                formatter={(value: number) => [`${formatBytes(value)}/s`, 'Read Speed']}
                              />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={theme.palette.success.main}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                isAnimationActive={false}
                              />
                              <Line
                                type="monotone"
                                data={partition.historicalWriteSpeed}
                                dataKey="value"
                                stroke={theme.palette.error.main}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                name="Write Speed"
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StorageMonitor; 