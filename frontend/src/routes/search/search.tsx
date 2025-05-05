import { Input, Button, Typography, Layout, Space, Spin, List, Tag, theme, Image, Flex, Tooltip } from 'antd';
import { HeartFilled, HeartOutlined, SendOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import ToggleTheme from '$/components/ToggleTheme';
import Header from '$/components/Header';
import AvatarMenu from '$/components/AvatarMenu';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import './search.css';
import useWindowWidth from '$/hooks/useWindowWidth';
import React from 'react';
import { BACKEND_URL } from '$/constants';
import { useNotification } from '$/providers/notification/context';
import { useAuthStore } from '$/providers/auth/store';
import useUser from '$/hooks/useUser';

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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState<string>(searchParams.get('q') || '');
  const [submittedQuery, setSubmittedQuery] = React.useState<string>(searchParams.get('q') || '');
  const queryClient = useQueryClient();
  const notification = useNotification();
  const windowWidth = useWindowWidth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const authToken = useAuthStore((s) => s.token);
  const [user, isLoadingUser] = useUser();

  // Keep track of unblurred items
  const [unblurredItems, setUnblurredItems] = React.useState<Set<number>>(new Set());

  const searchAnime = async (query: string): Promise<Media[]> => {
    return fetch(`${BACKEND_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((r) => r.data);
  };
  const { mutateAsync: addToFavorites } = useMutation<void, Error, { mediaId: number }>({
    mutationFn: async ({ mediaId }) => {
      await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ mediaId }),
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'favorites'] });
    },
  });
  const { mutateAsync: deleteFromFavorites } = useMutation<void, Error, { mediaId: number }>({
    mutationFn: async ({ mediaId }) => {
      await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ mediaId }),
      });
      queryClient.invalidateQueries({ queryKey: ['user', 'favorites'] });
    },
  });
  const { data: favoriteIds } = useQuery({
    queryKey: ['user', 'favorites'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const { data } = await response.json();

      return data as number[];
    },
  });

  const handleToggleFavorite = async (mediaId: number, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await deleteFromFavorites({ mediaId });
        notification.success({
          message: 'Removed from favorites',
          placement: 'bottomRight',
          duration: 2,
        });
      } else {
        await addToFavorites({ mediaId });
        notification.success({
          message: 'Added to favorites',
          placement: 'bottomRight',
          duration: 2,
        });
      }
    } catch {
      notification.error({
        message: 'Error updating favorites',
        description: 'Please try again later',
        placement: 'bottomRight',
      });
    }
  };

  // Function to toggle blur for a specific item
  const toggleBlur = (itemId: number) => {
    setUnblurredItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // React Query hook for fetching search results
  const {
    data: searchResults,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ['animeSearch', submittedQuery],
    queryFn: () => searchAnime(submittedQuery),
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleSearch = () => {
    setSubmittedQuery(searchQuery.trim());
    // Clear unblurred items when performing a new search
    setUnblurredItems(new Set());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  React.useEffect(() => {
    setSearchParams({ q: submittedQuery });
  }, [setSearchParams, submittedQuery]);

  // Filter results based on NSFW content setting
  const filteredResults = React.useMemo(() => {
    if (!searchResults) return [];

    // If user is not logged in or still loading, hide all NSFW content
    if (!user || isLoadingUser) {
      return searchResults.filter((item) => !item.isAdult);
    }

    const nsfwSetting = user.contentSettings.nsfwContent;

    // Handle based on user preference
    if (nsfwSetting === 'hide') {
      return searchResults.filter((item) => !item.isAdult);
    }

    // For 'blur' or 'show', return all results
    return searchResults;
  }, [searchResults, user, isLoadingUser]);

  return (
    <Layout className='layout'>
      <Header backButton onBack={handleBack}>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className='search-content'>
        <Space
          direction='vertical'
          style={{ width: '100%', backgroundColor: token.colorBgLayout }}
          className={isSuccess ? 'search-input-top no-search-input-top-noanim' : 'search-input-top'}>
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

        {!isLoading && filteredResults && filteredResults.length > 0 && (
          <div className='search-results'>
            <Typography.Title level={3}>Search Results</Typography.Title>
            <List
              itemLayout='vertical'
              dataSource={filteredResults}
              renderItem={(item) => {
                const isFavorite = favoriteIds?.includes(item.id) || false;
                const isNsfw = item.isAdult;
                const nsfwSetting = user?.contentSettings?.nsfwContent || 'hide';
                const isUnblurred = unblurredItems.has(item.id);
                const shouldBlur = isNsfw && nsfwSetting === 'blur' && !isUnblurred;

                return (
                  <List.Item className='search-media-entry'>
                    <Flex align='flex-start' justify='space-between' style={{ width: '100%' }}>
                      <List.Item.Meta
                        avatar={
                          <div style={{ position: 'relative' }}>
                            <Image
                              width={142}
                              height={200}
                              src={item.coverImage.large}
                              preview={{ src: item.coverImage.extraLarge }}
                              style={shouldBlur ? { filter: 'blur(10px)' } : {}}
                              wrapperStyle={shouldBlur ? { overflow: 'hidden' } : {}}
                            />
                            {shouldBlur && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  background: 'rgba(0,0,0,0.5)',
                                  padding: '5px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => toggleBlur(item.id)}>
                                <EyeInvisibleOutlined style={{ fontSize: '24px', color: 'white' }} />
                              </div>
                            )}
                            {isNsfw && (
                              <Tag color='red' style={{ position: 'absolute', top: 0, right: 0 }}>
                                18+
                              </Tag>
                            )}
                          </div>
                        }
                        title={
                          <Flex align='center' gap='small'>
                            <a href={item.siteUrl} style={{ color: token.colorText }}>
                              {item.title.english || item.title.romaji} {item.seasonYear ? `(${item.seasonYear})` : ''}
                            </a>
                            {isNsfw && <Tag color='red'>NSFW</Tag>}

                            {/* Add toggle blur button for NSFW content when setting is 'blur' */}
                            {isNsfw && nsfwSetting === 'blur' && (
                              <Button
                                type='text'
                                icon={isUnblurred ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBlur(item.id);
                                }}
                                size='small'
                                style={{ marginLeft: 8 }}
                                title={isUnblurred ? 'Blur content' : 'Unblur content'}
                              />
                            )}
                          </Flex>
                        }
                        description={
                          <div style={shouldBlur ? { filter: 'blur(5px)', userSelect: 'none' } : {}}>
                            {shouldBlur && (
                              <div style={{ marginBottom: 10 }}>
                                <Button
                                  type='primary'
                                  size='small'
                                  icon={<EyeOutlined />}
                                  onClick={() => toggleBlur(item.id)}>
                                  Show Content
                                </Button>
                              </div>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: item.description }} />
                            <div style={{ marginTop: 8 }}>
                              {item.genres.map((genre) => (
                                <Tag key={genre} color='blue'>
                                  {genre}
                                </Tag>
                              ))}
                              <Tag color='gold'>Rating: {item.averageScore / 10}/10</Tag>
                            </div>
                          </div>
                        }
                      />
                      <Flex vertical gap='small'>
                        <Tooltip
                          title={
                            !authToken
                              ? 'Log in to add to favorites'
                              : isFavorite
                              ? 'Remove from favorites'
                              : 'Add to favorites'
                          }
                          placement='left'>
                          <Button
                            key='favorite'
                            type={isFavorite ? 'primary' : 'default'}
                            shape='circle'
                            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                            onClick={() => handleToggleFavorite(item.id, isFavorite)}
                            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            disabled={!authToken}
                            style={{ marginLeft: 16 }}
                          />
                        </Tooltip>
                      </Flex>
                    </Flex>
                  </List.Item>
                );
              }}
            />
          </div>
        )}

        {!isLoading && searchResults && searchResults.length > 0 && filteredResults.length === 0 && (
          <div className='no-results'>
            <Typography.Text>
              Your content settings are hiding all results. You can adjust your NSFW content settings in your profile.
            </Typography.Text>
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
