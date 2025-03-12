import React, { useState, useEffect } from 'react';
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
  DialogActions
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

const AdminTimeline = () => {
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    id: null,
    time: new Date(),
    title: '',
    description: ''
  });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API call
        // const response = await getEventById(eventId);
        // setEvent(response.event);
        // setScheduleItems(response.event.schedule || []);
        
        // Simulated data for now
        setEvent({
          id: eventId,
          name: 'Event Name',
          date: new Date()
        });
        setScheduleItems([
          {
            id: '1',
            time: new Date(),
            title: 'Welcome Reception',
            description: 'Welcome guests as they arrive'
          },
          {
            id: '2',
            time: new Date(new Date().getTime() + 3600000),
            title: 'Dinner Service',
            description: 'Main course dinner service begins'
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleAddItem = () => {
    setCurrentItem({
      id: null,
      time: new Date(),
      title: '',
      description: ''
    });
    setOpenDialog(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setOpenDialog(true);
  };

  const handleDeleteItem = (itemId) => {
    // Filter out the deleted item
    setScheduleItems(scheduleItems.filter(item => item.id !== itemId));
    // Implement your API call to delete the item
  };

  const handleSaveItem = () => {
    if (currentItem.id) {
      // Update existing item
      setScheduleItems(scheduleItems.map(item => 
        item.id === currentItem.id ? currentItem : item
      ));
    } else {
      // Add new item with generated ID
      const newItem = {
        ...currentItem,
        id: Date.now().toString()
      };
      setScheduleItems([...scheduleItems, newItem]);
    }
    setOpenDialog(false);
    // Implement your API call to save the changes
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
          Timeline Management
        </Typography>
      </Box>

      {event && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {event.name} - Schedule
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Box>
          
          <Divider sx={{ mb: 2 }} />

          <List>
            {scheduleItems.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No schedule items yet" 
                  secondary="Click 'Add Item' to create your event schedule" 
                />
              </ListItem>
            ) : (
              scheduleItems
                .sort((a, b) => new Date(a.time) - new Date(b.time))
                .map(item => (
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
                              {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </Typography>
                            {" — "}{item.description}
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
      )}

      {/* Dialog for adding/editing schedule items */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {currentItem.id ? 'Edit Schedule Item' : 'Add Schedule Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Time"
                  value={currentItem.time}
                  onChange={(newValue) => {
                    setCurrentItem({...currentItem, time: newValue});
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
          <Button onClick={handleSaveItem} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTimeline;