// src/components/polls/Polls.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  RadioGroup, 
  Radio, 
  FormControlLabel, 
  LinearProgress, 
  Divider, 
  Grid, 
  CircularProgress, 
  Alert, 
  Tabs, 
  Tab,
  Chip
} from '@mui/material';
import {
  Poll as PollIcon,
  HowToVote as VoteIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { getEventPolls, votePoll } from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`poll-tabpanel-${index}`}
      aria-labelledby={`poll-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Polls = () => {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [votingStates, setVotingStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    // Join event room
    newSocket.emit('join-event', eventId);

    // Listen for poll updates
    newSocket.on('poll-updated', () => {
      fetchPolls();
    });

    newSocket.on('poll-closed', () => {
      fetchPolls();
    });

    newSocket.on('new-poll', () => {
      fetchPolls();
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [eventId]);

  useEffect(() => {
    fetchPolls();
  }, [eventId]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await getEventPolls(eventId);
      setPolls(response.polls || []);
      
      // Initialize selected options state
      const initialSelections = {};
      response.polls.forEach(poll => {
        if (poll.voters.includes(user.id)) {
          // Find which option was selected
          poll.options.forEach((option, index) => {
            if (option.voters && option.voters.includes(user.id)) {
              initialSelections[poll._id] = index;
            }
          });
        }
      });
      setSelectedOptions(initialSelections);
    } catch (error) {
      console.error('Error fetching polls:', error);
      setError('Failed to load polls. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (pollId, optionIndex) => {
    setSelectedOptions(prev => ({
      ...prev,
      [pollId]: optionIndex
    }));
  };

  const handleVote = async (pollId) => {
    const optionIndex = selectedOptions[pollId];
    
    if (optionIndex === undefined) {
      return;
    }
    
    try {
      setVotingStates(prev => ({ ...prev, [pollId]: true }));
      await votePoll(pollId, optionIndex);
      
      // No need to fetchPolls - it will be triggered by socket
    } catch (error) {
      console.error('Error voting on poll:', error);
      setError('Failed to submit your vote. Please try again.');
    } finally {
      setVotingStates(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Helper to get total votes for a poll
  const getTotalVotes = (poll) => {
    return poll.options.reduce((sum, option) => sum + option.votes, 0);
  };

  // Filter active and closed polls
  const activePolls = polls.filter(poll => poll.isActive);
  const closedPolls = polls.filter(poll => !poll.isActive);

  // Check if user has voted on a poll
  const hasVoted = (poll) => {
    return poll.voters.includes(user.id);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Polls
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Vote on polls and see real-time results
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {polls.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <PollIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Polls Available
          </Typography>
          <Typography variant="body1" color="textSecondary">
            There are no polls for this event yet.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab 
              label={`Active Polls (${activePolls.length})`} 
              icon={<VoteIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Closed Polls (${closedPolls.length})`} 
              icon={<CheckIcon />} 
              iconPosition="start" 
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {activePolls.length === 0 ? (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                No active polls at the moment.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {activePolls.map(poll => (
                  <Grid item xs={12} md={6} key={poll._id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {poll.question}
                        </Typography>
                        
                        <Box mt={2}>
                          {hasVoted(poll) ? (
                            // Show results if user has voted
                            <Box>
                              <Typography variant="subtitle2" gutterBottom color="primary">
                                Results (Total votes: {getTotalVotes(poll)})
                              </Typography>
                              {poll.options.map((option, index) => {
                                const percentage = getTotalVotes(poll) > 0 
                                  ? Math.round((option.votes / getTotalVotes(poll)) * 100) 
                                  : 0;
                                
                                return (
                                  <Box key={index} mb={2}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                      <Typography variant="body2">
                                        {option.text}
                                        {selectedOptions[poll._id] === index && (
                                          <Typography 
                                            component="span" 
                                            color="primary" 
                                            sx={{ ml: 1, fontWeight: 'bold' }}
                                          >
                                            (Your vote)
                                          </Typography>
                                        )}
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {percentage}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={percentage} 
                                      sx={{ 
                                        height: 8, 
                                        borderRadius: 5,
                                        backgroundColor: selectedOptions[poll._id] === index 
                                          ? 'rgba(63, 81, 181, 0.2)' 
                                          : undefined,
                                      }} 
                                    />
                                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                      {option.votes} vote{option.votes !== 1 ? 's' : ''}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          ) : (
                            // Show voting form if user hasn't voted
                            <Box>
                              <RadioGroup
                                value={selectedOptions[poll._id] !== undefined ? selectedOptions[poll._id] : ''}
                                onChange={(e) => handleOptionSelect(poll._id, parseInt(e.target.value))}
                              >
                                {poll.options.map((option, index) => (
                                  <FormControlLabel
                                    key={index}
                                    value={index}
                                    control={<Radio />}
                                    label={option.text}
                                    disabled={votingStates[poll._id]}
                                  />
                                ))}
                              </RadioGroup>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                      
                      {!hasVoted(poll) && (
                        <CardActions>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => handleVote(poll._id)}
                            disabled={selectedOptions[poll._id] === undefined || votingStates[poll._id]}
                            startIcon={votingStates[poll._id] ? <CircularProgress size={20} /> : null}
                          >
                            {votingStates[poll._id] ? 'Submitting...' : 'Submit Vote'}
                          </Button>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {closedPolls.length === 0 ? (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                No closed polls yet.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {closedPolls.map(poll => (
                  <Grid item xs={12} md={6} key={poll._id}>
                    <Card variant="outlined" sx={{ opacity: 0.8 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" gutterBottom>
                            {poll.question}
                          </Typography>
                          <Chip 
                            label="Closed" 
                            size="small" 
                            color="default"
                          />
                        </Box>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box mt={2}>
                          <Typography variant="subtitle2" gutterBottom color="textSecondary">
                            Final Results (Total votes: {getTotalVotes(poll)})
                          </Typography>
                          {poll.options.map((option, index) => {
                            const percentage = getTotalVotes(poll) > 0 
                              ? Math.round((option.votes / getTotalVotes(poll)) * 100) 
                              : 0;
                            
                            // Find winner(s)
                            const maxVotes = Math.max(...poll.options.map(o => o.votes));
                            const isWinner = option.votes === maxVotes && option.votes > 0;
                            
                            return (
                              <Box key={index} mb={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                  <Typography variant="body2">
                                    {option.text}
                                    {hasVoted(poll) && selectedOptions[poll._id] === index && (
                                      <Typography 
                                        component="span" 
                                        color="primary" 
                                        sx={{ ml: 1 }}
                                      >
                                        (Your vote)
                                      </Typography>
                                    )}
                                    {isWinner && (
                                      <Typography 
                                        component="span" 
                                        color="success.main" 
                                        sx={{ ml: 1, fontWeight: 'bold' }}
                                      >
                                        (Winner)
                                      </Typography>
                                    )}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={isWinner ? 'bold' : 'normal'}>
                                    {percentage}%
                                  </Typography>
                                </Box>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={percentage} 
                                  sx={{ 
                                    height: 8, 
                                    borderRadius: 5,
                                    backgroundColor: selectedOptions[poll._id] === index 
                                      ? 'rgba(63, 81, 181, 0.2)' 
                                      : undefined,
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: isWinner ? 'success.main' : undefined
                                    }
                                  }} 
                                />
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                  {option.votes} vote{option.votes !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                        
                        {poll.closedAt && (
                          <Typography variant="caption" color="textSecondary" display="block" mt={2}>
                            Poll closed on {new Date(poll.closedAt).toLocaleString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Paper>
      )}
    </Container>
  );
};

export default Polls;