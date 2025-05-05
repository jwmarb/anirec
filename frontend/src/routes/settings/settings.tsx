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
import useUser, { NsfwContentSetting } from '$/hooks/useUser';
import { useMessage } from '$/providers/message/context';
import { BACKEND_URL } from '$/constants';
import { useAuthStore } from '$/providers/auth/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SettingsState {
  // User Settings
  email: string;
  // Content Settings
  nsfwContentSetting: NsfwContentSetting;
  llmModel: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const [user] = useUser();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const message = useMessage();
  const [userForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [contentForm] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
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
      return r.data.map((x) => ({ value: x.id, label: x.id }));
    },
  });
  // const { } = useMutation({
  // 	mutationKey: ['']
  // })
  const notification = useNotification();

  // Initial settings values
  const initialSettings: SettingsState = {
    email: user?.email ?? '',
    nsfwContentSetting: user?.contentSettings.nsfwContent ?? 'hide',
    llmModel: user?.contentSettings.model ?? 'gpt-4.1',
  };

  const [settings, setSettings] = useState<SettingsState>(initialSettings);

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
  const handleSaveChanges = () => {
    if (activeTab === 'user') {
      const values = userForm.getFieldsValue();
      // api implementation
      setSettings((prev) => ({
        ...prev,
        email: values.email,
        avatar: values.avatar,
      }));
    } else {
      const values = contentForm.getFieldsValue();
      setSettings((prev) => ({
        ...prev,
        nsfwContentSetting: values.nsfwContentSetting,
        llmModel: values.llmModel,
      }));
    }

    setHasChanges(false);
    message.success('Settings saved successfully');
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
    passwordForm
      .validateFields()
      .then(async (values: PasswordFormData) => {
        // Validate that new password and confirm password match
        if (values.newPassword !== values.confirmPassword) {
          message.error('New password and confirm password do not match');
          return;
        }

        const r = await fetch(`${BACKEND_URL}/api/user`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            oldPassword: values.currentPassword,
            password: values.newPassword,
            confirmPassword: values.confirmPassword,
          }),
        });

        if (r.status !== 200) {
          message.error('Invalid password');
          passwordForm.setFields([
            {
              name: 'currentPassword',
              errors: ['Invalid password'],
            },
          ]);
          return;
        }

        // Reset form after successful update
        passwordForm.resetFields();
        message.success('Password updated successfully');
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
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
          <Tabs
            defaultActiveKey='user'
            onChange={(key) => {
              if (hasChanges) {
                // Prompt user to save changes before switching tabs
                const confirmed = window.confirm('You have unsaved changes. Save them before switching tabs?');
                if (confirmed) {
                  handleSaveChanges();
                } else {
                  handleDiscardChanges();
                }
              }
              setActiveTab(key);
            }}>
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

                  <Form.Item label='AI Recommendation Engine' name='llmModel'>
                    <Space direction='vertical' style={{ width: '100%' }}>
                      <Text type='secondary'>
                        Select which AI model to use for recommendations. Each model has different strengths.
                      </Text>
                      <Select
                        style={{ width: '100%' }}
                        options={llmOptions}
                        placeholder='Select AI model'
                        prefix={<RobotOutlined />}
                      />
                    </Space>
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
};

export default Settings;
