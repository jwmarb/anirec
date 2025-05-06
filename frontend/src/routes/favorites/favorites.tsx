import { useState } from 'react';
import { Layout, Typography, List, Space, Spin, Empty, Button, theme, Modal } from 'antd';
import { HeartOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ToggleTheme from '$/components/ToggleTheme';
import Header from '$/components/Header';
import AvatarMenu from '$/components/AvatarMenu';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '$/providers/notification/context';
import { useAuthStore } from '$/providers/auth/store';
import useUser from '$/hooks/useUser';
import { Media } from '$/types';
import SearchItem from '$/components/SearchItem';
import { withProtectedRoute } from '$/providers/auth/hoc';
import './favorites.css';
import { BACKEND_URL } from '$/constants';

const { Title, Text } = Typography;

const Favorites = withProtectedRoute(() => {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const authToken = useAuthStore((s) => s.token);
  const [user, isLoadingUser] = useUser();

  // Track unblurred items (for NSFW content)
  const [unblurredItems, setUnblurredItems] = useState<Set<number>>(new Set());

  // State for the confirmation modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [mediaToRemove, setMediaToRemove] = useState<{ id: number; title: string } | null>(null);

  // Toggle blur function
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

  // Fetch favorites - using mock data for now
  // In the future, this would be replaced with a real API call
  const {
    data: favorites,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [authToken, 'favorites'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/user/favorites?populate=true`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();

      return data.data as Media[];
    },
    enabled: !!authToken,
  });

  // Remove from favorites mutation
  const { mutateAsync: deleteFromFavorites, isPending: isDeleting } = useMutation<void, Error, { mediaId: number }>({
    mutationFn: async ({ mediaId }) => {
      await fetch(`${BACKEND_URL}/api/user/favorites`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ mediaId }),
      });

      queryClient.invalidateQueries({ queryKey: [authToken, 'favorites'] });
    },
    onSuccess: () => {
      notification.success({
        message: 'Removed from favorites',
        placement: 'bottomRight',
        duration: 2,
      });
    },
    onError: () => {
      notification.error({
        message: 'Error removing from favorites',
        description: 'Please try again later',
        placement: 'bottomRight',
      });
    },
  });

  const openRemoveConfirmation = (mediaId: number, title: string) => {
    setMediaToRemove({ id: mediaId, title });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setMediaToRemove(null);
  };

  const handleModalConfirm = async () => {
    if (mediaToRemove) {
      try {
        await deleteFromFavorites({ mediaId: mediaToRemove.id });
        setIsModalVisible(false);
        setMediaToRemove(null);
      } catch (error) {
        console.error('Error removing from favorites:', error);
      }
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Filter results based on NSFW content setting
  const filteredFavorites = favorites
    ? favorites.filter((item) => {
        if (!user || isLoadingUser) return !item.isAdult;
        const nsfwSetting = user.contentSettings.nsfwContent;
        return nsfwSetting === 'hide' ? !item.isAdult : true;
      })
    : [];

  const renderItem = (item: Media) => {
    const isUnblurred = unblurredItems.has(item.id);
    const nsfwSetting = user?.contentSettings?.nsfwContent || 'hide';
    const displayTitle = item.title.english || item.title.romaji || item.title.native || 'Anime';

    return (
      <SearchItem
        item={item}
        isFavorite={true}
        nsfwSetting={nsfwSetting as 'show' | 'blur' | 'hide'}
        isUnblurred={isUnblurred}
        onToggleBlur={toggleBlur}
        onToggleFavorite={() => openRemoveConfirmation(item.id, displayTitle)}
        authToken={authToken}
      />
    );
  };

  return (
    <Layout className='layout'>
      <Header backButton onBack={handleBack}>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className='favorites-content'>
        <Space direction='vertical' style={{ width: '100%', padding: '20px' }}>
          <Title level={2}>
            <HeartOutlined style={{ marginRight: '10px', color: token.colorPrimary }} />
            My Favorites
          </Title>
          <Text type='secondary'>Your collection of favorite Asian media</Text>

          {isLoading && (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          )}

          {isError && (
            <div className='error-container'>
              <Text type='danger'>Failed to load favorites. Please try again later.</Text>
            </div>
          )}

          {!isLoading && filteredFavorites && filteredFavorites.length === 0 && (
            <Empty description="You haven't added any favorites yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type='primary' onClick={() => navigate('/search')}>
                Discover Content
              </Button>
            </Empty>
          )}

          {!isLoading && filteredFavorites && filteredFavorites.length > 0 && (
            <div className='favorites-list'>
              <List itemLayout='vertical' dataSource={filteredFavorites} renderItem={renderItem} />
            </div>
          )}
        </Space>
      </main>

      {/* Confirmation Modal */}
      <Modal
        title='Remove from favorites?'
        open={isModalVisible}
        onCancel={handleModalCancel}
        confirmLoading={isDeleting}
        okText='Remove'
        cancelText='Cancel'
        okButtonProps={{ danger: true }}
        onOk={handleModalConfirm}>
        <Space>
          <ExclamationCircleOutlined style={{ color: token.colorWarning, fontSize: '22px' }} />
          <Text>
            Are you sure you want to remove "{mediaToRemove?.title}" from your favorites? You'll need to search for it
            again to add it back.
          </Text>
        </Space>
      </Modal>
    </Layout>
  );
});

export default Favorites;
