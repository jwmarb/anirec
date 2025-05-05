import { MessageContext } from '$/providers/message/context';
import { message } from 'antd';
import React from 'react';

export default function MessageProvider({ children }: React.PropsWithChildren) {
  const [api, contextHolder] = message.useMessage();

  return (
    <MessageContext.Provider value={api}>
      {contextHolder}
      {children}
    </MessageContext.Provider>
  );
}
