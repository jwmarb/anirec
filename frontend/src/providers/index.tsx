import MessageProvider from '$/providers/message/message';
import NotificationProvider from '$/providers/notification/notification';
import ThemeProvider from '$/providers/theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <MessageProvider>{children}</MessageProvider>
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
