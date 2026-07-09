import Layout from "../components/Layout";
import RegisterForm from "../components/RegisterForm";
import { Button } from "@/components/ui/Button";

import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <Button
        onClick={() => navigate('/')}
        className="px-6 py-2 font-bold"
      >
        Back
      </Button>
    </div>
  );

  return (
    <Layout headerRight={headerButtons}>
      <div className='flex w-full h-[75vh] md:h-screen justify-center items-center'>
        <RegisterForm />
      </div>
    </Layout>
  )
}

export default Register;