import { AuthTemplate } from '@/components/templates';
import { LoginForm } from '@/components/organisms';

export default function LoginPage() {
  return (
    <AuthTemplate title="AI History" description="Entre para continuar">
      <LoginForm />
    </AuthTemplate>
  );
}
