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
  const [isInitialized, setIsInitialized] = useState(false);

  // Check initial connection state
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await apiService.ensureConnected();
        if (apiService.isCurrentlyConnected()) {
          setIsConnected(true);
          const data = await apiService.getMonitoringData();
          setMonitoringData(data);
          startMonitoring();
        }
      } catch (err) {
        console.error('Initial connection check failed:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeConnection();

    // Cleanup function
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  const startMonitoring = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    // Fetch initial data immediately
    apiService.getMonitoringData()
      .then(newData => {
        setMonitoringData(newData);
        setError(null);
        setIsConnected(true);
      })
      .catch(handleError);

    // Then set up the interval for subsequent updates
    const interval = setInterval(async () => {
      if (!isInitialized) return;

      try {
        const newData = await apiService.getMonitoringData();
        setMonitoringData(newData);
        setError(null);
        setIsConnected(true);
      } catch (err) {
        handleError(err);
      }
    }, 5000); // Exactly 5 seconds

    setUpdateInterval(interval);
  };

  const handleError = (err: any) => {
    console.error('Failed to update monitoring data:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to update monitoring data';
    setError(errorMessage);
    
    if (errorMessage.includes('Connection lost') || errorMessage.includes('Not connected')) {
      setIsConnected(false);
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
    }
  };

  const handleConnect = async (config: ConnectionConfig) => {
    try {
      setError(null);
      await apiService.connect(config);
      setIsConnected(true);
      
      // Start monitoring
      const data = await apiService.getMonitoringData();
      setMonitoringData(data);
      startMonitoring();
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Connection failed. Please check your credentials and try again.');
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
      setError(err instanceof Error ? err.message : 'Failed to disconnect. Please try again.');
    }
  };

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
