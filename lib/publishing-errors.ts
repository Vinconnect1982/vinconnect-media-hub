// Only an explicit Meta permission rejection is safe to classify as not sent.
// Network failures, generic HTTP errors and ambiguous receipts stay uncertain.
export function isPagePermissionRejection(message:string) {
  return /(?:\(#200\)|"code"\s*:\s*200)/i.test(message)
    && /pages_manage_posts/i.test(message)
    && /(?:not available|required|missing|not granted|permission[^.]*denied)/i.test(message);
}
export class PublishingPermissionError extends Error {
  constructor(message:string){super(message);this.name='PublishingPermissionError';}
}
export const permissionHelp='Facebook rejected publishing permission (pages_manage_posts). Nothing was published by this attempt. Reconnect Facebook Page (Organic) in Windsor. If you already reconnected and this error returned, contact Windsor support to check its Facebook app approval and your Page token permissions. Refreshing the Hub or replacing its API key cannot grant Facebook permission.';
