import Layout from "../components/Layout";
import LoginForm from "../components/LoginForm";

import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <button
        onClick={() => navigate('/')}
        className="bg-[#C6412A] text-white px-6 py-2 rounded-lg hover:bg-[#A8321E] transition font-bold"
      >
        Back
      </button>
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