'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, CheckCircle2, MailCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, CpfDialog } from '@/components/molecules';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCreateCheckout,
  useCreateBillingPortal,
} from '@/lib/hooks/use-subscription';
import { useResendVerification } from '@/lib/hooks/use-auth';
import {
  isActiveSubscription,
  type PlanDisplay,
  type SubscriptionState,
} from '@/lib/types/subscription';
import type { User } from '@/lib/types/auth';
import { cn } from '@/lib/utils';

interface SubscriptionPanelProps {
  plan: PlanDisplay | null;
  subscription: SubscriptionState | null;
  locale: string;
  status?: string;
  user: User | null;
}

function statusTone(subscription: SubscriptionState): {
  box: string;
  text: string;
  dot: string;
} {
  if (subscription.cancelAtPeriodEnd) {
    return {
      box: 'bg-warning/5 border-warning/30',
      text: 'text-warning',
      dot: 'bg-warning',
    };
  }
  if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    return {
      box: 'bg-destructive/5 border-destructive/30',
      text: 'text-destructive',
      dot: 'bg-destructive',
    };
  }
  return {
    box: 'bg-success/5 border-success/30',
    text: 'text-success',
    dot: 'bg-success',
  };
}

export function SubscriptionPanel({
  plan,
  subscription,
  locale,
  status,
  user,
}: SubscriptionPanelProps) {
  const t = useTranslations('subscription');
  const tVerify = useTranslations('verifyEmail');
  const queryClient = useQueryClient();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreateBillingPortal();
  const resend = useResendVerification();
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [cpfDialogOpen, setCpfDialogOpen] = useState(false);

  const handleSubscribe = () => {
    if (!user?.emailVerifiedAt) {
      resend.mutate();
      setVerifyDialogOpen(true);
      return;
    }
    if (!user.ssn) {
      setCpfDialogOpen(true);
      return;
    }
    createCheckout.mutate();
  };

  useEffect(() => {
    if (status === 'success') {
      toast.success(t('checkoutSuccess'));
      queryClient.invalidateQueries({ queryKey: ['availableCredits'] });
    } else if (status === 'cancel') {
      toast.error(t('checkoutCanceled'));
    }
  }, [status, t, queryClient]);

  const isActive = isActiveSubscription(subscription);

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('unavailable')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const price = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.amountInCents / 100);

  const periodEnd = subscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
      }).format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="fill-gold text-gold size-5" />
            {plan.name}
          </CardTitle>
          <CardDescription>{t('subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-muted-foreground text-sm">
              /{t(`interval.${plan.interval}`)}
            </span>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t('creditsPerMonth', { count: plan.creditsPerCycle })}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t('premiumStories')}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="text-primary size-4" />
              {t('cancelAnytime')}
            </li>
          </ul>

          <p className="text-muted-foreground text-xs italic">
            {t('refreshMonthly')}
          </p>

          {isActive ? (
            (() => {
              const tone = statusTone(subscription!);
              return (
                <div className="space-y-4">
                  <div className={cn('rounded-xl border p-4', tone.box)}>
                    <p
                      className={cn(
                        'flex items-center gap-2 font-semibold',
                        tone.text
                      )}
                    >
                      <span className={cn('size-2 rounded-full', tone.dot)} />
                      {t(
                        subscription!.cancelAtPeriodEnd
                          ? 'activeWillEnd'
                          : `status.${subscription!.status}`
                      )}
                    </p>
                    {periodEnd && (
                      <p className={cn('mt-1 text-sm', tone.text)}>
                        {subscription!.cancelAtPeriodEnd
                          ? t('endsOn', { date: periodEnd })
                          : t('renewsOn', { date: periodEnd })}
                      </p>
                    )}
                  </div>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    disabled={createPortal.isPending}
                    onClick={() => createPortal.mutate()}
                  >
                    {createPortal.isPending && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                    {t('manage')}
                  </Button>
                </div>
              );
            })()
          ) : (
            <Button
              size="lg"
              className="h-12 w-full text-base font-semibold"
              disabled={createCheckout.isPending}
              onClick={handleSubscribe}
            >
              {createCheckout.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {t('subscribe')}
            </Button>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={verifyDialogOpen}
        onOpenChange={setVerifyDialogOpen}
        title={tVerify('subscribeGateTitle')}
        description={tVerify('subscribeGateMessage')}
        confirmLabel={tVerify('gotIt')}
        closeLabel={tVerify('close')}
        onConfirm={async () => {}}
        icon={<MailCheck className="text-gold size-5" />}
        iconClassName="bg-clue"
        confirmClassName="bg-primary hover:bg-primary/90"
      />

      {user && (
        <CpfDialog
          open={cpfDialogOpen}
          onClose={() => setCpfDialogOpen(false)}
          user={user}
          onSuccess={() => createCheckout.mutate()}
        />
      )}
    </>
  );
}
