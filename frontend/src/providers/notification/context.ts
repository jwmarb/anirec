import { NotificationInstance } from 'antd/es/notification/interface';
import React from 'react';

export const NotificationContext = React.createContext<NotificationInstance | null>(null);

export const useNotification = () => {
  const notification = React.useContext(NotificationContext);
  if (!notification) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return notification;
};
