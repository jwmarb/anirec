import React from 'react';
import { notification } from 'antd';
import { NotificationContext } from '$/providers/notification/context';

export default function NotificationProvider({ children }: React.PropsWithChildren) {
  const [api, contextHolder] = notification.useNotification();

  return (
    <NotificationContext.Provider value={api}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
}
