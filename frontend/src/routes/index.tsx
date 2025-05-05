import { useState } from 'react';
import { Input, Button, Typography, Layout, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import './index.css';
import ToggleTheme from '$/components/ToggleTheme';
import Header from '$/components/Header';
import AvatarMenu from '$/components/AvatarMenu';
import { useNavigate } from 'react-router';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout className='layout'>
      <Header>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className='content'>
        <div className='search-container'>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Typography.Title level={1} className='search-title'>
              Discover Your Next Anime & Manga Adventure
            </Typography.Title>
            <Typography.Text className='search-subtitle'>
              Find personalized recommendations based on your interests
            </Typography.Text>
            <div className='search-input-container'>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe what you're looking for, e.g., 'Action anime with strong female leads'"
                size='large'
                className='search-input'
                suffix={
                  <Button
                    type='primary'
                    shape='circle'
                    icon={<SendOutlined />}
                    onClick={handleSearch}
                    className='search-button'
                  />
                }
              />
            </div>
          </Space>
        </div>
      </main>
    </Layout>
  );
}

export default App;
