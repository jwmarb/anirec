import {
  Input,
  Button,
  Typography,
  Layout,
  Space,
  Spin,
  List,
  theme,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import ToggleTheme from "$/components/ToggleTheme";
import Header from "$/components/Header";
import AvatarMenu from "$/components/AvatarMenu";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "./search.css";
import useWindowWidth from "$/hooks/useWindowWidth";
import React from "react";
import { BACKEND_URL } from "$/constants";
import { useNotification } from "$/providers/notification/context";
import { useAuthStore } from "$/providers/auth/store";
import useUser from "$/hooks/useUser";
import { Media } from "$/types";
import SearchItem from "$/components/SearchItem";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = React.useState<string>(
    searchParams.get("q") || ""
  );
  const [submittedQuery, setSubmittedQuery] = React.useState<string>(
    searchParams.get("q") || ""
  );
  const queryClient = useQueryClient();
  const notification = useNotification();
  const windowWidth = useWindowWidth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const authToken = useAuthStore((s) => s.token);
  const [user, isLoadingUser] = useUser();

  // Keep track of unblurred items
  const [unblurredItems, setUnblurredItems] = React.useState<Set<number>>(
    new Set()
  );

  const searchAnime = async (query: string): Promise<Media[]> => {
    return fetch(`${BACKEND_URL}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then((r) => r.data);
  };
  const { mutateAsync: addToFavorites } = useMutation<
    void,
    Error,
    { mediaId: number }
  >({
    mutationFn: async ({ mediaId }) => {
      await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ mediaId }),
      });
      queryClient.invalidateQueries({ queryKey: ["user", "favorites"] });
    },
  });
  const { mutateAsync: deleteFromFavorites } = useMutation<
    void,
    Error,
    { mediaId: number }
  >({
    mutationFn: async ({ mediaId }) => {
      await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ mediaId }),
      });
      queryClient.invalidateQueries({ queryKey: ["user", "favorites"] });
    },
  });
  const { data: favoriteIds } = useQuery({
    queryKey: ["user", "favorites"],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const { data } = await response.json();

      return data as number[];
    },
  });

  const handleToggleFavorite = React.useCallback(
    async (mediaId: number, isFavorite: boolean) => {
      try {
        if (isFavorite) {
          await deleteFromFavorites({ mediaId });
          notification.success({
            message: "Removed from favorites",
            placement: "bottomRight",
            duration: 2,
          });
        } else {
          await addToFavorites({ mediaId });
          notification.success({
            message: "Added to favorites",
            placement: "bottomRight",
            duration: 2,
          });
        }
      } catch {
        notification.error({
          message: "Error updating favorites",
          description: "Please try again later",
          placement: "bottomRight",
        });
      }
    },
    [deleteFromFavorites, notification, addToFavorites]
  );

  // Function to toggle blur for a specific item
  const toggleBlur = React.useCallback(
    (itemId: number) => {
      setUnblurredItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    },
    [setUnblurredItems]
  );

  // React Query hook for fetching search results
  const {
    data: searchResults,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["animeSearch", submittedQuery],
    queryFn: () => searchAnime(submittedQuery),
  });

  const handleBack = () => {
    navigate("/");
  };

  const handleSearch = () => {
    setSubmittedQuery(searchQuery.trim());
    // Clear unblurred items when performing a new search
    setUnblurredItems(new Set());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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
    if (nsfwSetting === "hide") {
      return searchResults.filter((item) => !item.isAdult);
    }

    // For 'blur' or 'show', return all results
    return searchResults;
  }, [searchResults, user, isLoadingUser]);

  const renderItem = React.useCallback(
    (item: Media) => {
      const isFavorite = favoriteIds?.includes(item.id) || false;
      const isUnblurred = unblurredItems.has(item.id);
      const nsfwSetting = user?.contentSettings?.nsfwContent || "hide";

      return (
        <SearchItem
          item={item}
          isFavorite={isFavorite}
          nsfwSetting={nsfwSetting as "show" | "blur" | "hide"}
          isUnblurred={isUnblurred}
          onToggleBlur={toggleBlur}
          onToggleFavorite={handleToggleFavorite}
          authToken={authToken}
        />
      );
    },
    [
      unblurredItems,
      favoriteIds,
      user?.contentSettings.nsfwContent,
      toggleBlur,
      handleToggleFavorite,
      authToken,
    ]
  );

  return (
    <Layout className="layout">
      <Header backButton onBack={handleBack}>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className="search-content">
        <Space
          direction="vertical"
          style={{ width: "100%", backgroundColor: token.colorBgLayout }}
          className={
            isSuccess
              ? "search-input-top no-search-input-top-noanim"
              : "search-input-top"
          }
        >
          {windowWidth > 1024 && (
            <>
              <Typography.Title
                level={1}
                className="search-title search-fade-away"
              >
                Discover Your Next Anime & Manga Adventure
              </Typography.Title>
              <Typography.Text className="search-subtitle search-fade-away">
                Find personalized recommendations based on your interests
              </Typography.Text>
            </>
          )}
          <div className="search-input-container">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe what you're looking for, e.g., 'Action anime with strong female leads'"
              size="large"
              className="search-input"
              suffix={
                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  onClick={handleSearch}
                  className="search-button"
                />
              }
            />
          </div>
        </Space>

        {isLoading && <Spin size="large" className="search-spinner" />}

        {isError && (
          <div className="search-error">
            <Typography.Text type="danger">
              An error occurred while searching. Please try again.
            </Typography.Text>
          </div>
        )}

        {!isLoading && filteredResults && filteredResults.length > 0 && (
          <div className="search-results">
            <Typography.Title level={3}>Search Results</Typography.Title>
            <List
              itemLayout="vertical"
              dataSource={filteredResults}
              renderItem={renderItem}
            />
          </div>
        )}

        {!isLoading &&
          searchResults &&
          searchResults.length > 0 &&
          filteredResults.length === 0 && (
            <div className="no-results">
              <Typography.Text>
                Your content settings are hiding all results. You can adjust
                your NSFW content settings in your profile.
              </Typography.Text>
            </div>
          )}

        {!isLoading &&
          searchResults &&
          searchResults.length === 0 &&
          submittedQuery && (
            <div className="no-results">
              <Typography.Text>
                No results found for "{submittedQuery}". Try different keywords.
              </Typography.Text>
            </div>
          )}
      </main>
    </Layout>
  );
}
