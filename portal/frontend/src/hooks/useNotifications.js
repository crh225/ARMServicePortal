import { useState, useEffect, useCallback, useRef } from "react";
import notificationService from "../services/notificationService";

/**
 * Custom hook for managing notifications
 * Uses SSE for real-time updates with polling as fallback
 */
function useNotifications(options = {}) {
  const {
    pollingInterval = 60000, // Increased to 60 seconds (SSE is primary now)
    enableBrowserNotifications = true,
    enableSSE = true, // Enable SSE by default
    onNavigate
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sseConnected, setSSEConnected] = useState(false);

  const pollingTimer = useRef(null);
  const lastNotificationId = useRef(null);
  const isPollingActive = useRef(true);
  const sseUnsubscribe = useRef(null);

  /**
   * Fetch notifications from the API
   */
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await notificationService.fetchNotifications({ limit: 50 });

      // Check for new notifications
      if (response.notifications.length > 0) {
        const latestNotification = response.notifications[0];

        // If there's a new notification, show toast and browser notification
        if (lastNotificationId.current && latestNotification.id !== lastNotificationId.current) {
          // Add to toasts
          setToasts((prev) => [...prev, latestNotification]);

          // Show browser notification if enabled
          if (enableBrowserNotifications) {
            notificationService.showBrowserNotification(latestNotification, onNavigate);
          }
        }

        lastNotificationId.current = latestNotification.id;
      }

      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);

    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [enableBrowserNotifications, onNavigate]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);

    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();

      // Update local state
      setNotifications([]);
      setUnreadCount(0);

    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  }, []);

  /**
   * Remove a toast
   */
  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  /**
   * Request browser notification permission
   */
  const requestPermission = useCallback(async () => {
    const permission = await notificationService.requestPermission();
    return permission === 'granted';
  }, []);

  /**
   * Start polling for notifications
   */
  const startPolling = useCallback(() => {
    isPollingActive.current = true;

    // Initial fetch
    fetchNotifications();

    // Set up polling
    pollingTimer.current = setInterval(() => {
      if (isPollingActive.current) {
        fetchNotifications();
      }
    }, pollingInterval);
  }, [fetchNotifications, pollingInterval]);

  /**
   * Stop polling for notifications
   */
  const stopPolling = useCallback(() => {
    isPollingActive.current = false;
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  /**
   * Refresh notifications immediately
   */
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Handle SSE events
   */
  const handleSSEEvent = useCallback((event) => {
    switch (event.type) {
      case 'connected':
        console.log('[Notifications] SSE connected');
        setSSEConnected(true);
        break;

      case 'disconnected':
        console.log('[Notifications] SSE disconnected');
        setSSEConnected(false);
        break;

      case 'notification':
        const newNotification = event.data;
        console.log('[Notifications] Received live notification:', newNotification.title);

        // Add to notifications list (at the beginning)
        setNotifications((prev) => {
          // Check if notification already exists
          if (prev.some(n => n.id === newNotification.id)) {
            return prev;
          }
          return [newNotification, ...prev];
        });

        // Update unread count if notification is unread
        if (!newNotification.read) {
          setUnreadCount((prev) => prev + 1);
        }

        // Add to toasts for in-app notification
        setToasts((prev) => [...prev, newNotification]);

        // Browser notification is already handled by notificationService
        break;

      case 'error':
        console.error('[Notifications] SSE error');
        setSSEConnected(false);
        break;

      default:
        break;
    }
  }, []);

  /**
   * Start SSE connection
   */
  const startSSE = useCallback(() => {
    if (!enableSSE) return;

    // Add listener for SSE events
    sseUnsubscribe.current = notificationService.addListener(handleSSEEvent);

    // Connect to SSE
    notificationService.connectSSE();
  }, [enableSSE, handleSSEEvent]);

  /**
   * Stop SSE connection
   */
  const stopSSE = useCallback(() => {
    if (sseUnsubscribe.current) {
      sseUnsubscribe.current();
      sseUnsubscribe.current = null;
    }
    notificationService.disconnectSSE();
    setSSEConnected(false);
  }, []);

  // Start SSE and polling on mount
  useEffect(() => {
    // Start SSE for real-time updates
    startSSE();

    // Start polling as fallback
    startPolling();

    // Clean up on unmount
    return () => {
      stopSSE();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  return {
    notifications,
    unreadCount,
    toasts,
    isLoading,
    error,
    sseConnected, // SSE connection status
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    removeToast,
    refresh,
    requestPermission
  };
}

export default useNotifications;
