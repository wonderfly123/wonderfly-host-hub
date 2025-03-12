// client/src/components/admin/AdminMusicControl.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Radio,
  CircularProgress,
  Snackbar,
  Alert,
  TextField
} from '@mui/material';
import {
  Speaker as SpeakerIcon,
  Computer as ComputerIcon,
  Smartphone as PhoneIcon,
  MusicNote as MusicIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import api from '../../utils/api';

const getDeviceIcon = (type) => {
  switch(type) {
    case 'speaker':
      return <SpeakerIcon />;
    case 'computer':
      return <ComputerIcon />;
    case 'smartphone':
      return <PhoneIcon />;
    default:
      return <MusicIcon />;
  }
};

const AdminMusicControl = () => {
  const { eventId } = useParams();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch available Spotify devices
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/music/${eventId}/devices`);
      setDevices(response.data.devices);
      setIsSpotifyConnected(true);
    } catch (err) {
      console.error('Device Fetch Error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to fetch Spotify devices'
      );
      setIsSpotifyConnected(false);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Fetch Spotify Authorization URL and initiate connection
  const handleSpotifyConnect = async () => {
    try {
      setLoading(true);
      console.log(`Attempting Spotify connection for event: ${eventId}`);
      
      // Get authorization URL
      const authUrl = await api.generateSpotifyAuthUrl(eventId);
      console.log('Spotify Auth URL:', authUrl);
      
      // Open Spotify authorization in a popup
      const width = 600;
      const height = 600;
      const left = (window.screen.width / 2) - (width / 2);
      const top = (window.screen.height / 2) - (height / 2);
      
      window.open(
        authUrl, 
        'Spotify Authorization', 
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (err) {
      console.error('Full Spotify Connection Error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to generate Spotify authorization URL'
      );
    } finally {
      setLoading(false);
    }
  };

  // Listen for Spotify authentication message
  useEffect(() => {
    const handleAuthMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'SPOTIFY_AUTH_SUCCESS') {
        // Fetch devices after successful authentication
        await fetchDevices();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [fetchDevices]);

  // Select playback device
  const handleDeviceSelect = async (deviceId) => {
    try {
      await api.post('/music/device', { 
        eventId, 
        deviceId 
      });
      setSelectedDevice(deviceId);
    } catch (error) {
      console.error('Device Selection Error:', error);
      setError(
        error.response?.data?.message || 
        'Failed to select device'
      );
    }
  };

  // Search tracks
  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const response = await api.get(`/music/${eventId}/search`, {
        params: { query: searchQuery }
      });
      setSearchResults(response.data.tracks);
    } catch (err) {
      console.error('Track Search Error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to search tracks'
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Add track to queue
  const handleAddToQueue = async (trackUri) => {
    try {
      await api.post(`/music/${eventId}/queue`, { trackUri });
      setError('Track added to queue successfully');
    } catch (err) {
      console.error('Add to Queue Error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to add track to queue'
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Music Control
        </Typography>

        {!isSpotifyConnected ? (
          <Box textAlign="center" py={4}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSpotifyConnect}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Connect Spotify'}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Available Devices */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Available Devices
              </Typography>
              <List>
                {devices.map((device) => (
                  <React.Fragment key={device.id}>
                    <ListItem 
                      secondaryAction={
                        <Radio
                          checked={selectedDevice === device.id}
                          onChange={() => handleDeviceSelect(device.id)}
                        />
                      }
                    >
                      <ListItemIcon>
                        {getDeviceIcon(device.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={device.name}
                        secondary={device.type}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Grid>

            {/* Track Search */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Search Tracks
              </Typography>
              <Box display="flex" mb={2}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Search tracks"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchTracks()}
                  InputProps={{
                    endAdornment: (
                      <Button 
                        onClick={handleSearchTracks}
                        disabled={searchLoading}
                        startIcon={<SearchIcon />}
                      >
                        {searchLoading ? 'Searching...' : 'Search'}
                      </Button>
                    )
                  }}
                />
              </Box>

              {/* Search Results */}
              <List>
                {searchResults.map((track) => (
                  <ListItem 
                    key={track.id}
                    secondaryAction={
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={() => handleAddToQueue(track.uri)}
                      >
                        Add to Queue
                      </Button>
                    }
                  >
                    <ListItemText
                      primary={track.name}
                      secondary={track.artists}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminMusicControl;