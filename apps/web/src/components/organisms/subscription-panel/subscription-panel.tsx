'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import {
  isActiveSubscription,
  type PlanDisplay,
  type SubscriptionState,
} from '@/lib/types/subscription';

interface SubscriptionPanelProps {
  plan: PlanDisplay | null;
  subscription: SubscriptionState | null;
  locale: string;
  status?: string;
}

export function SubscriptionPanel({
  plan,
  subscription,
  locale,
  status,
}: SubscriptionPanelProps) {
  const t = useTranslations('subscription');
  const queryClient = useQueryClient();
  const createCheckout = useCreateCheckout();
  const createPortal = useCreateBillingPortal();

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
          <div className="space-y-4">
            <div className="bg-primary/5 border-primary/20 rounded-xl border p-4">
              <p className="font-semibold">
                {t(`status.${subscription!.status}`)}
              </p>
              {periodEnd && (
                <p className="text-muted-foreground text-sm">
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
        ) : (
          <Button
            size="lg"
            className="h-12 w-full text-base font-semibold"
            disabled={createCheckout.isPending}
            onClick={() => createCheckout.mutate()}
          >
            {createCheckout.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t('subscribe')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
