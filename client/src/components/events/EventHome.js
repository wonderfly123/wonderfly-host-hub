// src/components/events/EventHome.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  MusicNote as MusicIcon,
  Room as LocationIcon,
  Restaurant as OrderIcon,
  Event as EventIcon,
  Timeline as TimelineIcon,
  Poll as PollIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { getEventById, getEventTimeline, getUserNotifications } from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';

const EventHome = () => {
  const { eventId } = useParams();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const eventResponse = await getEventById(eventId);
        setEvent(eventResponse.event);
        
        // Get upcoming timeline items
        const timelineResponse = await getEventTimeline(eventId);
        setTimeline(timelineResponse.timelineItems || []);
        
        // Get notifications
        const notificationsResponse = await getUserNotifications();
        setNotifications(notificationsResponse.notifications || []);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Get upcoming items (next 3)
  const upcomingItems = timeline
    .filter(item => new Date(item.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
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
      {/* Event Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, mt: 4 }}>
        <Box display="flex" alignItems="center" flexWrap="wrap">
          <Box flexGrow={1}>
            <Typography variant="h4" component="h1" gutterBottom>
              {event?.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {formatDate(event?.date)}
            </Typography>
            {event?.venue?.name && (
              <Box display="flex" alignItems="center" mt={1}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {event.venue.name}{event.venue.address ? ` - ${event.venue.address}` : ''}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <EventIcon sx={{ fontSize: 40 }} />
          </Avatar>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body1">
          {event?.description}
        </Typography>
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MusicIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Music
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to={`/event/${eventId}/music`}
                size="small"
              >
                Control Music
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <OrderIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Order
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to={`/event/${eventId}/order`}
                size="small"
              >
                Place Order
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TimelineIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Schedule
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to={`/event/${eventId}/timeline`}
                size="small"
              >
                View Schedule
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PollIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Polls
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                component={Link} 
                to={`/event/${eventId}/polls`}
                size="small"
              >
                Join Polls
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Timeline */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Coming Up Next
            </Typography>
            
            {upcomingItems.length > 0 ? (
              <Box>
                {upcomingItems.map((item) => (
                  <Box key={item._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Box display="flex" alignItems="center">
                      <ScheduleIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="bold">
                        {formatTime(item.startTime)}
                      </Typography>
                    </Box>
                    <Typography variant="h6">{item.title}</Typography>
                    {item.location && (
                      <Typography variant="body2" color="textSecondary">
                        Location: {item.location}
                      </Typography>
                    )}
                    {item.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                ))}
                
                <Box textAlign="right" mt={2}>
                  <Button 
                    color="primary" 
                    component={Link} 
                    to={`/event/${eventId}/timeline`}
                  >
                    View Full Schedule
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                No upcoming activities scheduled.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Announcements
            </Typography>
            
            {notifications.length > 0 ? (
              <Box>
                {notifications.map((notification) => (
                  <Box key={notification._id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                    <Typography variant="h6">{notification.title}</Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body1">
                      {notification.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
                No announcements yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default EventHome;