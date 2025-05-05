import { MessageInstance } from 'antd/es/message/interface';
import React from 'react';

export const MessageContext = React.createContext<MessageInstance | null>(null);

export const useMessage = () => {
  const message = React.useContext(MessageContext);
  if (!message) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return message;
};
