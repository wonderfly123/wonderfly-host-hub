// src/components/timeline/Timeline.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getEventTimeline, getEventById } from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';

const Timeline = () => {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [timelineItems, setTimelineItems] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [timelineResponse, eventResponse] = await Promise.all([
          getEventTimeline(eventId),
          getEventById(eventId)
        ]);
        
        // Sort timeline items by start time
        const sortedItems = (timelineResponse.timelineItems || [])
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        setTimelineItems(sortedItems);
        setEvent(eventResponse.event);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        setError('Failed to load timeline. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  // Group timeline items by date
  const groupedItems = timelineItems.reduce((groups, item) => {
    const date = new Date(item.startTime).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if an item is currently happening
  const isCurrentlyHappening = (item) => {
    const now = new Date();
    const startTime = new Date(item.startTime);
    const endTime = item.endTime ? new Date(item.endTime) : null;
    
    if (endTime) {
      return now >= startTime && now <= endTime;
    }
    
    // If no end time, consider it current for 1 hour after start
    return now >= startTime && now <= new Date(startTime.getTime() + 60 * 60 * 1000);
  };

  // Check if an item is in the past
  const isPast = (item) => {
    const now = new Date();
    const endTime = item.endTime ? new Date(item.endTime) : new Date(new Date(item.startTime).getTime() + 60 * 60 * 1000);
    return now > endTime;
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

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Event Schedule
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          {event?.name} - Timeline of activities
        </Typography>
      </Box>

      {timelineItems.length === 0 ? (
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Schedule Items
          </Typography>
          <Typography variant="body1" color="textSecondary">
            There are no schedule items for this event yet.
          </Typography>
        </Paper>
      ) : (
        Object.keys(groupedItems).map((date) => (
          <Box key={date} mb={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom color="primary">
                {formatDate(date)}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {groupedItems[date].map((item) => {
                  const isNow = isCurrentlyHappening(item);
                  const isPastItem = isPast(item);
                  
                  return (
                    <Grid item xs={12} key={item._id}>
                      <Card 
                        variant={isNow ? "outlined" : "elevation"}
                        sx={{
                          borderColor: isNow ? 'primary.main' : undefined,
                          borderWidth: isNow ? 2 : undefined,
                          opacity: isPastItem ? 0.7 : 1,
                          backgroundColor: isNow ? 'rgba(63, 81, 181, 0.05)' : undefined
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3} md={2}>
                              <Box 
                                display="flex" 
                                flexDirection={isMobile ? "row" : "column"}
                                alignItems={isMobile ? "center" : "flex-start"}
                              >
                                <ScheduleIcon 
                                  color="primary" 
                                  sx={{ mr: isMobile ? 1 : 0, mb: isMobile ? 0 : 1 }} 
                                />
                                <Typography 
                                  variant="body1" 
                                  sx={{ fontWeight: isNow ? 'bold' : 'normal' }}
                                >
                                  {formatTime(item.startTime)}
                                </Typography>
                                {item.endTime && (
                                  <Typography 
                                    variant="body2" 
                                    color="textSecondary"
                                    sx={{ ml: isMobile ? 1 : 0 }}
                                  >
                                    to {formatTime(item.endTime)}
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                            
                            <Grid item xs={12} sm={9} md={10}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Typography variant="h6" gutterBottom>
                                  {item.title}
                                  {isNow && (
                                    <Chip 
                                      label="NOW" 
                                      color="primary" 
                                      size="small" 
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Typography>
                                {item.type && (
                                  <Chip 
                                    label={item.type.charAt(0).toUpperCase() + item.type.slice(1)} 
                                    size="small" 
                                    color={
                                      item.type === 'activity' ? 'primary' : 
                                      item.type === 'meal' ? 'secondary' : 
                                      'default'
                                    }
                                  />
                                )}
                              </Box>
                              
                              {item.location && (
                                <Box display="flex" alignItems="center" mb={1}>
                                  <LocationIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2">
                                    {item.location}
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.description && (
                                <Typography variant="body2" paragraph>
                                  {item.description}
                                </Typography>
                              )}
                              
                              {item.important && (
                                <Box 
                                  display="flex" 
                                  alignItems="center" 
                                  bgcolor="rgba(255, 193, 7, 0.1)"
                                  p={1}
                                  borderRadius={1}
                                >
                                  <InfoIcon color="warning" sx={{ mr: 1 }} />
                                  <Typography variant="body2">
                                    This is an important event, don't miss it!
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Box>
        ))
      )}
    </Container>
  );
};

export default Timeline;