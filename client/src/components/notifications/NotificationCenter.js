// src/components/notifications/NotificationCenter.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  HowToVote as VoteIcon
} from '@mui/icons-material';
import { NotificationContext } from '../../contexts/NotificationContext';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useContext(NotificationContext);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification._id);
    
    // Handle specific notification types
    if (notification.metadata?.type === 'poll') {
      // Navigate to polls page with the specific poll highlighted
      const eventId = notification.event;
      navigate(`/event/${eventId}/polls?pollId=${notification.metadata.pollId}`);
    }
    
    // Close notification center
    handleClose();
  };

  // Get notification icon based on type and metadata
  const getNotificationIcon = (notification) => {
    // First check metadata for more specific icon
    if (notification.metadata?.type === 'poll') {
      return <VoteIcon color="primary" />;
    }
    
    // Fall back to existing type-based logic
    switch (notification.type) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <InfoIcon color="primary" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <div>
      <IconButton
        aria-describedby={id}
        onClick={handleClick}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 480 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button
              startIcon={<CheckIcon />}
              size="small"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <ListItem
                key={notification._id}
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'inherit' : 'action.hover',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
                onClick={() => handleNotificationClick(notification)}
                secondaryAction={
                  !notification.read && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent ListItem click
                        handleMarkAsRead(notification._id);
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <Box sx={{ mr: 2, mt: 0.5 }}>
                  {getNotificationIcon(notification)}
                </Box>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTimestamp(notification.createdAt)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>
    </div>
  );
};

export default NotificationCenter;