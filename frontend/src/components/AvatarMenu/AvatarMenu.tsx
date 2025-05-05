import useUser from '$/hooks/useUser';
import { BookOutlined, LoginOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps } from 'antd';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import AuthModal from '../AuthModal/AuthModal';
import { useAuthStore } from '$/providers/auth/store';
import { useMessage } from '$/providers/message/context';
import UserAvatar from '$/components/UserAvatar';

export default function AvatarMenu() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [user] = useUser();
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const message = useMessage();

  const handleLogout = () => {
    message.success('Successfully logged out');
    logout();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleSaved = () => {
    console.log('Saved items clicked');
    // Implement navigation to saved items
  };

  const handleLoginClick = () => {
    setIsAuthModalVisible(true);
  };

  const items: MenuProps['items'] = [
    {
      key: '1',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: handleSettings,
    },
    {
      key: '2',
      icon: <BookOutlined />,
      label: 'Saved Anime & Manga',
      onClick: handleSaved,
    },
    {
      type: 'divider',
    },
    user
      ? {
          key: '3',
          icon: <LogoutOutlined />,
          label: 'Logout',
          danger: true,
          onClick: handleLogout,
        }
      : {
          key: '3',
          icon: <LoginOutlined />,
          label: 'Sign in',
          onClick: handleLoginClick,
        },
  ];
  return (
    <>
      <Dropdown trigger={['click']} placement='bottomRight' arrow menu={{ items }}>
        <Button icon={<UserAvatar />} type='text' shape='circle' size='large' />
      </Dropdown>

      <AuthModal visible={isAuthModalVisible} onClose={() => setIsAuthModalVisible(false)} />
    </>
  );
}
