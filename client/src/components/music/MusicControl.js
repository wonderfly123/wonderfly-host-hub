// client/src/components/music/MusicControl.js
import React, { useState, useEffect } from 'react';
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
  Alert 
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  MusicNote as MusicNoteIcon 
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
  const [votingQueue, setVotingQueue] = useState([]);
  const [socket, setSocket] = useState(null);

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

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [eventId]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch current playback
        const playbackResponse = await api.getCurrentPlayback(eventId);
        setCurrentTrack(playbackResponse?.item);

        // Fetch voting queue
        await fetchVotingQueue();

        setLoading(false);
      } catch (err) {
        setError('Spotify not connected or an error occurred');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [eventId]);

  // Fetch voting queue
  const fetchVotingQueue = async () => {
    try {
      const queueResponse = await api.getVotingQueue(eventId);
      setVotingQueue(queueResponse.tracks);
    } catch (error) {
      console.error('Error fetching voting queue:', error);
    }
  };

  // Search tracks
  const handleSearchTracks = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      const tracks = await api.searchTracks(eventId, searchQuery);
      setSearchResults(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setError('Failed to search tracks');
    } finally {
      setSearching(false);
    }
  };

  // Add track to queue
  const handleAddToQueue = async (track) => {
    try {
      await api.addTrackToQueue(eventId, track.uri);
      
      // Remove added track from search results
      setSearchResults(prev => 
        prev.filter(t => t.uri !== track.uri)
      );
      
      // Optional: Show success message
      setError('Track added to queue successfully');
    } catch (error) {
      console.error('Error adding track to queue:', error);
      setError('Failed to add track to queue');
    }
  };

  // Vote for track
  const handleVoteForTrack = async (trackId) => {
    try {
      await api.voteForTrack(eventId, trackId);
    } catch (error) {
      console.error('Error voting for track:', error);
      setError('Failed to vote for track');
    }
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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Current Track */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Now Playing
          </Typography>
          {currentTrack ? (
            <Box display="flex" alignItems="center">
              <Avatar
                src={currentTrack.album?.images?.[0]?.url}
                variant="rounded"
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                <MusicNoteIcon />
              </Avatar>
              <Box>
                <Typography variant="h6">{currentTrack.name}</Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {currentTrack.artists?.map(artist => artist.name).join(', ')}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="textSecondary">
              No track is currently playing.
            </Typography>
          )}
        </Paper>

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
                    {searchQuery.trim() ? 'No results found.' : 'Search for tracks to add to the queue.'}
                  </Typography>
                ) : (
                  searchResults.map((track) => (
                    <React.Fragment key={track.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            color="primary"
                            onClick={() => handleAddToQueue(track)}
                          >
                            <AddIcon />
                          </IconButton>
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
      </Box>
    </Container>
  );
};

export default MusicControl;