import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import { MemoryInfo } from '../types/monitoring';

interface MemoryMonitorProps {
  data?: MemoryInfo;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ data }) => {
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
      </Grid>
    </Box>
  );
};

export default MemoryMonitor; 