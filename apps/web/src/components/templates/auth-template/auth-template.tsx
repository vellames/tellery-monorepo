import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthTemplateProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AuthTemplate({ title, description, children }: AuthTemplateProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-5">
      <Card className="w-full max-w-sm overflow-hidden border-border bg-card shadow-card">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl font-bold tracking-tight text-primary">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
