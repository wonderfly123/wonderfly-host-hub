// client/src/components/music/MusicControl.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  IconButton, 
  Grid, 
  Divider, 
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  MusicNote as MusicNoteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
  SkipPrevious as PreviousIcon,
  LibraryMusic as LibraryMusicIcon,
  PlaylistPlay as PlaylistPlayIcon,
  DevicesOther as DevicesIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import api from '../../utils/api';
import { io } from 'socket.io-client';

const MusicControl = () => {
  const { eventId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [votingQueue, setVotingQueue] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [socket, setSocket] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState('');
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Memoize fetch functions to avoid dependency issues in useEffect
  const fetchDevices = useCallback(async () => {
    try {
      setLoadingDevices(true);
      const deviceList = await api.getSpotifyDevices(eventId);
      console.log('Devices:', deviceList);
      setDevices(deviceList || []);
      
      // Set active device if available
      if (deviceList && deviceList.length > 0) {
        const activeOne = deviceList.find(d => d.is_active);
        if (activeOne) {
          setActiveDevice(activeOne.id);
          
          // Update preferred device on server
          try {
            await api.selectPlaybackDevice(eventId, activeOne.id);
          } catch (err) {
            console.error('Failed to update preferred device:', err);
          }
        } else if (!activeDevice) {
          setActiveDevice(deviceList[0].id);
        }
      }
      
      setLoadingDevices(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoadingDevices(false);
      setError({
        severity: 'error',
        message: 'Failed to fetch devices. Make sure Spotify is connected.'
      });
    }
  }, [eventId, activeDevice]);

  const fetchCurrentPlayback = useCallback(async () => {
    try {
      const playbackState = await api.getCurrentPlayback(eventId);
      if (playbackState) {
        setCurrentTrack(playbackState.item);
        setIsPlaying(playbackState.is_playing);
        
        // Update active device if present in playback state
        if (playbackState.device && playbackState.device.id) {
          setActiveDevice(playbackState.device.id);
        }
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error fetching current playback:', error);
    }
  }, [eventId]);

  // Fetch voting queue
  const fetchVotingQueue = useCallback(async () => {
    try {
      const queueResponse = await api.getVotingQueue(eventId);
      setVotingQueue(queueResponse.tracks || []);
    } catch (error) {
      console.error('Error fetching voting queue:', error);
    }
  }, [eventId]);

  // Fetch playlists
  const fetchPlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);
      const userPlaylists = await api.getUserPlaylists(eventId);
      setPlaylists(userPlaylists || []);
      setLoadingPlaylists(false);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setLoadingPlaylists(false);
    }
  }, [eventId]);

  // Fetch playlist tracks
  const fetchPlaylistTracks = useCallback(async (playlistId) => {
    try {
      setLoadingPlaylistTracks(true);
      const tracks = await api.getPlaylistTracks(eventId, playlistId);
      setPlaylistTracks(tracks || []);
      setLoadingPlaylistTracks(false);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      setLoadingPlaylistTracks(false);
    }
  }, [eventId]);

  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:5001', {
      auth: { token: localStorage.getItem('token') }
    });

    // Join event room
    newSocket.emit('join-event', eventId);

    // Listen for queue updates
    newSocket.on('queue-updated', () => {
      fetchVotingQueue();
    });

    // Listen for playback state updates
    newSocket.on('playback-updated', () => {
      fetchCurrentPlayback();
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [eventId, fetchVotingQueue, fetchCurrentPlayback]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch available devices
        await fetchDevices();
        
        // Fetch current playback
        await fetchCurrentPlayback();

        // Fetch voting queue
        await fetchVotingQueue();

        setLoading(false);
      } catch (err) {
        setError('Spotify not connected or an error occurred');
        setLoading(false);
      }
    };

    fetchInitialData();

    // Set up interval to refresh current playback
    const playbackInterval = setInterval(() => {
      fetchCurrentPlayback();
      // Periodically refresh devices (but less frequently)
      if (Math.random() < 0.3) { // ~30% chance each time
        fetchDevices();
      }
    }, 10000); // every 10 seconds

    return () => clearInterval(playbackInterval);
  }, [fetchCurrentPlayback, fetchVotingQueue, fetchDevices]);

  // Fetch playlists when the playlists tab is selected
  useEffect(() => {
    if (tabValue === 1 && playlists.length === 0) {
      fetchPlaylists();
    }
  }, [tabValue, playlists.length, fetchPlaylists]);

  // Fetch playlist tracks when a playlist is selected
  useEffect(() => {
    if (selectedPlaylist) {
      fetchPlaylistTracks(selectedPlaylist.id);
    }
  }, [selectedPlaylist, fetchPlaylistTracks]);

  // Handle device change
  const handleDeviceChange = async (event) => {
    const deviceId = event.target.value;
    setActiveDevice(deviceId);
    
    // Update preferred device on server
    try {
      await api.selectPlaybackDevice(eventId, deviceId);
      
      // If track is currently playing, transfer playback to the new device
      if (currentTrack && isPlaying) {
        await api.playbackControl(eventId, 'play', null, null, deviceId);
        setTimeout(fetchCurrentPlayback, 500);
      }
    } catch (error) {
      console.error('Error selecting device:', error);
      setError({
        severity: 'error',
        message: 'Failed to change playback device'
      });
    }
  };

  // Search tracks
  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      const tracks = await api.searchTracks(eventId, searchQuery);
      setSearchResults(tracks || []);
      if (tracks.length === 0) {
        setError('No tracks found matching your search.');
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      setError('Failed to search tracks. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Add track to queue
  const handleAddToQueue = async (track) => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.addTrackToQueue(eventId, track.uri, activeDevice);
      
      // Optional: Refresh queue
      fetchVotingQueue();
      
      // Success message
      setError({ severity: 'success', message: 'Track added to queue successfully' });
      
      // After 3 seconds, clear the success message
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error adding track to queue:', error);
      setError({ severity: 'error', message: 'Failed to add track to queue' });
    }
  };

  // Vote for track
  const handleVoteForTrack = async (trackId) => {
    try {
      await api.voteForTrack(eventId, trackId);
      // Refresh queue after voting
      fetchVotingQueue();
    } catch (error) {
      console.error('Error voting for track:', error);
      setError({ severity: 'error', message: 'Failed to vote for track' });
    }
  };

  // Play/Pause control
  const handlePlayPause = async () => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.playbackControl(eventId, isPlaying ? 'pause' : 'play', null, null, activeDevice);
      setIsPlaying(!isPlaying);
      fetchCurrentPlayback(); // Refresh to confirm new state
    } catch (error) {
      console.error('Error controlling playback:', error);
      setError({ severity: 'error', message: 'Failed to control playback' });
    }
  };

  // Next track
  const handleNextTrack = async () => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.playbackControl(eventId, 'next', null, null, activeDevice);
      // Fetch updated playback state after a short delay
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error('Error skipping to next track:', error);
      setError({ severity: 'error', message: 'Failed to skip to next track' });
    }
  };

  // Previous track
  const handlePreviousTrack = async () => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.playbackControl(eventId, 'previous', null, null, activeDevice);
      // Fetch updated playback state after a short delay
      setTimeout(fetchCurrentPlayback, 500);
    } catch (error) {
      console.error('Error going to previous track:', error);
      setError({ severity: 'error', message: 'Failed to go to previous track' });
    }
  };

  // Play a track directly
  const handlePlayTrack = async (track) => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.playbackControl(eventId, 'play', null, track.uri, activeDevice);
      fetchCurrentPlayback(); // Refresh to confirm new state
    } catch (error) {
      console.error('Error playing track:', error);
      setError({ severity: 'error', message: 'Failed to play track' });
    }
  };

  // Play a playlist
  const handlePlayPlaylist = async (playlist) => {
    try {
      if (!activeDevice) {
        setError({ severity: 'error', message: 'No active device selected' });
        return;
      }
      
      await api.playbackControl(eventId, 'play', `spotify:playlist:${playlist.id}`, null, activeDevice);
      fetchCurrentPlayback(); // Refresh to confirm new state
    } catch (error) {
      console.error('Error playing playlist:', error);
      setError({ severity: 'error', message: 'Failed to play playlist' });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Render loading state
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Main render
  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Music Control
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Search for songs, add to queue, and vote on tracks
        </Typography>

        {error && (
          <Alert severity={error.severity || "error"} sx={{ mb: 3 }}>
            {error.message || error}
          </Alert>
        )}

        {/* Device Selector */}
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center">
            <DevicesIcon sx={{ mr: 1 }} color="primary" />
            <FormControl sx={{ minWidth: 200, flexGrow: 1 }} size="small">
              <InputLabel id="device-select-label">Playback Device</InputLabel>
              <Select
                labelId="device-select-label"
                id="device-select"
                value={activeDevice || ''}
                label="Playback Device"
                onChange={handleDeviceChange}
                disabled={loadingDevices || devices.length === 0}
              >
                {devices.length === 0 && (
                  <MenuItem value="" disabled>
                    No devices available
                  </MenuItem>
                )}
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name} {device.is_active ? '(Active)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              sx={{ ml: 2 }} 
              variant="outlined"
              onClick={fetchDevices}
              disabled={loadingDevices}
              startIcon={loadingDevices ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {loadingDevices ? 'Refreshing...' : 'Refresh Devices'}
            </Button>
          </Box>
        </Paper>

        {/* Current Track with Playback Controls */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Now Playing
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" flexGrow={1}>
              <Avatar
                src={currentTrack?.album?.images?.[0]?.url}
                variant="rounded"
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                <MusicNoteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{currentTrack?.name || 'No track playing'}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {currentTrack?.artists?.map(artist => artist.name).join(', ')}
                </Typography>
              </Box>
            </Box>
            {/* Playback Controls */}
            <Box>
              <IconButton 
                onClick={handlePreviousTrack} 
                color="primary"
                disabled={!activeDevice}
              >
                <PreviousIcon />
              </IconButton>
              <IconButton 
                onClick={handlePlayPause} 
                color="primary" 
                sx={{ mx: 1 }}
                disabled={!activeDevice}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              <IconButton 
                onClick={handleNextTrack} 
                color="primary"
                disabled={!activeDevice}
              >
                <NextIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Tabs: Search & Queue / Playlists */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="music control tabs">
            <Tab icon={<SearchIcon />} label="Search & Queue" />
            <Tab icon={<LibraryMusicIcon />} label="Playlists" />
          </Tabs>
        </Box>

        {/* Tab 1: Search & Queue */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Track Search */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Search Tracks
                </Typography>
                <Box display="flex" mb={2}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search for a song or artist"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchTracks()}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearchTracks}
                    disabled={searching || !searchQuery.trim()}
                    startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
                    sx={{ ml: 1 }}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </Box>

                {/* Search Results */}
                <List>
                  {searchResults.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                      {searchQuery.trim() && !searching ? 'No results found.' : 'Search for tracks to add to the queue.'}
                    </Typography>
                  ) : (
                    searchResults.map((track) => (
                      <React.Fragment key={track.id}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                color="primary"
                                onClick={() => handlePlayTrack(track)}
                                sx={{ mr: 1 }}
                                disabled={!activeDevice}
                              >
                                <PlayIcon />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                color="primary"
                                onClick={() => handleAddToQueue(track)}
                                disabled={!activeDevice}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar 
                              variant="rounded" 
                              src={track.imageUrl}
                            >
                              <MusicNoteIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={track.name}
                            secondary={
                              <>
                                {track.artists}
                                <Typography 
                                  component="span" 
                                  variant="body2" 
                                  color="textSecondary"
                                  sx={{ ml: 1 }}
                                >
                                  {formatDuration(track.duration)}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Voting Queue */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Track Queue
                </Typography>
                <List>
                  {votingQueue.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                      No tracks in the queue.
                    </Typography>
                  ) : (
                    votingQueue.map((track) => (
                      <React.Fragment key={track.trackId}>
                        <ListItem
                          secondaryAction={
                            <Box display="flex" alignItems="center">
                              <Typography variant="body2" sx={{ mr: 1 }}>
                                {track.votes} votes
                              </Typography>
                              <IconButton 
                                edge="end" 
                                color="primary"
                                onClick={() => handleVoteForTrack(track.trackId)}
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar 
                              variant="rounded" 
                              src={track.imageUrl}
                            >
                              <MusicNoteIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={track.name}
                            secondary={track.artists}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Playlists */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {/* Playlists List */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Your Playlists
                </Typography>
                {loadingPlaylists ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {playlists.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                        No playlists found.
                      </Typography>
                    ) : (
                      <List>
                        {playlists.map((playlist) => (
                          <React.Fragment key={playlist.id}>
                            <ListItem
                              button
                              onClick={() => setSelectedPlaylist(playlist)}
                              selected={selectedPlaylist?.id === playlist.id}
                              secondaryAction={
                                <IconButton 
                                  edge="end" 
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayPlaylist(playlist);
                                  }}
                                  disabled={!activeDevice}
                                >
                                  <PlayIcon />
                                </IconButton>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  variant="rounded" 
                                  src={playlist.imageUrl}
                                >
                                  <PlaylistPlayIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={playlist.name}
                                secondary={`${playlist.tracks} tracks`}
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </>
                )}
              </Paper>
            </Grid>

            {/* Playlist Tracks */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedPlaylist ? `Tracks in "${selectedPlaylist.name}"` : 'Select a Playlist'}
                </Typography>
                {loadingPlaylistTracks ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {!selectedPlaylist ? (
                      <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                        Select a playlist to view tracks.
                      </Typography>
                    ) : playlistTracks.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>
                        No tracks in this playlist.
                      </Typography>
                    ) : (
                      <List>
                        {playlistTracks.map((track) => (
                          <React.Fragment key={track.id}>
                            <ListItem
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    color="primary"
                                    onClick={() => handlePlayTrack(track)}
                                    sx={{ mr: 1 }}
                                    disabled={!activeDevice}
                                  >
                                    <PlayIcon />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    color="primary"
                                    onClick={() => handleAddToQueue(track)}
                                    disabled={!activeDevice}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <ListItemAvatar>
                                <Avatar 
                                  variant="rounded" 
                                  src={track.imageUrl}
                                >
                                  <MusicNoteIcon />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={track.name}
                                secondary={
                                  <>
                                    {track.artists}
                                    <Typography 
                                      component="span" 
                                      variant="body2" 
                                      color="textSecondary"
                                      sx={{ ml: 1 }}
                                    >
                                      {formatDuration(track.duration)}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default MusicControl;