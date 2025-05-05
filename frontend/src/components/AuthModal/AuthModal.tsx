import React, { useState } from 'react';
import { Modal, Tabs, Form, Input, Button, Checkbox, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import styles from './AuthModal.module.css';
import { useAuthStore } from '$/providers/auth/store';
import { useNotification } from '$/providers/notification/context';
import { BACKEND_URL } from '$/constants';
import { useMessage } from '$/providers/message/context';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = React.useState<boolean>(false);
  const message = useMessage();
  const setToken = useAuthStore((s) => s.setToken);
  const notification = useNotification();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    loginForm.resetFields();
    registerForm.resetFields();
  };

  const handleLogin = async (values: any) => {
    console.log('Login form submitted:', values);
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          rememberMe: values.remember || false,
        }),
      });
      const a = await response.json();
      if (response.status === 200 && a.data) {
        setToken(a.data);
        message.success({
          key: 'login-success',
          content: 'Successfully logged in',
          duration: 3,
        });
        loginForm.setFields([
          {
            name: 'username',
            value: '',
          },
          {
            name: 'password',
            value: '',
          },
          {
            name: 'remember',
            value: false,
          },
        ]);
      } else {
        throw a;
      }
      onClose();
    } catch (e) {
      console.log(e);
      message.error((e as { error: string }).error);
      loginForm.setFields([
        {
          name: 'username',
          errors: ['Invalid username or password'],
        },
        {
          name: 'password',
          errors: ['Invalid username or password'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    console.log('Register form submitted:', values);
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      await response.json();

      message.success({
        key: 'register-success',
        content: 'Account successfully created. Please log in.',
      });
      registerForm.setFields([
        {
          name: 'username',
          value: '',
        },
        {
          name: 'email',
          value: '',
        },
        {
          name: 'password',
          value: '',
        },
        {
          name: 'confirmPassword',
          value: '',
        },
      ]);
      setActiveTab('login');
    } catch (e) {
      notification.error({
        key: 'failed-register',
        message: 'Failed to register',
        description: e instanceof Error ? e.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
      title={null}
      className={styles.authModal}>
      <Tabs activeKey={activeTab} onChange={handleTabChange} centered>
        <TabPane tab='Login' key='login'>
          <Title level={4} className={styles.modalTitle}>
            Welcome Back
          </Title>
          <Text type='secondary'>Sign in to continue to your account</Text>

          <Form form={loginForm} name='login' onFinish={handleLogin} layout='vertical' className={styles.form}>
            <Form.Item name='username' rules={[{ required: true, message: 'Please enter your username!' }]}>
              <Input prefix={<UserOutlined />} placeholder='Username' size='large' />
            </Form.Item>

            <Form.Item name='password' rules={[{ required: true, message: 'Please enter your password!' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder='Password' size='large' />
            </Form.Item>

            <Form.Item>
              <Form.Item name='remember' valuePropName='checked' noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit' size='large' block loading={loading} disabled={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.switchMode}>
            <Text type='secondary'>Don't have an account?</Text>
            <Button type='link' onClick={() => handleTabChange('register')}>
              Sign up now
            </Button>
          </div>
        </TabPane>

        <TabPane tab='Register' key='register'>
          <Title level={4} className={styles.modalTitle}>
            Create an Account
          </Title>
          <Text type='secondary'>Sign up to get started</Text>

          <Form form={registerForm} name='register' onFinish={handleRegister} layout='vertical' className={styles.form}>
            <Form.Item name='username' rules={[{ required: true, message: 'Please enter your username!' }]}>
              <Input prefix={<UserOutlined />} placeholder='Username' size='large' />
            </Form.Item>

            <Form.Item
              name='email'
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}>
              <Input prefix={<MailOutlined />} placeholder='Email' size='large' />
            </Form.Item>

            <Form.Item
              name='password'
              rules={[
                { required: true, message: 'Please enter your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
                { pattern: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
                { pattern: /[^a-zA-Z0-9]/, message: 'Password must contain at least one special character' },
              ]}>
              <Input.Password prefix={<LockOutlined />} placeholder='Password' size='large' />
            </Form.Item>

            <Form.Item
              name='confirmPassword'
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}>
              <Input.Password prefix={<LockOutlined />} placeholder='Confirm Password' size='large' />
            </Form.Item>

            <Form.Item
              name='agreement'
              valuePropName='checked'
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('You must accept the terms and conditions')),
                },
              ]}>
              <Checkbox>
                I agree to the <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type='primary' htmlType='submit' size='large' block loading={loading} disabled={loading}>
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.switchMode}>
            <Text type='secondary'>Already have an account?</Text>
            <Button type='link' onClick={() => handleTabChange('login')}>
              Sign in
            </Button>
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default AuthModal;
