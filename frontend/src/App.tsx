import { useState } from 'react';
import { Input, Button, Typography, Layout, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import './App.css';

const { Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // This is where you would make API calls in the future
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout className='layout'>
      <Content className='content'>
        <div className='search-container'>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Title level={1} className='search-title'>
              Discover Your Next Anime & Manga Adventure
            </Title>
            <Text className='search-subtitle'>Find personalized recommendations based on your interests</Text>
            <div className='search-input-container'>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
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
      </Content>
    </Layout>
  );
}

export default App;
