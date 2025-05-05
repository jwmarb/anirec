/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Layout, Typography, Tabs, Form, Input, Button, Select, Upload, Space, Divider, Flex, Radio } from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UploadOutlined,
  SaveOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  RobotOutlined,
  StopOutlined,
} from '@ant-design/icons';
import ToggleTheme from '$/components/ToggleTheme';
import { useNotification } from '$/providers/notification/context';
import './settings.css';
import Header from '$/components/Header';
import AvatarMenu from '$/components/AvatarMenu';
import UserAvatar from '$/components/UserAvatar';
import useUser, { ContentSettings, NsfwContentSetting } from '$/hooks/useUser';
import { useMessage } from '$/providers/message/context';
import { BACKEND_URL } from '$/constants';
import { useAuthStore } from '$/providers/auth/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { withProtectedRoute } from '$/providers/auth/hoc';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SettingsState {
  // User Settings
  email: string;
  // Content Settings
  nsfwContentSetting: NsfwContentSetting;
  llmModel: string | null;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UpdateUserDataPayload {
  interests: string;
  about: string;
  email: string;
}

const Settings = withProtectedRoute(() => {
  const [user] = useUser();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const message = useMessage();
  const notification = useNotification();

  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [contentForm] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('user');

  // Query for model options
  const { data: llmOptions } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const r = (await response.json()) as {
        data: {
          id: string;
        }[];
      };
      const k: {
        value: string | null;
        label: string;
      }[] = r.data.map((x) => ({ value: x.id, label: x.id }));
      k.unshift({ label: '(Default)', value: null });
      return k;
    },
  });

  // Mutation for content settings
  const { mutateAsync: updateContentSettings } = useMutation<ContentSettings, Error, ContentSettings>({
    mutationKey: ['content', token],
    mutationFn: async (content) => {
      const response = await fetch(`${BACKEND_URL}/api/user/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Could not change content settings.');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', token] });
      message.success('Content settings saved successfully');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  // Mutation for user settings
  const { mutateAsync: updateUserSettings } = useMutation<any, Error, UpdateUserDataPayload>({
    mutationKey: ['user-settings', token],
    mutationFn: async (userData) => {
      const response = await fetch(`${BACKEND_URL}/api/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Could not update user settings.');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', token] });
      message.success('User settings saved successfully');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  // Mutation for password update
  const { mutateAsync: updatePassword } = useMutation<any, Error, PasswordFormData>({
    mutationKey: ['password', token],
    mutationFn: async (passwordData) => {
      const response = await fetch(`${BACKEND_URL}/api/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          password: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid password');
      }

      return await response.json();
    },
    onSuccess: () => {
      passwordForm.resetFields();
      message.success('Password updated successfully');
    },
    onError: (error) => {
      passwordForm.setFields([
        {
          name: 'currentPassword',
          errors: [error.message],
        },
      ]);
    },
  });

  // Initial settings values
  const initialSettings: SettingsState = {
    email: user?.email ?? '',
    nsfwContentSetting: user?.contentSettings.nsfwContent ?? 'hide',
    llmModel: user?.contentSettings.model ?? '',
  };

  const [settings, setSettings] = useState<SettingsState>(initialSettings);

  useEffect(() => {
    if (user != null && llmOptions?.length) {
      setSettings({
        email: user.email,
        llmModel: user.contentSettings?.model,
        nsfwContentSetting: user.contentSettings.nsfwContent,
      });
    }
  }, [user, llmOptions]);

  // Initialize forms with current settings
  useEffect(() => {
    userForm.setFieldsValue({
      email: settings.email,
    });

    contentForm.setFieldsValue({
      nsfwContentSetting: settings.nsfwContentSetting,
      llmModel: settings.llmModel,
    });
  }, [settings, userForm, contentForm]);

  // Check for changes in user settings
  const handleUserFormChange = () => {
    const currentValues = userForm.getFieldsValue();
    const hasUserChanges = currentValues.email !== settings.email;
    setHasChanges(hasUserChanges);
  };

  // Check for changes in content settings
  const handleContentFormChange = () => {
    const currentValues = contentForm.getFieldsValue();
    const hasContentChanges =
      currentValues.nsfwContentSetting !== settings.nsfwContentSetting || currentValues.llmModel !== settings.llmModel;

    setHasChanges(hasContentChanges);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      if (activeTab === 'user') {
        const values = userForm.getFieldsValue();
        await updateUserSettings(values);
        setSettings((prev) => ({
          ...prev,
          email: values.email,
        }));
      } else {
        const values = contentForm.getFieldsValue();
        const updatedSettings = await updateContentSettings({
          model: values.llmModel,
          nsfwContent: values.nsfwContentSetting,
        });
        setSettings((prev) => ({
          ...prev,
          nsfwContentSetting: updatedSettings.nsfwContent,
          llmModel: updatedSettings.model ?? prev.llmModel,
        }));
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    if (activeTab === 'user') {
      userForm.setFieldsValue({
        email: settings.email,
      });
    } else {
      contentForm.setFieldsValue({
        nsfwContentSetting: settings.nsfwContentSetting,
        llmModel: settings.llmModel,
      });
    }

    setHasChanges(false);
    message.info('Changes discarded');
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    try {
      const values = await passwordForm.validateFields();

      // Validate that new password and confirm password match
      if (values.newPassword !== values.confirmPassword) {
        message.error('New password and confirm password do not match');
        return;
      }

      await updatePassword(values);
    } catch (error) {
      console.log('Validate Failed:', error);
    }
  };

  // Show notification when changes are detected
  useEffect(() => {
    if (hasChanges) {
      notification.open({
        message: 'Unsaved Changes',
        description: 'You have unsaved changes. Would you like to save them now?',
        duration: 0,
        placement: 'bottom',
        type: 'warning',
        key: 'settings-changes',
        btn: (
          <Space>
            <Button
              onClick={() => {
                notification.destroy('settings-changes');
                handleDiscardChanges();
              }}>
              Discard
            </Button>
            <Button
              type='primary'
              onClick={() => {
                notification.destroy('settings-changes');
                handleSaveChanges();
              }}>
              Save
            </Button>
          </Space>
        ),
      });
    } else {
      notification.destroy('settings-changes');
    }

    return () => {
      notification.destroy('settings-changes');
    };
  }, [hasChanges]);

  const handleTabChange = (key: string) => {
    if (hasChanges) {
      // Prompt user to save changes before switching tabs
      const confirmed = window.confirm('You have unsaved changes. Save them before switching tabs?');
      if (confirmed) {
        handleSaveChanges().then(() => setActiveTab(key));
      } else {
        handleDiscardChanges();
        setActiveTab(key);
      }
    } else {
      setActiveTab(key);
    }
  };

  return (
    <Layout className='layout'>
      <Header backButton>
        <ToggleTheme />
        <AvatarMenu />
      </Header>
      <main className='settings-content'>
        <div className='settings-container'>
          <Title level={2}>Settings</Title>
          <Text type='secondary'>Customize your experience</Text>
          <Tabs defaultActiveKey='user' activeKey={activeTab} onChange={handleTabChange}>
            <TabPane tab='User Settings' key='user'>
              <Form form={userForm} layout='vertical' onValuesChange={handleUserFormChange}>
                <Form.Item label='Profile Picture' name='avatar'>
                  <Space direction='vertical' align='center' style={{ width: '100%' }}>
                    <UserAvatar size={100} />
                    <Upload
                      method='POST'
                      action={`${BACKEND_URL}/api/user/avatar`}
                      name='avatar'
                      headers={{
                        Authorization: `Bearer ${token}`,
                      }}
                      onChange={(info) => {
                        if (info.file.status === 'done') {
                          message.success(`Avatar changed`);
                          queryClient.invalidateQueries({ queryKey: ['user', token] });
                        } else if (info.file.status === 'error') {
                          message.error(info.file.response.error);
                        }
                      }}
                      showUploadList={false}>
                      <Button icon={<UploadOutlined />}>Change Avatar</Button>
                    </Upload>
                  </Space>
                </Form.Item>

                <Form.Item
                  label='Email'
                  name='email'
                  rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                  <Input prefix={<MailOutlined />} placeholder='Email' />
                </Form.Item>
              </Form>

              <Divider />

              {/* Separate password form to avoid nesting forms */}
              <div className='password-section'>
                <Typography.Title level={5}>Change Password</Typography.Title>
                <Form form={passwordForm} layout='vertical'>
                  <Space direction='vertical' style={{ width: '100%' }}>
                    <Form.Item
                      name='currentPassword'
                      rules={[{ required: true, message: 'Please enter your current password' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder='Current Password' />
                    </Form.Item>

                    <Form.Item
                      name='newPassword'
                      rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 6, message: 'Password must be at least 6 characters' },
                        { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
                        { pattern: /[^a-zA-Z0-9]/, message: 'Password must contain at least one special character' },
                      ]}>
                      <Input.Password prefix={<LockOutlined />} placeholder='New Password' />
                    </Form.Item>

                    <Form.Item
                      name='confirmPassword'
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords do not match'));
                          },
                        }),
                      ]}>
                      <Input.Password prefix={<LockOutlined />} placeholder='Confirm New Password' />
                    </Form.Item>

                    <Flex justify='flex-end'>
                      <Button type='default' onClick={handleUpdatePassword}>
                        Update Password
                      </Button>
                    </Flex>
                  </Space>
                </Form>
              </div>
            </TabPane>

            <TabPane tab='Content Settings' key='content'>
              <Form form={contentForm} layout='vertical' onValuesChange={handleContentFormChange}>
                <Flex vertical>
                  <Form.Item
                    label='NSFW Content'
                    help='Control how NSFW (18+) content is displayed throughout the application'
                    name='nsfwContentSetting'>
                    <Radio.Group buttonStyle='solid'>
                      <Radio.Button value='show'>
                        <Space>
                          Show
                          <EyeOutlined />
                        </Space>
                      </Radio.Button>
                      <Radio.Button value='blur'>
                        <Space>
                          Blur
                          <EyeInvisibleOutlined />
                        </Space>
                      </Radio.Button>
                      <Radio.Button value='hide'>
                        <Space>
                          Hide
                          <StopOutlined />
                        </Space>
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Divider />

                  <Form.Item
                    label='AI Recommendation Engine'
                    name='llmModel'
                    help='Select which AI model to use for content recommendations and responses'>
                    <Select
                      style={{ width: '100%' }}
                      options={llmOptions}
                      placeholder='Select AI model'
                      loading={!llmOptions}
                      disabled={!llmOptions || llmOptions.length === 0}
                      prefix={<RobotOutlined />}
                    />
                  </Form.Item>
                </Flex>
              </Form>
            </TabPane>
          </Tabs>

          {hasChanges && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={handleDiscardChanges}>Cancel</Button>
              <Button type='primary' icon={<SaveOutlined />} onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
});

export default Settings;
