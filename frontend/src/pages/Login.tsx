import Layout from "../components/Layout";
import LoginForm from "../components/LoginForm";
import { Button } from '@/components/ui/Button';

import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
    </div>
  );

  return (
    <Layout headerRight={headerButtons}>
      <div className='flex w-full h-[75vh] justify-center items-center'>
        <LoginForm />
      </div>
    </Layout>
  )
}

export default Login;