import { BookOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, MenuProps } from 'antd';
import { useNavigate } from 'react-router';

export default function AvatarMenu() {
  const navigate = useNavigate();
  const handleLogout = () => {
    console.log('User logged out');
    // Implement actual logout logic here
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleSaved = () => {
    console.log('Saved items clicked');
    // Implement navigation to saved items
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
    {
      key: '3',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];
  return (
    <Dropdown trigger={['click']} placement='bottomRight' arrow menu={{ items }}>
      <Button icon={<Avatar />} type='text' shape='circle' size='large' />
    </Dropdown>
  );
}
