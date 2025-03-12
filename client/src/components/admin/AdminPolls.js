import React from 'react';
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
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon } from '@mui/icons-material';

const AdminPolls = () => {
  const { eventId } = useParams();
  
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
            Event {eventId} - Interactive Polls
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Create New Poll
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />

        <List>
          <ListItem>
            <ListItemText 
              primary="No polls created yet" 
              secondary="Click 'Create New Poll' to engage your guests" 
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default AdminPolls;