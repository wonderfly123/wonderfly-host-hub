// src/components/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Box, 
  Grid
} from '@mui/material';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box my={8}>
        <Paper elevation={3}>
          <Box p={4} textAlign="center">
            <Typography variant="h2" component="h1" gutterBottom>
              Wonderfly Host Hub
            </Typography>
            <Typography variant="h5" color="textSecondary" paragraph>
              Enhance your event experience with music control, ordering, and interactive features
            </Typography>
            <Box mt={4}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    onClick={() => navigate('/guest/login')}
                  >
                    Join an Event
                  </Button>
                </Grid>
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large"
                    onClick={() => navigate('/admin/login')}
                  >
                    Admin Login
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home;