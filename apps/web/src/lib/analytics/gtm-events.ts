import { sendGTMEvent } from '@next/third-parties/google';

/**
 * Custom GTM event names. Keep these in sync with the triggers configured in
 * the GTM container so naming changes don't silently break conversions.
 */
export const GtmEvent = {
  SUBMIT_LEAD_FORM: 'manual_event_SUBMIT_LEAD_FORM',
} as const;

/**
 * Pushes the lead-form-submit conversion event to the GTM dataLayer.
 *
 * Navigation here is client-side and happens after the register mutation
 * settles, so we don't need an `event_callback` to hold it — the dataLayer
 * push always reaches GTM before the route change.
 */
export function trackSubmitLeadForm(): void {
  sendGTMEvent({ event: GtmEvent.SUBMIT_LEAD_FORM });
}
