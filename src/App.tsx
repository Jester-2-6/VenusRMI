import { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Dashboard from './components/Dashboard';
import { MonitoringData, ConnectionConfig } from './types/monitoring';
import { apiService } from './services/api';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a1929',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  const handleConnect = async (config: ConnectionConfig) => {
    try {
      setError(null);
      await apiService.connect(config);
      setIsConnected(true);
      
      // Start monitoring
      const data = await apiService.getMonitoringData();
      setMonitoringData(data);
      
      // Set up periodic updates
      const interval = setInterval(async () => {
        try {
          const newData = await apiService.getMonitoringData();
          setMonitoringData(newData);
        } catch (err) {
          console.error('Failed to update monitoring data:', err);
          setError('Failed to update monitoring data');
        }
      }, 5000); // Update every 5 seconds
      
      setUpdateInterval(interval);
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Connection failed. Please check your credentials and try again.');
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
      await apiService.disconnect();
      setIsConnected(false);
      setMonitoringData(undefined);
      setError(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError('Failed to disconnect. Please try again.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (isConnected) {
        apiService.disconnect();
      }
    };
  }, [updateInterval, isConnected]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Dashboard
        monitoringData={monitoringData}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        error={error}
      />
    </ThemeProvider>
  );
}

export default App;
