import React from 'react';
import { Box, Grid, Paper, Typography, Container, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import SystemMonitor from '@/components/SystemMonitor';
import CPUMonitor from '@/components/CPUMonitor';
import MemoryMonitor from '@/components/MemoryMonitor';
import StorageMonitor from '@/components/StorageMonitor';
import GPUMonitor from '@/components/GPUMonitor';
import ConnectionForm from '@/components/ConnectionForm';
import { MonitoringData, ConnectionConfig } from '@/types/monitoring';

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

const Dashboard: React.FC<DashboardProps> = ({ monitoringData, onConnect, onDisconnect, isConnected, error }) => {
  return (
    <DashboardContainer maxWidth="xl">
      <Grid container spacing={3}>
        {/* Connection Form */}
        <Grid item xs={12}>
          <MonitorCard>
            <ConnectionForm 
              onConnect={onConnect} 
              onDisconnect={onDisconnect}
              isConnected={isConnected}
            />
          </MonitorCard>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Connection Status */}
        {isConnected && (
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Connected successfully
            </Alert>
          </Grid>
        )}

        {/* System Info */}
        <Grid item xs={12} md={6} lg={4}>
          <MonitorCard>
            <SystemMonitor data={monitoringData?.system} />
          </MonitorCard>
        </Grid>

        {/* CPU Monitor */}
        <Grid item xs={12} md={6} lg={4}>
          <MonitorCard>
            <CPUMonitor data={monitoringData?.cpu} />
          </MonitorCard>
        </Grid>

        {/* Memory Monitor */}
        <Grid item xs={12} md={6} lg={4}>
          <MonitorCard>
            <MemoryMonitor data={monitoringData?.memory} />
          </MonitorCard>
        </Grid>

        {/* Storage Monitor */}
        <Grid item xs={12} md={6}>
          <MonitorCard>
            <StorageMonitor data={monitoringData?.storage} />
          </MonitorCard>
        </Grid>

        {/* GPU Monitor */}
        <Grid item xs={12} md={6}>
          <MonitorCard>
            <GPUMonitor data={monitoringData?.gpu} />
          </MonitorCard>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard; 