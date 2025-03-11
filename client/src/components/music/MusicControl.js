// src/components/music/MusicControl.js
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
  Alert,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  ThumbUp as ThumbUpIcon,
  MusicNote as MusicNoteIcon
} from '@mui/icons-material';
import { searchTracks, getVotingQueue, addTrackToQueue, voteForTrack } from '../../utils/api';
import { io } from 'socket.io-client';

const MusicControl = () => {
  const { eventId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [queue, setQueue] = useState({ tracks: [], currentTrack: null });
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    // Join event room
    newSocket.emit('join-event', eventId);

    // Listen for queue updates
    newSocket.on('queue-updated', () => {
      fetchQueue();
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [eventId]);

  useEffect(() => {
    fetchQueue();
  }, [eventId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await getVotingQueue(eventId);
      setQueue(response.queue);
    } catch (error) {
      console.error('Error fetching queue:', error);
      setError('Failed to load music queue. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      const response = await searchTracks(searchQuery);
      setSearchResults(response.tracks || []);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setError('Failed to search tracks. Please try again later.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddToQueue = async (track) => {
    try {
      await addTrackToQueue(eventId, {
        trackId: track.id,
        name: track.name,
        artists: track.artists,
        imageUrl: track.imageUrl
      });
      
      // Queue will be updated via socket
    } catch (error) {
      console.error('Error adding track to queue:', error);
      setError('Failed to add track to queue. Please try again later.');
    }
  };

  const handleVote = async (trackId) => {
    try {
      await voteForTrack(eventId, trackId);
      
      // Queue will be updated via socket
    } catch (error) {
      console.error('Error voting for track:', error);
      setError('Failed to vote for track. Please try again later.');
    }
  };

  // Format duration from milliseconds to mm:ss
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Music Control
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Search for songs and vote on what plays next.
        </Typography>
      </Box>

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
        {queue.currentTrack ? (
          <Box display="flex" alignItems="center">
            <Avatar
              src={queue.currentTrack.imageUrl}
              variant="rounded"
              sx={{ width: 80, height: 80, mr: 2 }}
            >
              <MusicNoteIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{queue.currentTrack.name}</Typography>
              <Typography variant="subtitle1" color="textSecondary">
                {queue.currentTrack.artists}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No track is currently playing.
          </Typography>
        )}
      </Paper>

      <Grid container spacing={4}>
        {/* Track Search */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                startIcon={searching ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ ml: 1 }}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </Box>

            {/* Search Results */}
            {searching ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
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
            )}
          </Paper>
        </Grid>

        {/* Voting Queue */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Up Next
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : queue.tracks && queue.tracks.length > 0 ? (
              <List>
                {[...queue.tracks]
                  .sort((a, b) => b.votes - a.votes)
                  .map((track) => (
                    <React.Fragment key={track.trackId}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            color="primary"
                            onClick={() => handleVote(track.trackId)}
                          >
                            <ThumbUpIcon />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              {track.votes}
                            </Typography>
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
                          secondary={track.artists}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
              </List>
            ) : (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                No tracks in the queue. Search and add some tracks!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MusicControl;