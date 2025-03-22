// src/components/admin/EditEvent.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { 
  MeetingRoom as MeetingRoomIcon 
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { getEventById, updateEvent } from '../../utils/api';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EditEvent = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: null,
    startTime: null,
    endTime: null,
    status: 'Definite', // Updated default to 'Definite'
    tripleseatEventId: '' // Added Tripleseat Event ID
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await getEventById(eventId);
        setEvent(response.event);
        
        // Parse date and times
        const eventDate = response.event.date ? new Date(response.event.date) : null;
        let startTime = null;
        let endTime = null;
        
        if (eventDate) {
          startTime = new Date(eventDate);
          
          // If event has an endTime property
          if (response.event.endTime) {
            endTime = new Date(response.event.endTime);
          }
        }
        
        setFormData({
          name: response.event.name || '',
          description: response.event.description || '',
          date: eventDate,
          startTime: startTime,
          endTime: endTime,
          status: response.event.status || 'Definite',
          tripleseatEventId: response.event.tripleseatEventId || '' // Initialize Tripleseat ID
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date
    }));
  };

  const handleStartTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      startTime: time
    }));
  };

  const handleEndTimeChange = (time) => {
    setFormData(prev => ({
      ...prev,
      endTime: time
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(true);
      setError(null);
      
      // Combine date and time values to create full datetime objects
      let eventDateTime = null;
      let eventEndDateTime = null;
      
      if (formData.date) {
        // Create base date object
        const baseDate = new Date(formData.date);
        
        // If start time is set, combine with date
        if (formData.startTime) {
          const startTime = new Date(formData.startTime);
          eventDateTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            startTime.getHours(),
            startTime.getMinutes()
          );
        } else {
          // If no start time, use the date with time set to beginning of day
          eventDateTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            0, 0, 0
          );
        }
        
        // If end time is set, combine with date
        if (formData.endTime) {
          const endTime = new Date(formData.endTime);
          eventEndDateTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            endTime.getHours(),
            endTime.getMinutes()
          );
        }
      }
      
      // Prepare event data for update
      const eventData = {
        name: formData.name,
        description: formData.description,
        date: eventDateTime ? eventDateTime.toISOString() : undefined,
        endTime: eventEndDateTime ? eventEndDateTime.toISOString() : undefined,
        status: formData.status,
        tripleseatEventId: formData.tripleseatEventId // Include Tripleseat ID in update
      };
      
      await updateEvent(eventId, eventData);
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error('Error updating event:', error);
      setError(error.response?.data?.message || 'Failed to update event. Please try again.');
    } finally {
      setSaveLoading(false);
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
          Edit Event
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Update the details for "{event?.name}".
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="event management tabs">
            <Tab label="Basic Info" />
            <Tab label="Access Code" />
            <Tab label="Advanced Settings" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Event Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
              
              {/* New field: Tripleseat Event ID */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tripleseat Event ID"
                  name="tripleseatEventId"
                  value={formData.tripleseatEventId}
                  onChange={handleChange}
                  variant="outlined"
                  helperText="The Tripleseat Event ID for this event (if applicable)"
                />
              </Grid>
              
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Event Date"
                    value={formData.date}
                    onChange={handleDateChange}
                    slotProps={{ textField: { required: true, fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      {/* Updated status options */}
                      <MenuItem value="Definite">Definite</MenuItem>
                      <MenuItem value="Closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={handleStartTimeChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={handleEndTimeChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </LocalizationProvider>
            </Grid>
            
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/admin/events')}
                sx={{ mr: 2 }}
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saveLoading}
                startIcon={saveLoading ? <CircularProgress size={20} /> : null}
              >
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Event Access Code
            </Typography>
            <Paper elevation={2} sx={{ p: 3, my: 2, maxWidth: '300px', mx: 'auto' }}>
              <Typography variant="h3" component="div" sx={{ letterSpacing: '0.1em' }}>
                {event?.accessCode || 'N/A'}
              </Typography>
            </Paper>
            <Typography variant="body2" color="textSecondary">
              Share this code with your guests to allow them to join the event.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Advanced Settings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Additional settings will be available soon.
          </Typography>
          
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to={`/admin/events/${eventId}/facilities`}
              startIcon={<MeetingRoomIcon />}
            >
              Manage Facilities
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          Event updated successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditEvent;