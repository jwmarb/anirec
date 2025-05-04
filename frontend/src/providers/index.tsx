import NotificationProvider from '$/providers/notification/notification';
import ThemeProvider from '$/providers/theme/theme';

export default function Providers({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </ThemeProvider>
  );
}
