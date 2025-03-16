import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { ConnectionConfig, OS } from '../types/monitoring';

interface ConnectionFormProps {
  onConnect: (config: ConnectionConfig) => void;
  onDisconnect?: () => void;
  isConnected: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, onDisconnect, isConnected }) => {
  const [config, setConfig] = useState<ConnectionConfig>({
    host: '',
    port: 22,
    username: '',
    password: '',
    os: 'linux',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(config);
  };

  const handleTextChange = (field: keyof ConnectionConfig) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleOSChange = (e: SelectChangeEvent<OS>) => {
    setConfig((prev) => ({
      ...prev,
      os: e.target.value as OS,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Connect to Remote System
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Host"
            value={config.host}
            onChange={handleTextChange('host')}
            required
            disabled={isConnected}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Port"
            type="number"
            value={config.port}
            onChange={handleTextChange('port')}
            required
            disabled={isConnected}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>OS</InputLabel>
            <Select
              value={config.os}
              label="OS"
              onChange={handleOSChange}
              disabled={isConnected}
            >
              <MenuItem value="linux">Linux</MenuItem>
              <MenuItem value="windows">Windows</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Username"
            value={config.username}
            onChange={handleTextChange('username')}
            required
            disabled={isConnected}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={config.password}
            onChange={handleTextChange('password')}
            required
            disabled={isConnected}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color={isConnected ? "error" : "primary"}
            fullWidth
            size="large"
            onClick={isConnected ? onDisconnect : undefined}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConnectionForm; 