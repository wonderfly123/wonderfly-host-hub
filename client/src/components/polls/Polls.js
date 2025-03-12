// src/components/polls/Polls.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  Room as LocationIcon
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
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [votingStates, setVotingStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [socket, setSocket] = useState(null);
  const [highlightedPollId, setHighlightedPollId] = useState(null);

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
    
    newSocket.on('activity-selected', (data) => {
      // You could handle this with an announcement or highlighting the selected activity
      console.log('Activity selected:', data);
    });

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
  
  // Check URL for highlighted poll from notification
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const pollId = queryParams.get('pollId');
    
    if (pollId) {
      setHighlightedPollId(pollId);
      setTabValue(0); // Switch to active polls tab
      
      // Auto-scroll to this poll
      setTimeout(() => {
        const element = document.getElementById(`poll-${pollId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedPollId(null);
      }, 5000);
    }
  }, [location]);

  useEffect(() => {
    fetchPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  
  // Special rendering for activity polls
  const renderPoll = (poll) => {
    const isHighlighted = poll._id === highlightedPollId;
    const isActivityPoll = poll.type === 'activity';
    
    return (
      <Card 
        id={`poll-${poll._id}`}
        variant="outlined" 
        sx={{ 
          mb: 3,
          borderColor: isHighlighted ? 'primary.main' : 'divider',
          boxShadow: isHighlighted ? 3 : 0,
          transition: 'all 0.3s ease',
          animation: isHighlighted ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(63, 81, 181, 0.7)' },
            '70%': { boxShadow: '0 0 0 10px rgba(63, 81, 181, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(63, 81, 181, 0)' },
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">
              {poll.question}
            </Typography>
            {isActivityPoll && (
              <Chip 
                label="Activity Vote" 
                color="primary" 
                size="small" 
                icon={<VoteIcon />}
              />
            )}
          </Box>
          
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
                  
                  // Get activity details if available
                  const activityDetails = 
                    isActivityPoll && 
                    poll.activityOptions && 
                    poll.activityOptions[index]?.details;
                  
                  return (
                    <Box key={index} mb={2}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="body1" fontWeight={selectedOptions[poll._id] === index ? 'bold' : 'normal'}>
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
                      
                      {/* Show activity details if available */}
                      {activityDetails && (
                        <Box mt={1} ml={2} p={1} bgcolor="rgba(0,0,0,0.02)" borderRadius={1}>
                          {activityDetails.time && (
                            <Box display="flex" alignItems="center">
                              <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {activityDetails.time}
                              </Typography>
                            </Box>
                          )}
                          {activityDetails.location && (
                            <Box display="flex" alignItems="center">
                              <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {activityDetails.location}
                              </Typography>
                            </Box>
                          )}
                          {activityDetails.description && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {activityDetails.description}
                            </Typography>
                          )}
                        </Box>
                      )}
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
                  {poll.options.map((option, index) => {
                    // Get activity details if available
                    const activityDetails = 
                      isActivityPoll && 
                      poll.activityOptions && 
                      poll.activityOptions[index]?.details;
                    
                    return (
                      <Box 
                        key={index} 
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          border: '1px solid #eee', 
                          borderRadius: 1,
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' } 
                        }}
                      >
                        <FormControlLabel
                          value={index}
                          control={<Radio />}
                          label={option.text}
                          disabled={votingStates[poll._id]}
                        />
                        
                        {/* Show activity details if available */}
                        {activityDetails && (
                          <Box ml={4} mt={1}>
                            {activityDetails.time && (
                              <Box display="flex" alignItems="center">
                                <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {activityDetails.time}
                                </Typography>
                              </Box>
                            )}
                            {activityDetails.location && (
                              <Box display="flex" alignItems="center">
                                <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {activityDetails.location}
                                </Typography>
                              </Box>
                            )}
                            {activityDetails.description && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {activityDetails.description}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </RadioGroup>
              </Box>
            )}
          </Box>
          
          {poll.autoCloseAt && poll.isActive && (
            <Typography variant="caption" color="textSecondary" display="block" mt={2}>
              Voting closes at {new Date(poll.autoCloseAt).toLocaleTimeString()}
            </Typography>
          )}
        </CardContent>
        
        {!hasVoted(poll) && poll.isActive && (
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
    );
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
                <Grid item xs={12}>
                  {activePolls.map(poll => (
                    <React.Fragment key={poll._id}>
                      {renderPoll(poll)}
                    </React.Fragment>
                  ))}
                </Grid>
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
                <Grid item xs={12}>
                  {closedPolls.map(poll => (
                    <React.Fragment key={poll._id}>
                      {renderPoll(poll)}
                    </React.Fragment>
                  ))}
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Paper>
      )}
    </Container>
  );
};

export default Polls;