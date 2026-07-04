'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateLeadRequest } from '@/lib/api/leads';
import { createLeadRequest } from '@/lib/api/leads';
import { getLocalUuid } from '@/lib/local-uuid';
import { collectDeviceInfo } from '@/lib/device-info';
import {
  addSignupBreadcrumb,
  captureSignupException,
  setLeadMonitoringContext,
  SignupBreadcrumb,
} from '@/lib/monitoring/sentry';
import type { UpdateLeadPayload } from '@/lib/types/lead';

const DEBOUNCE_MS = 800;

type FieldName =
  | 'name'
  | 'email'
  | 'isFirstInputFocus'
  | 'isPasswordTouched'
  | 'isConfirmPasswordTouched'
  | 'isPrivacyAccepted'
  | 'isTermsAccepted';

type FieldValue = string | boolean;

interface ServerSnapshot {
  name: string | null;
  email: string | null;
  isFirstInputFocus: boolean;
  isPasswordTouched: boolean;
  isConfirmPasswordTouched: boolean;
  isPrivacyAccepted: boolean;
  isTermsAccepted: boolean;
}

const EMPTY_SNAPSHOT: ServerSnapshot = {
  name: null,
  email: null,
  isFirstInputFocus: false,
  isPasswordTouched: false,
  isConfirmPasswordTouched: false,
  isPrivacyAccepted: false,
  isTermsAccepted: false,
};

export function useLeadTracking() {
  const [leadId, setLeadId] = useState<string | null>(null);

  // Refs avoid stale closures so the milestone callbacks can be stable (empty deps).
  const leadIdRef = useRef<string | null>(null);
  const createStartedRef = useRef(false);
  const serverSnapshotRef = useRef<ServerSnapshot>({ ...EMPTY_SNAPSHOT });
  const pendingRef = useRef<Partial<UpdateLeadPayload>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMutation = useMutation({
    mutationKey: ['lead-update'],
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadPayload }) =>
      updateLeadRequest(id, data),
  });
  const updateMutationRef = useRef(updateMutation);
  useEffect(() => {
    updateMutationRef.current = updateMutation;
  });

  const flushPatch = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = leadIdRef.current;
    if (!id) return;

    const pending = pendingRef.current;
    if (Object.keys(pending).length === 0) return;

    // Snapshot the payload, then clear pending + update the server snapshot before
    // firing so a subsequent setFieldValue with the same value is a no-op.
    pendingRef.current = {};
    const snapshot = serverSnapshotRef.current as unknown as Record<
      string,
      unknown
    >;
    for (const key of Object.keys(pending) as (keyof UpdateLeadPayload)[]) {
      const value = pending[key];
      if (value !== undefined) {
        snapshot[key] = value;
      }
    }

    updateMutationRef.current.mutate({ id, data: pending });
  }, []);

  const schedulePatch = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(flushPatch, DEBOUNCE_MS);
  }, [flushPatch]);

  const setFieldValue = useCallback(
    (name: FieldName, value: FieldValue) => {
      if (serverSnapshotRef.current[name as keyof ServerSnapshot] === value) {
        return;
      }
      (pendingRef.current as Record<string, unknown>)[name] = value;
      schedulePatch();
    },
    [schedulePatch]
  );

  // Each milestone is sent at most once via a per-hook ref guard.
  const useTouchedGuard = (key: FieldName) => {
    const ref = useRef(false);
    return useCallback(() => {
      if (ref.current) return;
      ref.current = true;
      setFieldValue(key, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  };

  const markFirstInputFocus = useTouchedGuard('isFirstInputFocus');
  const markPasswordTouched = useTouchedGuard('isPasswordTouched');
  const markConfirmPasswordTouched = useTouchedGuard(
    'isConfirmPasswordTouched'
  );
  const markPrivacyAccepted = useTouchedGuard('isPrivacyAccepted');
  const markTermsAccepted = useTouchedGuard('isTermsAccepted');

  // Create (or reuse) the lead once on mount.
  useEffect(() => {
    if (createStartedRef.current) return;
    createStartedRef.current = true;

    const localUuid = getLocalUuid();
    const rawQueryParams =
      typeof window !== 'undefined' ? window.location.search : '';
    const queryParams = rawQueryParams || undefined;
    const deviceInfo = collectDeviceInfo();

    setLeadMonitoringContext({ localUuid, queryParams, deviceInfo });
    addSignupBreadcrumb(SignupBreadcrumb.LEAD_CREATE_STARTED, {
      hasQueryParams: Boolean(queryParams),
    });

    createLeadRequest({ localUuid, queryParams, deviceInfo })
      .then((lead) => {
        leadIdRef.current = lead.id;
        setLeadId(lead.id);
        serverSnapshotRef.current = {
          name: lead.name,
          email: lead.email,
          isFirstInputFocus: lead.isFirstInputFocus,
          isPasswordTouched: lead.isPasswordTouched,
          isConfirmPasswordTouched: lead.isConfirmPasswordTouched,
          isPrivacyAccepted: lead.isPrivacyAccepted,
          isTermsAccepted: lead.isTermsAccepted,
        };
        setLeadMonitoringContext({
          localUuid,
          leadId: lead.id,
          queryParams,
          deviceInfo,
        });
        addSignupBreadcrumb(SignupBreadcrumb.LEAD_CREATED, { leadId: lead.id });
      })
      .catch((error) => {
        captureSignupException(error, SignupBreadcrumb.LEAD_CREATE_ERROR, {
          hasQueryParams: Boolean(queryParams),
        });
        /* tracking must never break the form */
      });
  }, []);

  // Flush on unmount.
  useEffect(() => {
    return () => {
      flushPatch();
    };
  }, [flushPatch]);

  const flushAndReturnLeadId = useCallback(() => {
    flushPatch();
    return leadIdRef.current;
  }, [flushPatch]);

  return {
    leadId,
    setFieldValue,
    markFirstInputFocus,
    markPasswordTouched,
    markConfirmPasswordTouched,
    markPrivacyAccepted,
    markTermsAccepted,
    flushAndReturnLeadId,
  };
}
