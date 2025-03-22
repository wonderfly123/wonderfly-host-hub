// src/components/admin/EventSelector.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { getEvents } from '../../utils/api';

const EventSelector = ({ featureType }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  const handleSelectEvent = (eventId) => {
    // Store selected event in localStorage
    localStorage.setItem('selectedEventId', eventId);
    
    // Navigate to the appropriate feature page
    switch(featureType) {
      case 'music':
        navigate(`/admin/events/${eventId}/music`);
        break;
      case 'orders':
        navigate(`/admin/events/${eventId}/menu`);
        break;
      case 'timeline':
        navigate(`/admin/events/${eventId}/timeline`);
        break;
      case 'polls':
        navigate(`/admin/events/${eventId}/polls`);
        break;
      case 'announcements':
        navigate(`/admin/events/${eventId}/announcements`);
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Select an Event
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Choose an event to manage {featureType}.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        {events.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Typography variant="body1" color="textSecondary" paragraph>
              You don't have any events yet.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/admin/events/create')}
            >
              Create an Event
            </Button>
          </Box>
        ) : (
          <List>
            {events.map((event) => (
              <ListItem 
                key={event.id} 
                button 
                onClick={() => handleSelectEvent(event.id)}
                divider
              >
                <ListItemText
                  primary={event.name}
                  secondary={
                    <>
                      {new Date(event.date).toLocaleDateString()}
                      {event.status && ` • ${event.status}`}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" onClick={() => handleSelectEvent(event.id)}>
                    Select
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default EventSelector;