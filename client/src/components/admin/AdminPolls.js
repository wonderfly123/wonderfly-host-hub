// src/components/admin/AdminPolls.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  ListItemIcon,
  CircularProgress,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Add as AddIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';
import { getEventTimeline, getEventPolls, createPoll } from '../../utils/api';

const AdminPolls = () => {
  const { eventId } = useParams();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineItems, setTimelineItems] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [activityPollDialog, setActivityPollDialog] = useState({
    open: false,
    selectedItems: [],
    duration: 15, // Default 15 minutes
    question: "What should we do next?"
  });
  const [regularPollDialog, setRegularPollDialog] = useState({
    open: false,
    question: "",
    options: ["", ""]
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch timeline items for activity polls
      setTimelineLoading(true);
      const timelineResponse = await getEventTimeline(eventId);
      setTimelineItems(timelineResponse.timelineItems || []);
      setTimelineLoading(false);
      
      // Fetch polls
      const pollsResponse = await getEventPolls(eventId);
      setPolls(pollsResponse.polls || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });
      setLoading(false);
      setTimelineLoading(false);
    }
  };
  
  // Open regular poll dialog
  const handleOpenRegularPollDialog = () => {
    setRegularPollDialog({
      open: true,
      question: "",
      options: ["", ""]
    });
  };
  
  // Add option to regular poll
  const addPollOption = () => {
    setRegularPollDialog(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };
  
  // Remove option from regular poll
  const removePollOption = (index) => {
    if (regularPollDialog.options.length <= 2) {
      return; // Keep at least 2 options
    }
    
    setRegularPollDialog(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };
  
  // Handle option change in regular poll
  const handleOptionChange = (index, value) => {
    setRegularPollDialog(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return {
        ...prev,
        options: newOptions
      };
    });
  };
  
  // Create a regular poll
  const handleCreateRegularPoll = async () => {
    try {
      const { question, options } = regularPollDialog;
      
      if (!question.trim()) {
        setSnackbar({
          open: true,
          message: 'Please enter a question',
          severity: 'error'
        });
        return;
      }
      
      const validOptions = options.filter(opt => opt.trim() !== "");
      if (validOptions.length < 2) {
        setSnackbar({
          open: true,
          message: 'Please provide at least 2 valid options',
          severity: 'error'
        });
        return;
      }
      
      await createPoll({
        eventId,
        question,
        options: validOptions,
        type: 'general'
      });
      
      // Close dialog and show success
      setRegularPollDialog(prev => ({ 
        ...prev, 
        open: false
      }));
      
      setSnackbar({
        open: true,
        message: 'Poll created successfully',
        severity: 'success'
      });
      
      // Refresh polls
      fetchData();
      
    } catch (error) {
      console.error('Error creating poll:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create poll',
        severity: 'error'
      });
    }
  };
  
  // Handle creating an activity poll
  const handleCreateActivityPoll = async () => {
    try {
      const { selectedItems, duration, question } = activityPollDialog;
      
      if (selectedItems.length < 2) {
        setSnackbar({
          open: true,
          message: 'Please select at least 2 activities',
          severity: 'error'
        });
        return;
      }
      
      await createPoll({
        eventId,
        question,
        options: selectedItems.map(item => item.title),
        type: 'activity',
        activityOptions: selectedItems.map(item => ({
          timelineItem: item._id,
          details: {
            time: new Date(item.startTime).toLocaleTimeString(),
            location: item.location || 'TBD',
            description: item.description || ''
          }
        })),
        duration
      });
      
      // Close dialog and show success
      setActivityPollDialog(prev => ({ 
        ...prev, 
        open: false,
        selectedItems: []
      }));
      
      setSnackbar({
        open: true,
        message: 'Activity poll created successfully',
        severity: 'success'
      });
      
      // Refresh polls
      fetchData();
      
    } catch (error) {
      console.error('Error creating activity poll:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create activity poll',
        severity: 'error'
      });
    }
  };
  
  // Toggle selection of a timeline item
  const toggleItemSelection = (item) => {
    setActivityPollDialog(prev => {
      // Check if already selected
      const isSelected = prev.selectedItems.some(i => i._id === item._id);
      
      // Toggle selection
      const newSelectedItems = isSelected
        ? prev.selectedItems.filter(i => i._id !== item._id)
        : [...prev.selectedItems, item];
      
      return {
        ...prev,
        selectedItems: newSelectedItems
      };
    });
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

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
          Poll Management
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Event Polls
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<VoteIcon />}
              onClick={() => setActivityPollDialog(prev => ({ ...prev, open: true }))}
              sx={{ mr: 1 }}
            >
              Activity Vote
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenRegularPollDialog}
            >
              Create Poll
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />

        <List>
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : polls.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="No polls created yet" 
                secondary="Click 'Create Poll' or 'Activity Vote' to engage your guests" 
              />
            </ListItem>
          ) : (
            polls.map((poll) => (
              <ListItem key={poll._id} alignItems="flex-start" divider>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle1">{poll.question}</Typography>
                      {poll.type === 'activity' && (
                        <Chip 
                          label="Activity" 
                          color="primary" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                      {!poll.isActive && (
                        <Chip 
                          label="Closed" 
                          color="default" 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {poll.options.length} options · 
                        {poll.voters.length} votes · 
                        Created {formatDate(poll.createdAt)}
                      </Typography>
                      {poll.closedAt && (
                        <Typography variant="body2" component="span">
                          {" · "}Closed {formatDate(poll.closedAt)}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
      
      {/* Activity Poll Dialog */}
      <Dialog
        open={activityPollDialog.open}
        onClose={() => setActivityPollDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Activity Vote</DialogTitle>
        <DialogContent>
          <Box mb={3}>
            <TextField
              fullWidth
              label="Question"
              value={activityPollDialog.question}
              onChange={(e) => setActivityPollDialog(prev => ({ 
                ...prev, 
                question: e.target.value 
              }))}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Voting Duration (minutes)"
              type="number"
              value={activityPollDialog.duration}
              onChange={(e) => setActivityPollDialog(prev => ({ 
                ...prev, 
                duration: parseInt(e.target.value) || 15
              }))}
              margin="normal"
              InputProps={{ inputProps: { min: 1, max: 60 } }}
            />
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Select Activities (minimum 2)
          </Typography>
          
          {/* Timeline items selection */}
          {timelineLoading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : timelineItems.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
              No timeline activities available. Please create activities first.
            </Typography>
          ) : (
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {timelineItems.map((item) => (
                <ListItem 
                  key={item._id}
                  button
                  onClick={() => toggleItemSelection(item)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={activityPollDialog.selectedItems.some(i => i._id === item._id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={
                      <>
                        {new Date(item.startTime).toLocaleTimeString()}
                        {item.location && ` - ${item.location}`}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActivityPollDialog(prev => ({ ...prev, open: false }))}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateActivityPoll} 
            variant="contained" 
            color="primary"
            disabled={activityPollDialog.selectedItems.length < 2}
          >
            Create Activity Poll
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Regular Poll Dialog */}
      <Dialog
        open={regularPollDialog.open}
        onClose={() => setRegularPollDialog(prev => ({ ...prev, open: false }))}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Poll</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Poll Question"
            value={regularPollDialog.question}
            onChange={(e) => setRegularPollDialog(prev => ({ 
              ...prev, 
              question: e.target.value 
            }))}
            margin="normal"
            required
          />
          
          <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
            Options
          </Typography>
          
          {regularPollDialog.options.map((option, index) => (
            <Box key={index} display="flex" alignItems="center" mb={1}>
              <TextField
                fullWidth
                label={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                margin="dense"
                required
              />
              {regularPollDialog.options.length > 2 && (
                <Button 
                  color="error"
                  onClick={() => removePollOption(index)}
                  sx={{ ml: 1 }}
                >
                  Remove
                </Button>
              )}
            </Box>
          ))}
          
          <Button
            variant="outlined"
            onClick={addPollOption}
            sx={{ mt: 1 }}
          >
            Add Option
          </Button>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setRegularPollDialog(prev => ({ ...prev, open: false }))}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRegularPoll} 
            variant="contained" 
            color="primary"
          >
            Create Poll
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPolls;