// src/contexts/NotificationContext.js
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user && token) {
      const newSocket = io('http://localhost:5002', {
        auth: { token }
      });
      socketRef.current = newSocket;

      if (user.currentEvent) {
        // Join event room
        newSocket.emit('join-event', user.currentEvent.id);
        console.log(`Joined event room: ${user.currentEvent.id}`);
      }

      // Join user's personal room
      newSocket.emit('join-user', user.id);
      console.log(`Joined user room: ${user.id}`);

      // Listen for new notifications
      newSocket.on('new-notification', (notification) => {
        console.log('Received new notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('announcement', (announcement) => {
        // Handle event-wide announcements
        console.log('Received announcement:', announcement);
        setAnnouncements(prev => [announcement, ...prev]);
        // No need to increment unread count as this will come as a notification as well
      });

      // Clean up on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [user, token]);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setAnnouncements([]);
      setUnreadCount(0);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getUserNotifications();
      
      // Filter out announcements for the announcements section
      const announcementNotifications = response.notifications.filter(
        n => n.type === 'info' || n.type === 'warning'
      );
      
      setNotifications(response.notifications || []);
      setAnnouncements(announcementNotifications || []);
      setUnreadCount(response.notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true } 
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        announcements,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead: handleMarkAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};