// src/components/admin/CreateEvent.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MenuItem
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { createEvent, getAllFacilities } from '../../utils/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: null,
    startTime: null,
    endTime: null,
    status: 'Definite', // Updated default to 'Definite'
    facility: '', // Single facility ID
    tripleseatEventId: '' // New Tripleseat Event ID field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        console.log('Fetching facilities...');
        setFacilitiesLoading(true);
        const response = await getAllFacilities();
        console.log('Facilities response:', response);
        setFacilities(response.facilities || []);
        
        // Default to first facility if available
        if (response.facilities && response.facilities.length > 0) {
          setFormData(prev => ({
            ...prev,
            facility: response.facilities[0].id
          }));
        }
      } catch (error) {
        console.error('Error fetching facilities:', error);
      } finally {
        setFacilitiesLoading(false);
      }
    };
    
    fetchFacilities();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
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
      
      // Prepare event data with datetime values
      const eventData = {
        name: formData.name,
        description: formData.description,
        date: eventDateTime ? eventDateTime.toISOString() : undefined,
        endTime: eventEndDateTime ? eventEndDateTime.toISOString() : undefined,
        status: formData.status,
        facility: formData.facility,
        tripleseatEventId: formData.tripleseatEventId // Include Tripleseat Event ID
      };
      
      console.log('Submitting event data:', eventData);
      
      await createEvent(eventData);
      setSnackbarOpen(true);
      
      // Redirect to event management after short delay
      setTimeout(() => {
        navigate('/admin/events');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Event
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Fill in the details below to create a new event.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4 }}>
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
                helperText="Enter the Tripleseat Event ID if this event is imported from Tripleseat"
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
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="facility-label">Facility</InputLabel>
                <Select
                  labelId="facility-label"
                  name="facility"
                  value={formData.facility}
                  onChange={handleChange}
                  label="Facility"
                  disabled={facilitiesLoading}
                >
                  {facilitiesLoading ? (
                    <MenuItem value="" disabled>Loading facilities...</MenuItem>
                  ) : facilities.length === 0 ? (
                    <MenuItem value="" disabled>No facilities available</MenuItem>
                  ) : (
                    facilities.map((facility) => (
                      <MenuItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate('/admin/events')}
                  sx={{ mr: 2 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          Event created successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateEvent;