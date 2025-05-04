import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import './Header.css';
import { theme } from 'antd';

type HeaderProps = React.PropsWithChildren<{
  backButton?: boolean;
  onBack?: () => void;
}>;

export default function Header(props: HeaderProps) {
  const { backButton, children, onBack } = props;
  const { token } = theme.useToken();
  const navigate = useNavigate();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  }

  if (backButton) {
    return (
      <header className='header-with-back' style={{ backgroundColor: token.colorBgLayout }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} shape='circle' type='text' />
        <div className='header-with-back-container'>{children}</div>
      </header>
    );
  }
  return (
    <header className='header' style={{ backgroundColor: token.colorBgLayout }}>
      {children}
    </header>
  );
}
