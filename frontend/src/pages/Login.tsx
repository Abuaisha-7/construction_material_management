import LoginForm from "../components/LoginForm/LoginForm";

interface LoginProps {
  onSuccess?: () => void;
}

const Login = ({ onSuccess }: LoginProps) => {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <LoginForm onSuccess={onSuccess} />
    </main>
  );
};

export default Login;
