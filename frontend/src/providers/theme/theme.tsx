import { useThemeStore } from '$/providers/theme/store';
import { ConfigProvider, theme } from 'antd';

export default function ThemeProvider({ children }: React.PropsWithChildren) {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  return (
    <ConfigProvider theme={{ algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
      {children}
    </ConfigProvider>
  );
}
