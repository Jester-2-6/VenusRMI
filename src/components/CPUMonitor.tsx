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
import { CPUInfo } from '../types/monitoring';

interface CPUMonitorProps {
  data?: CPUInfo;
}

const CPUMonitor: React.FC<CPUMonitorProps> = ({ data }) => {
  const theme = useTheme();

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

  const color = theme.palette.primary.main;
  const gradientColor = theme.palette.primary.light;

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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
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
                  background: `linear-gradient(90deg, ${color} 0%, ${gradientColor} 100%)`,
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
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              CPU Cores
            </Typography>
            <Typography variant="body1">{data.cores}</Typography>
          </Paper>
        </Grid>

        {/* CPU Usage History Graph */}
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
              CPU Usage History
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
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* CPU Temperature Graph */}
        {data.temperature !== undefined && (
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
                CPU Temperature History
              </Typography>
              <Box sx={{ height: 150 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.historicalTemperature}>
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
                      tickFormatter={(value) => `${value}°C`}
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
                      formatter={(value: number) => [`${value}°C`, 'Temperature']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.error.main}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CPUMonitor; 