// client/src/components/admin/AdminTimeline.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createTimelineItem, getEventTimeline, updateTimelineItem, deleteTimelineItem } from '../../utils/api';

const AdminTimeline = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [event, setEvent] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60*60*1000), // Default end time 1 hour after start
    title: '',
    description: '',
    location: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Define fetchEventData as a useCallback to avoid dependencies warning
  const fetchEventData = useCallback(async () => {
    try {
      setLoading(true);
      // Get timeline data for this event
      const response = await getEventTimeline(eventId);
      console.log('Timeline data fetched:', response);
      
      setEvent({
        id: eventId,
        name: 'Activities Schedule'
      });
      
      if (!response.timelineItems || response.timelineItems.length === 0) {
        setScheduleItems([]);
        setLoading(false);
        return;
      }
      
      // Format the timeline items with numerical timestamps for reliable sorting
      const formattedItems = response.timelineItems.map(item => {
        const startTime = new Date(item.startTime);
        const endTime = item.endTime ? new Date(item.endTime) : null;
        
        return {
          id: item._id,
          startTime: startTime,
          endTime: endTime,
          title: item.title,
          description: item.description || '',
          location: item.location || '',
          // Add numerical timestamp for reliable sorting
          startTimestamp: startTime.getTime()
        };
      });
      
      // Sort the items by numerical timestamp (most reliable method)
      const sortedItems = [...formattedItems].sort((a, b) => {
        return a.startTimestamp - b.startTimestamp;
      });
      
      console.log('Sorted admin timeline items:', sortedItems);
      setScheduleItems(sortedItems);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setSnackbar({
        open: true,
        message: 'Error loading schedule data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleAddItem = () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60*60*1000); // Default 1 hour duration
    
    setCurrentItem({
      id: null,
      startTime: startTime,
      endTime: endTime,
      title: '',
      description: '',
      location: ''
    });
    setOpenDialog(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem({...item});
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteTimelineItem(itemId);
      // Refresh the timeline data after deletion
      fetchEventData();
      setSnackbar({
        open: true,
        message: 'Activity deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting timeline item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete activity',
        severity: 'error'
      });
    }
  };

  const handleSaveItem = async () => {
    try {
      setSaveLoading(true);
      
      if (!currentItem.title || !currentItem.startTime) {
        setSnackbar({
          open: true,
          message: 'Title and start time are required',
          severity: 'error'
        });
        setSaveLoading(false);
        return;
      }
      
      // Make sure end time is after start time
      if (currentItem.endTime && currentItem.endTime <= currentItem.startTime) {
        setSnackbar({
          open: true,
          message: 'End time must be after start time',
          severity: 'error'
        });
        setSaveLoading(false);
        return;
      }
      
      // Prepare the data in the format expected by the API
      const timelineData = {
        title: currentItem.title,
        description: currentItem.description,
        startTime: currentItem.startTime,
        endTime: currentItem.endTime,
        location: currentItem.location,
        eventId: eventId
      };
      
      if (currentItem.id) {
        // Update existing item
        await updateTimelineItem(currentItem.id, timelineData);
        setSnackbar({
          open: true,
          message: 'Activity updated successfully',
          severity: 'success'
        });
      } else {
        // Create new item
        await createTimelineItem(timelineData);
        setSnackbar({
          open: true,
          message: 'Activity added successfully',
          severity: 'success'
        });
      }
      
      // Refresh the timeline data after save
      await fetchEventData();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving timeline item:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save activity',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
          Schedule Management
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Activities Schedule
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddItem}
          >
            Add Activity
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />

        <List>
          {scheduleItems.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No activities yet" 
                secondary="Click 'Add Activity' to create your schedule" 
              />
            </ListItem>
          ) : (
            // Use the already sorted items directly
            scheduleItems.map(item => (
              <React.Fragment key={item.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditItem(item)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textPrimary">
                          {formatTime(item.startTime)}
                          {item.endTime && ` - ${formatTime(item.endTime)}`}
                        </Typography>
                        {item.description && (
                          <>
                            {" — "}{item.description}
                          </>
                        )}
                        {item.location && (
                          <Typography component="div" variant="body2" color="textSecondary">
                            Location: {item.location}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Dialog for adding/editing schedule items */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {currentItem.id ? 'Edit Activity' : 'Add Activity'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={currentItem.startTime}
                  onChange={(newValue) => {
                    setCurrentItem({...currentItem, startTime: newValue});
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time (Optional)"
                  value={currentItem.endTime}
                  onChange={(newValue) => {
                    setCurrentItem({...currentItem, endTime: newValue});
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={currentItem.title}
                onChange={(e) => setCurrentItem({...currentItem, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location (Optional)"
                value={currentItem.location || ''}
                onChange={(e) => setCurrentItem({...currentItem, location: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={currentItem.description}
                onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveItem} 
            variant="contained" 
            color="primary"
            disabled={saveLoading}
          >
            {saveLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
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

export default AdminTimeline;