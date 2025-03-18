import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
  useTheme,
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
import { MemoryInfo } from '../types/monitoring';

interface MemoryMonitorProps {
  data?: MemoryInfo;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Memory Usage
        </Typography>
        <Typography color="text.secondary">
          Connect to a system to view information
        </Typography>
      </Box>
    );
  }

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

  const memoryUsage = (data.used / data.total) * 100;
  const swapUsage = (data.swapUsed / data.swapTotal) * 100;
  const color = theme.palette.primary.main;
  const gradientColor = theme.palette.primary.light;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Memory Usage
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Physical Memory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {memoryUsage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={memoryUsage}
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
                {formatBytes(data.used)} / {formatBytes(data.total)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(data.free)} free
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1 }}>
                Swap Usage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {swapUsage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={swapUsage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
                },
              }}
            />
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(data.swapUsed)} / {formatBytes(data.swapTotal)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(data.swapTotal - data.swapUsed)} free
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Memory Usage History Graph */}
        <Grid item xs={12}>
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
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Memory Usage History
            </Typography>
            <Box sx={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.historicalUsage}>
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
                    tickFormatter={(value) => `${value}%`}
                    stroke="rgba(255, 255, 255, 0.7)"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [`${value}%`, 'Usage']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Physical Memory"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    data={data.historicalSwapUsage}
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name="Swap"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemoryMonitor; 