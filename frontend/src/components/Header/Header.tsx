import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import './Header.css';

type HeaderProps = React.PropsWithChildren<{
  backButton?: boolean;
}>;

export default function Header(props: HeaderProps) {
  const { backButton, children } = props;

  const navigate = useNavigate();

  function handleBack() {
    navigate(-1);
  }

  if (backButton) {
    return (
      <header className='header-with-back'>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} shape='circle' type='text' />
        <div className='header-with-back-container'>{children}</div>
      </header>
    );
  }
  return <header className='header'>{children}</header>;
}
