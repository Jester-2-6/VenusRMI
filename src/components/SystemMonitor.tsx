import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import { SystemInfo } from '../types/monitoring';

interface SystemMonitorProps {
  data?: SystemInfo;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ data }) => {
  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          System Information
        </Typography>
        <Typography color="text.secondary">
          Connect to a system to view information
        </Typography>
      </Box>
    );
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        System Information
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
              Hostname
            </Typography>
            <Typography variant="body1">{data.hostname}</Typography>
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
            <Typography variant="subtitle2" color="text.secondary">
              Operating System
            </Typography>
            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
              {data.os}
            </Typography>
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
            <Typography variant="subtitle2" color="text.secondary">
              Uptime
            </Typography>
            <Typography variant="body1">{formatUptime(data.uptime)}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemMonitor; 