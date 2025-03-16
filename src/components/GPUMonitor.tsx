import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import { GPUInfo } from '../types/monitoring';

interface GPUMonitorProps {
  data?: GPUInfo;
}

const GPUMonitor: React.FC<GPUMonitorProps> = ({ data }) => {
  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          GPU Usage
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

  const memoryUsage = (data.memory.used / data.memory.total) * 100;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        GPU Usage
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
            <Typography variant="subtitle2" color="text.secondary">
              GPU Name
            </Typography>
            <Typography variant="body1">{data.name}</Typography>
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
                GPU Usage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {data.usage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={data.usage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
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
                GPU Memory
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
                {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(data.memory.free)} free
              </Typography>
            </Box>
          </Paper>
        </Grid>
        {data.temperature !== undefined && (
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary">
                GPU Temperature
              </Typography>
              <Typography variant="body1">{data.temperature}°C</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default GPUMonitor; 