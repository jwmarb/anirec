import { useThemeStore } from '$/providers/theme/store';
import { MoonFilled, SunFilled } from '@ant-design/icons';
import { Button } from 'antd';

export default function ToggleTheme() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  return (
    <Button icon={isDarkMode ? <MoonFilled /> : <SunFilled />} onClick={toggleDarkMode} type='text' shape='circle' />
  );
}
