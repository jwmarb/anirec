import { BACKEND_URL } from "$/constants";
import useBreakpoint from "$/hooks/useBreakpoint";
import { Media } from "$/types";
import {
  BulbOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  EyeInvisibleOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Collapse,
  Drawer,
  Flex,
  Image,
  List,
  Modal,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip,
  Typography,
} from "antd";
import React from "react";
type SearchItemProps = {
  item: Media;
  isFavorite: boolean;
  nsfwSetting: "show" | "blur" | "hide";
  isUnblurred: boolean;
  onToggleBlur: (itemId: number) => void;
  onToggleFavorite: (mediaId: number, isFavorite: boolean) => void;
  onGetRecommendations?: (medaId: number) => void;
  authToken?: string | null;
};

type RecommendationsProps = {
  visible: boolean;
  onClose: () => void;
  recommendations: any;
  isLoading: boolean;
};

const DesktopRecommendations: React.FC<RecommendationsProps> = ({
  visible,
  onClose,
  recommendations,
  isLoading,
}) => {
  return (
    <Modal
      title="Similar Recommendations"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="80%"
      style={{
        maxWidth: 1200,
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading recommendations...</div>
        </div>
      ) : recommendations && recommendations.data?.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={recommendations.data}
          renderItem={(rec: any) => (
            <List.Item
              key={rec.media.id}
              extra={
                <div style={{ maxWidth: 320 }}>
                  {rec.would_recommend ? (
                    <Tag
                      color="success"
                      icon={<CheckCircleFilled />}
                      style={{ padding: "8px 12px" }}
                    >
                      Recommended
                    </Tag>
                  ) : (
                    <Tag
                      color="error"
                      icon={<CloseCircleFilled />}
                      style={{ padding: "8px 12px" }}
                    >
                      Not Recommended
                    </Tag>
                  )}
                  <Typography.Paragraph style={{ marginTop: 8 }}>
                    {rec.reason}
                  </Typography.Paragraph>
                </div>
              }
            >
              <List.Item.Meta
                avatar={
                  <Image
                    width={80}
                    height={120}
                    src={rec.media.coverImage.large}
                    preview={{ src: rec.media.coverImage.extraLarge }}
                  />
                }
                title={
                  <a href={rec.media.siteUrl}>
                    {rec.media.title.english || rec.media.title.romaji}
                  </a>
                }
                description={
                  <Space direction="vertical">
                    <div>
                      {rec.media.genres.map((genre: string) => (
                        <Tag key={genre} color="blue">
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
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Typography.Title level={4}>
            No recommendations found
          </Typography.Title>
          <Typography.Paragraph>
            We couldn't find any similar media recommendations.
          </Typography.Paragraph>
        </div>
      )}
    </Modal>
  );
};

const MobileRecommendations: React.FC<RecommendationsProps> = ({
  visible,
  onClose,
  recommendations,
  isLoading,
}) => {
  const { token } = theme.useToken();
  return (
    <Drawer
      title="Similar Recommendations"
      placement="bottom"
      onClose={onClose}
      open={visible}
      height="90vh"
      bodyStyle={{ padding: "12px", overflowY: "auto" }}
    >
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading recommendations...</div>
        </div>
      ) : recommendations && recommendations.data?.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={recommendations.data}
          renderItem={(rec: any) => (
            <List.Item
              key={rec.media.id}
              style={{
                backgroundColor: token.colorBorderBg,
                borderRadius: token.borderRadius,
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Image
                    width={60}
                    height={90}
                    src={rec.media.coverImage.large}
                    preview={{ src: rec.media.coverImage.extraLarge }}
                    style={{ flexShrink: 0 }}
                  />
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap", // Allow wrapping on mobile
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px", // Add spacing when elements wrap
                    }}
                  >
                    <a
                      href={rec.media.siteUrl}
                      style={{
                        wordBreak: "break-word", // Better text wrapping
                        overflowWrap: "break-word",
                      }}
                    >
                      {rec.media.title.english || rec.media.title.romaji}
                    </a>
                    <div style={{ flexShrink: 0 }}>
                      {" "}
                      {/* Prevent tag from shrinking */}
                      {rec.would_recommend ? (
                        <Tag
                          color="success"
                          icon={<CheckCircleFilled />}
                          style={{ margin: 0 }}
                        >
                          Recommended
                        </Tag>
                      ) : (
                        <Tag
                          color="error"
                          icon={<CloseCircleFilled />}
                          style={{ margin: 0 }}
                        >
                          Not Recommended
                        </Tag>
                      )}
                    </div>
                  </div>
                }
                description={
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                    >
                      {rec.media.genres.slice(0, 3).map((genre: string) => (
                        <Tag
                          key={genre}
                          color="blue"
                          style={{ marginBottom: "4px", marginRight: "0" }}
                        >
                          {genre}
                        </Tag>
                      ))}
                      {rec.media.genres.length > 3 && (
                        <Tag style={{ marginBottom: "4px" }}>
                          +{rec.media.genres.length - 3} more
                        </Tag>
                      )}
                    </div>
                    <Collapse ghost>
                      <Collapse.Panel header="Show description" key="1">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: rec.media.description,
                          }}
                          style={{
                            fontSize: "14px",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            lineHeight: "1.5",
                          }}
                        />
                      </Collapse.Panel>
                    </Collapse>
                    <Typography.Paragraph
                      style={{
                        marginTop: 8,
                        fontSize: "14px",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: "1.5",
                      }}
                      ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
                    >
                      {rec.reason}
                    </Typography.Paragraph>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Typography.Title level={4}>
            No recommendations found
          </Typography.Title>
          <Typography.Paragraph>
            We couldn't find any similar media recommendations.
          </Typography.Paragraph>
        </div>
      )}
    </Drawer>
  );
};

const SearchItem = React.memo(
  ({
    item,
    isFavorite,
    nsfwSetting,
    isUnblurred,
    onToggleBlur,
    onToggleFavorite,
    authToken,
  }: SearchItemProps) => {
    const { token } = theme.useToken();
    const { isMobile } = useBreakpoint();
    const isNsfw = item.isAdult;
    const shouldBlur = isNsfw && nsfwSetting === "blur" && !isUnblurred;
    const [shouldGetRecommendations, setShouldGetRecommendations] =
      React.useState<boolean>(false);
    const [showRecommendations, setShowRecommendations] =
      React.useState<boolean>(false);
    const { data: recommendations, isLoading } = useQuery({
      queryKey: ["recommendations", item.id],
      queryFn: async () => {
        const data = await fetch(`${BACKEND_URL}/api/recommend/${item.id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` },
        }).then((r) => r.json());
        return data as {
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

    return (
      <>
        <List.Item className="search-media-entry">
          <Flex
            align="flex-start"
            justify="space-between"
            style={{ width: "100%" }}
          >
            <List.Item.Meta
              avatar={
                <div style={{ position: "relative" }}>
                  <Image
                    width={142}
                    height={200}
                    src={item.coverImage.large}
                    preview={{ src: item.coverImage.extraLarge }}
                    style={shouldBlur ? { filter: "blur(10px)" } : {}}
                    wrapperStyle={shouldBlur ? { overflow: "hidden" } : {}}
                  />
                  {shouldBlur && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0,0,0,0.5)",
                        padding: "5px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={() => onToggleBlur(item.id)}
                    >
                      <EyeInvisibleOutlined
                        style={{ fontSize: "24px", color: "white" }}
                      />
                    </div>
                  )}
                  {isNsfw && (
                    <Tag
                      color="red"
                      style={{ position: "absolute", top: 0, right: 0 }}
                    >
                      18+
                    </Tag>
                  )}
                </div>
              }
              title={
                <Flex align="center" gap="small">
                  <a href={item.siteUrl} style={{ color: token.colorText }}>
                    {item.title.english || item.title.romaji}{" "}
                    {item.seasonYear ? `(${item.seasonYear})` : ""}
                  </a>
                  {isNsfw && <Tag color="red">NSFW</Tag>}

                  {isNsfw && nsfwSetting === "blur" && (
                    <Button
                      type="text"
                      icon={
                        isUnblurred ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBlur(item.id);
                      }}
                      size="small"
                      style={{ marginLeft: 8 }}
                      title={isUnblurred ? "Blur content" : "Unblur content"}
                    />
                  )}
                </Flex>
              }
              description={
                <div
                  style={
                    shouldBlur
                      ? { filter: "blur(5px)", userSelect: "none" }
                      : {}
                  }
                >
                  {shouldBlur && (
                    <div style={{ marginBottom: 10 }}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => onToggleBlur(item.id)}
                      >
                        Show Content
                      </Button>
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: item.description }} />
                  <div style={{ marginTop: 8 }}>
                    {item.genres.map((genre) => (
                      <Tag key={genre} color="blue">
                        {genre}
                      </Tag>
                    ))}
                    <Tag color="gold">Rating: {item.averageScore / 10}/10</Tag>
                  </div>
                </div>
              }
            />
            <Flex vertical gap="small">
              <Tooltip
                title={
                  !authToken
                    ? "Log in to add to favorites"
                    : isFavorite
                    ? "Remove from favorites"
                    : "Add to favorites"
                }
                placement="left"
              >
                <Button
                  key="favorite"
                  type={isFavorite ? "primary" : "default"}
                  shape="circle"
                  icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                  onClick={() => onToggleFavorite(item.id, isFavorite)}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                  disabled={!authToken}
                  style={{ marginLeft: 16 }}
                />
              </Tooltip>

              <Tooltip
                title={
                  !authToken
                    ? "Log in to get recommendations"
                    : "Get similar recommendations"
                }
                placement="left"
              >
                <Button
                  key="recommend"
                  type="default"
                  shape="circle"
                  icon={<BulbOutlined />}
                  onClick={handleGetRecommendations}
                  title="Get similar recommendations"
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
