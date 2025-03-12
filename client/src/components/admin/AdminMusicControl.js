import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const AdminMusicControl = () => {
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
          Music Settings
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event {eventId} - Music Configuration
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Spotify Integration
            </Typography>
            <TextField
              fullWidth
              label="Spotify Playlist ID"
              margin="normal"
              helperText="Enter a Spotify playlist ID to connect to this event"
            />
            <FormControlLabel
              control={
                <Switch
                  color="primary"
                />
              }
              label="Allow guests to vote on songs"
            />
          </Grid>

          <Grid item xs={12}>
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
              >
                Save Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AdminMusicControl;