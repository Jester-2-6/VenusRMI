import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  Paper,
} from '@mui/material';
import { CPUInfo } from '../types/monitoring';

interface CPUMonitorProps {
  data?: CPUInfo;
}

const CPUMonitor: React.FC<CPUMonitorProps> = ({ data }) => {
  if (!data) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          CPU Usage
        </Typography>
        <Typography color="text.secondary">
          Connect to a system to view information
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        CPU Usage
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
                CPU Usage
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
            <Typography variant="subtitle2" color="text.secondary">
              CPU Cores
            </Typography>
            <Typography variant="body1">{data.cores}</Typography>
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
                CPU Temperature
              </Typography>
              <Typography variant="body1">{data.temperature}°C</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CPUMonitor; 