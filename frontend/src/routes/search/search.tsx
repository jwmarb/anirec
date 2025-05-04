import { Input, Button, Typography, Layout, Space, Spin, List, Tag, theme, Image, Flex, Modal } from 'antd';
import { BookFilled, SendOutlined } from '@ant-design/icons';
import ToggleTheme from '$/components/ToggleTheme';
import Header from '$/components/Header';
import AvatarMenu from '$/components/AvatarMenu';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import './search.css';
import useWindowWidth from '$/hooks/useWindowWidth';
import React from 'react';
import { BACKEND_URL } from '$/constants';
import { useNotification } from '$/providers/notification/context';

type Media = {
  season: string;
  title: {
    english: string;
    native: string;
    romaji: string;
  };
  popularity: number;
  averageScore: number;
  genres: string[];
  format: string;
  description: string;
  chapters: null;
  episodes: number;
  coverImage: {
    large: string;
    extraLarge: string;
  };
  endDate: {
    day: number;
    month: number;
    year: number;
  };
  seasonYear: number;
  siteUrl: string;
  status: string;
  type: string;
  volumes: null;
  isAdult: boolean;
  id: number;
};

const searchAnime = async (query: string): Promise<Media[]> => {
  return fetch(`${BACKEND_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
    .then((r) => r.json())
    .then((r) => r.data);
};

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState<string>(searchParams.get('q') || '');
  const [submittedQuery, setSubmittedQuery] = React.useState<string>(searchParams.get('q') || '');
  const [dontShowDialog, setDontShowDialog] = React.useState<boolean>(false);
  const notification = useNotification();
  const windowWidth = useWindowWidth();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  // React Query hook for fetching search results
  const {
    data: searchResults,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ['animeSearch', submittedQuery],
    queryFn: () => searchAnime(submittedQuery),
    enabled: !!submittedQuery, // Only run query if there's a submitted search query
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSubmittedQuery(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDontShowDialogClose = () => {
    setDontShowDialog(false);
  };

  React.useEffect(() => {
    setSearchParams({ q: submittedQuery });
  }, [setSearchParams, submittedQuery]);

  React.useEffect(() => {
    if (isSuccess) {
      if (searchResults.length > 5) {
        const key = 'narrow-results-prompt';
        notification.info({
          key,
          message: 'Need more specific results?',
          description:
            'You have several results. Would you like to use our AI agents to narrow down your search further?',
          placement: 'bottomRight',
          duration: 10,
          icon: <BookFilled />,
          btn: (
            <Space>
              <Button type='primary' variant='filled'>
                Yes
              </Button>
              <Button color='primary' variant='outlined'>
                No
              </Button>
              <Button
                onClick={() => {
                  notification.destroy(key);
                  setDontShowDialog(true);
                }}>
                Don't show again
              </Button>
            </Space>
          ),
        });
        return () => {
          notification.destroy(key);
        };
      }
    }
  }, [isSuccess, notification, searchResults?.length]);

  return (
    <Layout className='layout'>
      <Header backButton onBack={handleBack}>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className='search-content'>
        <Modal
          title='You can still get personalized recommendations'
          open={dontShowDialog}
          onOk={handleDontShowDialogClose}
          footer={(_, { OkBtn }) => <OkBtn />}>
          <Typography.Paragraph>
            Even if you are not prompted again, you can still get personalized recommendations by interacting with the
            "Enhanced Search" button.
          </Typography.Paragraph>
        </Modal>

        <Space
          direction='vertical'
          style={{ width: '100%', backgroundColor: token.colorBgLayout }}
          className='search-input-top'>
          {windowWidth > 1024 && (
            <>
              <Typography.Title level={1} className='search-title search-fade-away'>
                Discover Your Next Anime & Manga Adventure
              </Typography.Title>
              <Typography.Text className='search-subtitle search-fade-away'>
                Find personalized recommendations based on your interests
              </Typography.Text>
            </>
          )}
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

        {isLoading && <Spin size='large' className='search-spinner' />}

        {isError && (
          <div className='search-error'>
            <Typography.Text type='danger'>An error occurred while searching. Please try again.</Typography.Text>
          </div>
        )}

        {!isLoading && searchResults && searchResults.length > 0 && (
          <div className='search-results'>
            <Flex justify='space-between' align='center'>
              <Typography.Title level={3}>Search Results</Typography.Title>
              <Button color='primary' icon={<BookFilled />} variant='outlined'>
                Enhanced Search
              </Button>
            </Flex>
            <List
              itemLayout='vertical'
              dataSource={searchResults}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Image
                        width={142}
                        height={200}
                        src={item.coverImage.large}
                        preview={{ src: item.coverImage.extraLarge }}
                      />
                    }
                    title={
                      <a href={item.siteUrl}>
                        {item.title.english || item.title.romaji} {item.seasonYear ? `(${item.seasonYear})` : ''}
                      </a>
                    }
                    description={
                      <>
                        <div dangerouslySetInnerHTML={{ __html: item.description }} />
                        <div style={{ marginTop: 8 }}>
                          {item.genres.map((genre) => (
                            <Tag key={genre} color='blue'>
                              {genre}
                            </Tag>
                          ))}
                          <Tag color='gold'>Rating: {item.averageScore / 10}/10</Tag>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {!isLoading && searchResults && searchResults.length === 0 && submittedQuery && (
          <div className='no-results'>
            <Typography.Text>No results found for "{submittedQuery}". Try different keywords.</Typography.Text>
          </div>
        )}
      </main>
    </Layout>
  );
}
