import React, { useState, useRef, useEffect } from "react";
import "../../styles/NotificationBell.css";

/**
 * NotificationBell component
 * Displays a bell icon with unread count badge and dropdown of recent notifications
 */
function NotificationBell({ notifications, unreadCount, onMarkAsRead, onNavigate, onMarkAllAsRead }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Animate bell when new notification arrives (based on filtered count)
  const prevFilteredCount = useRef(0);
  useEffect(() => {
    // Filter and count unread for animation purposes
    const currentFilteredUnread = notifications.filter(n => {
      const content = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
      const isRelevant = content.includes('success') || content.includes('failure') ||
             content.includes('completed') || content.includes('failed') ||
             content.includes('✅') || content.includes('❌');
      return isRelevant && !n.read;
    }).length;

    if (currentFilteredUnread > prevFilteredCount.current) {
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 1000);
    }
    prevFilteredCount.current = currentFilteredUnread;
  }, [notifications]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.prNumber && onNavigate) {
      onNavigate(notification);
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Truncate long messages
  const truncateMessage = (msg, maxLength = 60) => {
    if (!msg) return '';
    const firstLine = msg.split('\n')[0].trim();
    return firstLine.length > maxLength ? firstLine.slice(0, maxLength - 3) + '...' : firstLine;
  };

  // Filter to only show success/failure notifications (reduce noise)
  const filteredNotifications = notifications.filter(n => {
    const content = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
    return content.includes('success') || content.includes('failure') ||
           content.includes('completed') || content.includes('failed') ||
           content.includes('✅') || content.includes('❌');
  });

  // Calculate unread count from filtered notifications only
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (notification) => {
    const { type, title, message } = notification;

    // Determine status from title or message content
    const content = ((title || '') + ' ' + (message || '')).toLowerCase();
    const isSuccess = content.includes('success') || content.includes('completed') || content.includes('✅');
    const isFailure = content.includes('failure') || content.includes('failed') || content.includes('❌');

    if (isSuccess || type === 'job_success') {
      return (
        <svg className="notification-item-icon notification-item-icon--success" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }

    if (isFailure || type === 'job_failure') {
      return (
        <svg className="notification-item-icon notification-item-icon--error" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    // Default info icon
    return (
      <svg className="notification-item-icon notification-item-icon--info" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className={`notification-bell-btn ${hasNewNotification ? 'notification-bell-btn--animate' : ''}`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <svg className="notification-bell-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {filteredUnreadCount > 0 && (
          <span className="notification-bell-badge">
            {filteredUnreadCount > 99 ? '99+' : filteredUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">Notifications</h3>
            {filteredUnreadCount > 0 && (
              <button
                className="notification-dropdown-mark-all"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-list">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <svg className="notification-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="notification-empty-text">No notifications</p>
              </div>
            ) : (
              filteredNotifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'notification-item--unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-item-icon-wrapper">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{notification.title}</div>
                    <div className="notification-item-message">{truncateMessage(notification.message)}</div>
                    <div className="notification-item-time">{formatTimestamp(notification.timestamp)}</div>
                  </div>
                  {!notification.read && (
                    <div className="notification-item-unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
