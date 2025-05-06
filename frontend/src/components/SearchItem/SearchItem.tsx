import DesktopRecommendations from '$/components/DesktopRecommendations';
import MobileRecommendations from '$/components/MobileRecommendations';
import { BACKEND_URL } from '$/constants';
import useBreakpoint from '$/hooks/useBreakpoint';
import { Media } from '$/types';
import { BulbOutlined, EyeInvisibleOutlined, EyeOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Flex, Image, List, Tag, theme, Tooltip, Typography } from 'antd';
import React from 'react';
type SearchItemProps = {
  item: Media;
  isFavorite: boolean;
  nsfwSetting: 'show' | 'blur' | 'hide';
  isUnblurred: boolean;
  onToggleBlur: (itemId: number) => void;
  onToggleFavorite: (mediaId: number, isFavorite: boolean) => void;
  onGetRecommendations?: (medaId: number) => void;
  authToken?: string | null;
};

export type RecommendationsAPIResponse = {
  data: {
    media: {
      id: number;
      description: string;
      title: {
        english: string;
        romaji: string;
        native: string;
      };
      coverImage: {
        large: string;
        extraLarge: string;
      };
      genres: string[];
      siteUrl: string;
    };
    would_recommend: boolean;
    reason: string;
  }[];
  success: boolean;
};

const MAX_DESCRIPTION_HEIGHT = 100; // Height in pixels before truncating

const SearchItem = React.memo(
  ({ item, isFavorite, nsfwSetting, isUnblurred, onToggleBlur, onToggleFavorite, authToken }: SearchItemProps) => {
    const { token } = theme.useToken();
    const { isMobile } = useBreakpoint();
    const isNsfw = item.isAdult;
    const shouldBlur = isNsfw && nsfwSetting === 'blur' && !isUnblurred;
    const [shouldGetRecommendations, setShouldGetRecommendations] = React.useState<boolean>(false);
    const [showRecommendations, setShowRecommendations] = React.useState<boolean>(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [isDescriptionOverflowing, setIsDescriptionOverflowing] = React.useState(false);
    const descriptionRef = React.useRef<HTMLDivElement>(null);

    // Check if description is overflowing
    React.useEffect(() => {
      if (descriptionRef.current) {
        const element = descriptionRef.current;
        setIsDescriptionOverflowing(element.scrollHeight > element.clientHeight);
      }
    }, [item.description]);

    const { data: recommendations, isLoading } = useQuery({
      queryKey: [authToken, 'recommendations', item.id],
      queryFn: async () => {
        const data = await fetch(`${BACKEND_URL}/api/recommend/${item.id}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${authToken}` },
        }).then((r) => r.json());
        return data;
      },
      enabled: shouldGetRecommendations,
    });

    function handleGetRecommendations() {
      setShouldGetRecommendations(true);
      setShowRecommendations(true);
    }

    function handleModalClose() {
      setShowRecommendations(false);
    }

    const toggleDescription = () => {
      setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    return (
      <>
        <List.Item className='search-media-entry'>
          <Flex align='flex-start' justify='space-between' style={{ width: '100%' }}>
            <List.Item.Meta
              avatar={
                <div style={{ position: 'relative' }}>
                  <Image
                    width={isMobile ? 94 : 142}
                    height={isMobile ? 133 : 200}
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
                      onClick={() => onToggleBlur(item.id)}>
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
                  <Flex vertical>
                    <a href={item.siteUrl} style={{ color: token.colorText }}>
                      {item.title.english || item.title.romaji} {item.seasonYear ? `(${item.seasonYear})` : ''}
                    </a>
                    <Typography.Text type='secondary'>{item.title.romaji || item.title.native}</Typography.Text>
                  </Flex>
                  {isNsfw && <Tag color='red'>NSFW</Tag>}

                  {isNsfw && nsfwSetting === 'blur' && (
                    <Button
                      type='text'
                      icon={isUnblurred ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlur(item.id);
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
                      <Button type='primary' size='small' icon={<EyeOutlined />} onClick={() => onToggleBlur(item.id)}>
                        Show Content
                      </Button>
                    </div>
                  )}
                  <div
                    ref={descriptionRef}
                    style={{
                      maxHeight: isDescriptionExpanded ? 'none' : `${MAX_DESCRIPTION_HEIGHT}px`,
                      overflow: 'hidden',
                      position: 'relative',
                      marginBottom: isDescriptionOverflowing && !isDescriptionExpanded ? '8px' : '0',
                    }}>
                    <div dangerouslySetInnerHTML={{ __html: item.description }} />
                  </div>
                  {isDescriptionOverflowing && (
                    <Typography.Link onClick={toggleDescription} style={{ display: 'block', marginTop: '4px' }}>
                      {isDescriptionExpanded ? 'Show less' : 'Show more'}
                    </Typography.Link>
                  )}
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
                  !authToken ? 'Log in to add to favorites' : isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                placement='left'>
                <Button
                  key='favorite'
                  type={isFavorite ? 'primary' : 'default'}
                  shape='circle'
                  icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                  onClick={() => onToggleFavorite(item.id, isFavorite)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  disabled={!authToken}
                  style={{ marginLeft: 16 }}
                />
              </Tooltip>

              <Tooltip
                title={!authToken ? 'Log in to get recommendations' : 'Get similar recommendations'}
                placement='left'>
                <Button
                  key='recommend'
                  type='default'
                  shape='circle'
                  icon={<BulbOutlined />}
                  onClick={handleGetRecommendations}
                  title='Get similar recommendations'
                  disabled={!authToken}
                  style={{ marginLeft: 16 }}
                />
              </Tooltip>
            </Flex>
          </Flex>
        </List.Item>
        {isMobile ? (
          <MobileRecommendations
            visible={showRecommendations}
            onClose={handleModalClose}
            recommendations={recommendations}
            isLoading={isLoading}
          />
        ) : (
          <DesktopRecommendations
            visible={showRecommendations}
            onClose={handleModalClose}
            recommendations={recommendations}
            isLoading={isLoading}
          />
        )}
      </>
    );
  }
);

export default SearchItem;
