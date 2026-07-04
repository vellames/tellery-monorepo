'use client';

import { useMutation } from '@tanstack/react-query';
import { createLeadRequest, updateLeadRequest } from '@/lib/api/leads';
import type { CreateLeadPayload, UpdateLeadPayload } from '@/lib/types/lead';

export function useCreateLead() {
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLeadRequest(payload),
  });
}

export function useUpdateLead() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadPayload }) =>
      updateLeadRequest(id, data),
  });
}
