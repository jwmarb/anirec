import { RecommendationsAPIResponse } from '$/components/SearchItem/SearchItem';
import useUser from '$/hooks/useUser';
import { CheckCircleFilled, CloseCircleFilled, EyeInvisibleOutlined } from '@ant-design/icons';
import { Collapse, Drawer, Flex, Image, List, Space, Spin, Tag, theme, Typography } from 'antd';
import React from 'react';

type RecommendationsProps = {
  visible: boolean;
  onClose: () => void;
  recommendations: RecommendationsAPIResponse;
  isLoading: boolean;
  isNSFW: boolean;
};

const Item = React.memo((props: { rec: RecommendationsAPIResponse['data'][0]; isNSFW: boolean }) => {
  const { token } = theme.useToken();
  const { rec, isNSFW } = props;
  const [user] = useUser();
  const [unblur, setUnblur] = React.useState<boolean>(false);
  const shouldBlur = isNSFW && user?.contentSettings.nsfwContent === 'blur' && !unblur;
  return (
    <List.Item
      key={rec.media.id}
      style={{
        backgroundColor: token.colorBorderBg,
        borderRadius: token.borderRadius,
        padding: '12px',
        marginBottom: '16px',
      }}>
      <List.Item.Meta
        avatar={
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Image
                width={60}
                height={90}
                src={rec.media.coverImage.large}
                preview={{ src: rec.media.coverImage.extraLarge }}
                style={shouldBlur ? { filter: 'blur(10px)' } : {}}
                wrapperStyle={shouldBlur ? { overflow: 'hidden' } : {}}
              />
              {shouldBlur && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setUnblur(true)}>
                  <EyeInvisibleOutlined style={{ fontSize: '24px', color: 'white', zIndex: 2 }} />
                </div>
              )}
            </div>
            {isNSFW && (
              <Tag color='red' style={{ position: 'absolute', top: 0, right: 0 }}>
                18+
              </Tag>
            )}
          </div>
        }
        title={
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap', // Allow wrapping on mobile
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '8px', // Add spacing when elements wrap
            }}>
            <Flex vertical>
              <a style={{ color: token.colorText }} href={rec.media.siteUrl}>
                {rec.media.title.english || rec.media.title.romaji}
              </a>
              <Typography.Text type='secondary'>{rec.media.title.romaji || rec.media.title.native}</Typography.Text>
            </Flex>
            <div style={{ flexShrink: 0 }}>
              {/* Prevent tag from shrinking */}
              {rec.would_recommend ? (
                <Tag color='success' icon={<CheckCircleFilled />} style={{ margin: 0 }}>
                  Recommended
                </Tag>
              ) : (
                <Tag color='error' icon={<CloseCircleFilled />} style={{ margin: 0 }}>
                  Not Recommended
                </Tag>
              )}
            </div>
          </div>
        }
        description={
          <Space direction='vertical' style={{ width: '100%' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  ...(shouldBlur ? { filter: 'blur(5px)' } : {}),
                }}>
                {rec.media.genres.slice(0, 3).map((genre: string) => (
                  <Tag key={genre} color='blue' style={{ marginBottom: '4px', marginRight: '0' }}>
                    {genre}
                  </Tag>
                ))}
                {rec.media.genres.length > 3 && (
                  <Tag style={{ marginBottom: '4px' }}>+{rec.media.genres.length - 3} more</Tag>
                )}
              </div>
              {shouldBlur && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => setUnblur(true)}>
                  <EyeInvisibleOutlined style={{ fontSize: '18px', color: token.colorPrimary, zIndex: 2 }} />
                </div>
              )}
            </div>

            <Collapse ghost>
              <Collapse.Panel header='Show description' key='1'>
                <div style={{ position: 'relative' }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: rec.media.description,
                    }}
                    style={{
                      ...(shouldBlur ? { filter: 'blur(5px)' } : {}),
                      fontSize: '14px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: '1.5',
                    }}
                  />
                  {shouldBlur && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => setUnblur(true)}>
                      <EyeInvisibleOutlined style={{ fontSize: '18px', color: token.colorPrimary, zIndex: 2 }} />
                    </div>
                  )}
                </div>
              </Collapse.Panel>
            </Collapse>
            <Typography.Paragraph
              style={{
                marginTop: 8,
                fontSize: '14px',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.5',
              }}
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
              {rec.reason}
            </Typography.Paragraph>
          </Space>
        }
      />
    </List.Item>
  );
});

export default function MobileRecommendations(props: RecommendationsProps) {
  const { visible, onClose, recommendations, isLoading, isNSFW } = props;
  function renderItem(rec: RecommendationsAPIResponse['data'][0]) {
    return <Item rec={rec} isNSFW={isNSFW} />;
  }
  return (
    <Drawer
      title='Similar Recommendations'
      placement='bottom'
      onClose={onClose}
      open={visible}
      height='90vh'
      styles={{ body: { padding: '12px', overflowY: 'auto' } }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size='large' />
          <div style={{ marginTop: 16 }}>Loading recommendations...</div>
        </div>
      ) : recommendations && recommendations.data?.length > 0 ? (
        <List itemLayout='vertical' dataSource={recommendations.data} renderItem={renderItem} />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography.Title level={4}>No recommendations found</Typography.Title>
          <Typography.Paragraph>We couldn't find any similar media recommendations.</Typography.Paragraph>
        </div>
      )}
    </Drawer>
  );
}
