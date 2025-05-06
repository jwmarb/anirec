import { RecommendationsAPIResponse } from '$/components/SearchItem/SearchItem';
import useUser from '$/hooks/useUser';
import { CheckCircleFilled, CloseCircleFilled, EyeInvisibleOutlined } from '@ant-design/icons';
import { Flex, Image, List, Modal, Space, Spin, Tag, theme, Typography } from 'antd';
import React from 'react';

type RecommendationsProps = {
  visible: boolean;
  onClose: () => void;
  recommendations: RecommendationsAPIResponse;
  isLoading: boolean;
  isNSFW: boolean;
};

export default function DesktopRecommendations({
  visible,
  onClose,
  recommendations,
  isLoading,
  isNSFW,
}: RecommendationsProps) {
  const { token } = theme.useToken();
  const [unblur, setUnblur] = React.useState<boolean>(false);
  const [user] = useUser();

  const shouldBlur = isNSFW && user?.contentSettings.nsfwContent === 'blur' && !unblur;

  return (
    <Modal
      title='Similar Recommendations'
      open={visible}
      onCancel={onClose}
      footer={null}
      width='80%'
      style={{
        maxWidth: 1200,
      }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size='large' />
          <div style={{ marginTop: 16 }}>Loading recommendations...</div>
        </div>
      ) : recommendations && recommendations.data?.length > 0 ? (
        <List
          itemLayout='vertical'
          dataSource={recommendations.data}
          renderItem={(rec) => (
            <List.Item
              key={rec.media.id}
              extra={
                <div style={{ maxWidth: 320 }}>
                  {rec.would_recommend ? (
                    <Tag color='success' icon={<CheckCircleFilled />} style={{ padding: '8px 12px' }}>
                      Recommended
                    </Tag>
                  ) : (
                    <Tag color='error' icon={<CloseCircleFilled />} style={{ padding: '8px 12px' }}>
                      Not Recommended
                    </Tag>
                  )}
                  <Typography.Paragraph style={{ marginTop: 8 }}>{rec.reason}</Typography.Paragraph>
                </div>
              }>
              <List.Item.Meta
                avatar={
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                      <Image
                        width={80}
                        height={120}
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
                  <Flex vertical>
                    <a style={{ color: token.colorText }} href={rec.media.siteUrl}>
                      {rec.media.title.english || rec.media.title.romaji}
                    </a>
                    <Typography.Text type='secondary'>
                      {rec.media.title.romaji || rec.media.title.native}
                    </Typography.Text>
                  </Flex>
                }
                description={
                  <div style={{ position: 'relative' }}>
                    <Space direction='vertical' style={shouldBlur ? { filter: 'blur(5px)' } : {}}>
                      <div>
                        {rec.media.genres.map((genre: string) => (
                          <Tag key={genre} color='blue'>
                            {genre}
                          </Tag>
                        ))}
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: rec.media.description,
                        }}
                      />
                    </Space>
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
                        <EyeInvisibleOutlined style={{ fontSize: '24px', color: token.colorPrimary, zIndex: 2 }} />
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Typography.Title level={4}>No recommendations found</Typography.Title>
          <Typography.Paragraph>We couldn't find any similar media recommendations.</Typography.Paragraph>
        </div>
      )}
    </Modal>
  );
}
