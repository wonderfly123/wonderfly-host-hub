// src/components/admin/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Card, 
  CardContent, 
  CardActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Event as EventIcon, 
  MusicNote as MusicIcon, 
  Restaurant as OrderIcon,
  Timeline as TimelineIcon,
  Poll as PollIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { getEvents } from '../../utils/api';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await getEvents();
        setEvents(response.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Add this function to handle feature navigation
  const handleFeatureClick = (featurePath) => {
    // If there are no events, prompt to create one first
    if (events.length === 0) {
      navigate('/admin/events/create');
      return;
    }
    
    // Navigate to the feature for the first event
    navigate(`/admin/events/${events[0].id}${featurePath}`);
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
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
          <Box display="flex" justifyContent="center" mt={2}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Welcome, {user?.username || 'Admin'}! Manage your events and settings here.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem button component={Link} to="/admin/events/create">
                <ListItemText primary="Create New Event" />
              </ListItem>
              <Divider />
              <ListItem button component={Link} to="/admin/events">
                <ListItemText primary="Manage Events" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Event Stats */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Event Overview
            </Typography>
            
            {events.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body1" color="textSecondary" paragraph>
                  You haven't created any events yet.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/admin/events/create"
                  startIcon={<EventIcon />}
                >
                  Create Your First Event
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  You have {events.length} event{events.length !== 1 ? 's' : ''} in total.
                </Typography>
                <Grid container spacing={2}>
                  {events.slice(0, 3).map(event => (
                    <Grid item xs={12} sm={6} md={4} key={event.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" noWrap>
                            {event.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(event.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2">
                            Code: {event.accessCode}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            color="primary" 
                            component={Link} 
                            to={`/admin/events/${event.id}/edit`}
                          >
                            MANAGE
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                {events.length > 3 && (
                  <Box textAlign="right" mt={1}>
                    <Button 
                      size="small" 
                      color="primary" 
                      component={Link} 
                      to="/admin/events"
                    >
                      View All Events
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Feature Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Manage Features
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6 
                  }
                }}
                onClick={() => handleFeatureClick('/music')}
              >
                <MusicIcon color="primary" sx={{ fontSize: 40, my: 1 }} />
                <Typography variant="h6">Music</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Configure playlists and music settings.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6 
                  } 
                }}
                onClick={() => handleFeatureClick('/menu')}
              >
                <OrderIcon color="primary" sx={{ fontSize: 40, my: 1 }} />
                <Typography variant="h6">Orders</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Manage food, beverage, and merchandise orders.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6 
                  } 
                }}
                onClick={() => handleFeatureClick('/timeline')}
              >
                <TimelineIcon color="primary" sx={{ fontSize: 40, my: 1 }} />
                <Typography variant="h6">Timeline</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Create and manage event schedules.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { 
                    boxShadow: 6 
                  } 
                }}
                onClick={() => handleFeatureClick('/polls')}
              >
                <PollIcon color="primary" sx={{ fontSize: 40, my: 1 }} />
                <Typography variant="h6">Polls</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Set up interactive polls for guests.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;