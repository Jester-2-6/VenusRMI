import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import { StorageInfo } from '../types/monitoring';

interface StorageMonitorProps {
  data?: StorageInfo[];
}

const StorageMonitor: React.FC<StorageMonitorProps> = ({ data }) => {
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Storage Usage
      </Typography>
      <Grid container spacing={2}>
        {data.map((storage, index) => {
          const usage = (storage.used / storage.total) * 100;
          return (
            <Grid item xs={12} key={index}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {storage.mountPoint}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {usage.toFixed(1)}%
                  </Typography>
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
                    },
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(storage.used)} / {formatBytes(storage.total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(storage.free)} free
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StorageMonitor; 