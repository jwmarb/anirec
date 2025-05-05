import { BACKEND_URL } from '$/constants';
import useUser from '$/hooks/useUser';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, AvatarProps, theme } from 'antd';

export default function UserAvatar(props: AvatarProps) {
  const [user] = useUser();
  const { token } = theme.useToken();

  return (
    <>
      {user ? (
        user.avatar ? (
          <Avatar src={BACKEND_URL + user.avatar} {...props} />
        ) : (
          <Avatar style={{ backgroundColor: token.colorPrimaryBg }} {...props}>
            {user.username[0].toUpperCase()}
          </Avatar>
        )
      ) : (
        <Avatar icon={<UserOutlined />} {...props} />
      )}
    </>
  );
}
