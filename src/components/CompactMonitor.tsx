import React from 'react';
import { Box, Typography, CircularProgress, Grid, useTheme } from '@mui/material';
import { MonitoringData } from '../types/monitoring';

interface CompactMonitorProps {
  data?: MonitoringData;
}

const CompactMonitor: React.FC<CompactMonitorProps> = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Typography color="text.secondary">
        No data available
      </Typography>
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
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const memoryUsage = data.memory ? (data.memory.used / data.memory.total) * 100 : 0;
  
  // Distinct colors for each metric
  const colors = {
    cpu: '#2196F3', // Blue
    memory: '#4CAF50', // Green
    system: '#9C27B0', // Purple
    data: '#FF9800', // Orange
    gpu: '#F44336', // Red
  };

  // Warning and error thresholds
  const getColor = (value: number, baseColor: string) => {
    if (value > 90) return theme.palette.error.main;
    if (value > 70) return theme.palette.warning.main;
    return baseColor;
  };

  // Group storage by physical disks
  const physicalDisks = data.storage.reduce((acc, storage) => {
    const diskName = storage.mountPoint === '/' ? 'System' : 'Data';
    if (!acc[diskName]) {
      acc[diskName] = {
        total: storage.total,
        used: storage.used,
      };
    }
    return acc;
  }, {} as { [key: string]: { total: number; used: number } });

  const renderCircularProgress = (value: number, label: string, color: string, subtitle?: string, details?: string) => (
    <Grid item xs={6}>
      <Box sx={{ 
        position: 'relative', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        p: 1.5
      }}>
        <Box sx={{ position: 'relative', mb: 0.5 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={70}
            thickness={5}
            sx={{ color: 'rgba(255, 255, 255, 0.1)' }}
          />
          <CircularProgress
            variant="determinate"
            value={value}
            size={70}
            thickness={5}
            sx={{
              color: getColor(value, color),
              position: 'absolute',
              left: 0,
              transition: 'all 0.3s ease'
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1, fontSize: '1.1rem' }}>
              {`${Math.round(value)}%`}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.primary" sx={{ mb: 0.25, lineHeight: 1 }}>
            {label}
          </Typography>
          {details && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
              {details}
            </Typography>
          )}
        </Box>
      </Box>
    </Grid>
  );

  return (
    <Grid container spacing={0} sx={{ width: '100%', height: '100%' }}>
      {/* CPU */}
      {renderCircularProgress(
        data.cpu.usage,
        'CPU',
        colors.cpu,
        `${data.cpu.cores} cores`,
        data.cpu.temperature ? `${data.cpu.temperature.toFixed(1)}°C` : undefined
      )}

      {/* Memory */}
      {renderCircularProgress(
        memoryUsage,
        'Memory',
        colors.memory,
        formatBytes(data.memory.used),
        `Total: ${formatBytes(data.memory.total)}`
      )}

      {/* Storage */}
      {Object.entries(physicalDisks).map(([diskName, disk]) => {
        const usage = (disk.used / disk.total) * 100;
        return renderCircularProgress(
          usage,
          diskName,
          diskName === 'System' ? colors.system : colors.data,
          formatBytes(disk.used),
          `Free: ${formatBytes(disk.total - disk.used)}`
        );
      })}

      {/* GPU */}
      {data.gpu && renderCircularProgress(
        data.gpu.usage,
        'GPU',
        colors.gpu,
        formatBytes(data.gpu.memoryUsed),
        `Total: ${formatBytes(data.gpu.memoryTotal)}`
      )}
    </Grid>
  );
};

export default CompactMonitor; 