import { LoginForm } from '@/components/organisms';

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-primary">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-muted-foreground">
          Continue sua próxima história.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
