// client/src/components/admin/AdminAnnouncements.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  TextField,
  Divider,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { createAnnouncement, getEventById } from '../../utils/api';

const AdminAnnouncements = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [event, setEvent] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [importance, setImportance] = useState('normal');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await getEventById(eventId);
        setEvent(response.event);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setSnackbar({
          open: true,
          message: 'Error loading event data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleSendAnnouncement = async () => {
    if (!title || !message) {
      setSnackbar({
        open: true,
        message: 'Title and message are required',
        severity: 'error'
      });
      return;
    }

    try {
      setSendingLoading(true);
      
      const announcementData = {
        eventId,
        title,
        message,
        type: importance === 'important' ? 'warning' : 'info',
        eventCode: event.accessCode
      };
      
      const response = await createAnnouncement(announcementData);
      
      setSnackbar({
        open: true,
        message: `Announcement sent to ${response.notificationsCount} user(s)`,
        severity: 'success'
      });
      
      // Clear form
      setTitle('');
      setMessage('');
      setImportance('normal');
      
    } catch (error) {
      console.error('Error sending announcement:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send announcement',
        severity: 'error'
      });
    } finally {
      setSendingLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} display="flex" alignItems="center">
        <Button
          component={Link}
          to="/admin/dashboard"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1">
          Announcements
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <NotificationsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Send Announcement to All Users
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          This announcement will be sent to all users attending {event?.name} and will appear in their notifications.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Announcement Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Announcement Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={4}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Importance</InputLabel>
              <Select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                label="Importance"
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="important">Important</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSendAnnouncement}
                disabled={sendingLoading}
              >
                {sendingLoading ? 'Sending...' : 'Send Announcement'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminAnnouncements;