import { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Avatar,
  Upload,
  Space,
  Divider,
  message,
  Flex,
  Radio,
} from 'antd';
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

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SettingsState {
  // User Settings
  email: string;
  avatar: string;
  // Content Settings
  hide18Plus: boolean;
  blur18Plus: boolean;
  llmModel: string;
}

const Settings = () => {
  // const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [contentForm] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const notification = useNotification();

  // Initial settings values
  const initialSettings: SettingsState = {
    email: 'user@example.com',
    avatar: 'https://wallpapers.com/images/high/anime-profile-picture-jioug7q8n43yhlwn.webp',
    hide18Plus: false,
    blur18Plus: true,
    llmModel: 'gpt-4',
  };

  const [settings, setSettings] = useState<SettingsState>(initialSettings);

  // LLM model options
  const llmOptions = [
    { value: 'gpt-4', label: 'GPT-4 (Recommended)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' },
    { value: 'claude-3', label: 'Claude 3 (Balanced)' },
    { value: 'gemini-pro', label: 'Gemini Pro (Experimental)' },
  ];

  // Initialize forms with current settings
  useEffect(() => {
    userForm.setFieldsValue({
      email: settings.email,
      avatar: settings.avatar,
    });

    contentForm.setFieldsValue({
      hide18Plus: settings.hide18Plus,
      blur18Plus: settings.blur18Plus,
      llmModel: settings.llmModel,
    });
  }, [settings, userForm, contentForm]);

  // Check for changes in user settings
  const handleUserFormChange = () => {
    const currentValues = userForm.getFieldsValue();
    const hasUserChanges = currentValues.email !== settings.email || currentValues.avatar !== settings.avatar;

    setHasChanges(hasUserChanges);
  };

  // Check for changes in content settings
  const handleContentFormChange = () => {
    const currentValues = contentForm.getFieldsValue();
    const hasContentChanges =
      currentValues.hide18Plus !== settings.hide18Plus ||
      currentValues.blur18Plus !== settings.blur18Plus ||
      currentValues.llmModel !== settings.llmModel;

    setHasChanges(hasContentChanges);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (activeTab === 'user') {
      const values = userForm.getFieldsValue();
      setSettings((prev) => ({
        ...prev,
        email: values.email,
        avatar: values.avatar,
      }));
    } else {
      const values = contentForm.getFieldsValue();
      setSettings((prev) => ({
        ...prev,
        hide18Plus: values.hide18Plus,
        blur18Plus: values.blur18Plus,
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
        avatar: settings.avatar,
      });
    } else {
      contentForm.setFieldsValue({
        hide18Plus: settings.hide18Plus,
        blur18Plus: settings.blur18Plus,
        llmModel: settings.llmModel,
      });
    }

    setHasChanges(false);
    message.info('Changes discarded');
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
                    <Avatar src={userForm.getFieldValue('avatar')} size={100} />
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          if (e.target) {
                            userForm.setFieldsValue({ avatar: e.target.result });
                            handleUserFormChange();
                          }
                        };
                        reader.readAsDataURL(file);
                        return false;
                      }}>
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

                <Divider />

                <Form.Item label='Change Password'>
                  <Space direction='vertical' style={{ width: '100%' }}>
                    <Input.Password prefix={<LockOutlined />} placeholder='Current Password' />
                    <Input.Password prefix={<LockOutlined />} placeholder='New Password' />
                    <Input.Password prefix={<LockOutlined />} placeholder='Confirm New Password' />
                    <Flex justify='flex-end'>
                      <Button type='default'>Update Password</Button>
                    </Flex>
                  </Space>
                </Form.Item>
              </Form>
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
