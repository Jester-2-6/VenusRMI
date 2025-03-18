import React, { useState } from 'react';
import { Box, Grid, Paper, Typography, Container, Alert, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import SystemMonitor from './SystemMonitor';
import CPUMonitor from './CPUMonitor';
import MemoryMonitor from './MemoryMonitor';
import StorageMonitor from './StorageMonitor';
import GPUMonitor from './GPUMonitor';
import ConnectionForm from './ConnectionForm';
import CompactMonitor from './CompactMonitor';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { MonitoringData, ConnectionConfig } from '../types/monitoring';

const DashboardContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(4),
}));

const MonitorCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
}));

interface DashboardProps {
  monitoringData?: MonitoringData;
  onConnect: (config: ConnectionConfig) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  error: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  monitoringData,
  onConnect,
  onDisconnect,
  isConnected,
  error,
}) => {
  const [isCompact, setIsCompact] = useState(false);

  const toggleView = () => {
    setIsCompact(!isCompact);
  };

  if (!isConnected) {
    return (
      <DashboardContainer maxWidth="sm">
        <ConnectionForm onConnect={onConnect} error={error} />
      </DashboardContainer>
    );
  }

  if (isCompact) {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 16,
        left: 16,
        width: '480px',
        height: '400px',
      }}>
        <Paper
          sx={{
            height: '100%',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            p: 2,
            pb: 1,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2, mb: 0.5 }}>System Monitor</Typography>
              {monitoringData?.system?.hostname && (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  {monitoringData.system.hostname}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Expand">
                <IconButton onClick={toggleView} size="small">
                  <FullscreenIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Disconnect">
                <IconButton onClick={onDisconnect} size="small" color="error">
                  <Typography variant="caption">×</Typography>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1, p: 1.5, overflow: 'hidden' }}>
            <CompactMonitor data={monitoringData} />
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <DashboardContainer maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          System Monitor
        </Typography>
        <Box>
          <Tooltip title="Compact View">
            <IconButton onClick={toggleView} size="small">
              <FullscreenExitIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Disconnect">
            <IconButton onClick={onDisconnect} size="small" color="error" sx={{ ml: 1 }}>
              <Typography variant="caption">×</Typography>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <MonitorCard>
            <SystemMonitor data={monitoringData?.system} />
          </MonitorCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MonitorCard>
            <CPUMonitor data={monitoringData?.cpu} />
          </MonitorCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MonitorCard>
            <MemoryMonitor data={monitoringData?.memory} />
          </MonitorCard>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MonitorCard>
            {monitoringData?.gpu && <GPUMonitor data={monitoringData.gpu} />}
          </MonitorCard>
        </Grid>
        <Grid item xs={12}>
          <MonitorCard>
            <StorageMonitor data={monitoringData?.storage} />
          </MonitorCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard; 