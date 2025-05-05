import { Media } from "$/types";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
} from "@ant-design/icons";
import { Button, Flex, Image, List, Tag, theme, Tooltip } from "antd";
import React from "react";
type SearchItemProps = {
  item: Media;
  isFavorite: boolean;
  nsfwSetting: "show" | "blur" | "hide";
  isUnblurred: boolean;
  onToggleBlur: (itemId: number) => void;
  onToggleFavorite: (mediaId: number, isFavorite: boolean) => void;
  authToken?: string | null;
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
    const isNsfw = item.isAdult;
    const shouldBlur = isNsfw && nsfwSetting === "blur" && !isUnblurred;

    return (
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
                  shouldBlur ? { filter: "blur(5px)", userSelect: "none" } : {}
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
          </Flex>
        </Flex>
      </List.Item>
    );
  }
);

export default SearchItem;
