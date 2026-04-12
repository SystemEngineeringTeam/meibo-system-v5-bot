import type { DataSubmissionView } from 'slack-cloudflare-workers';

export const getViewValue = (view: DataSubmissionView, blockId: string): string | undefined => {
  const block = view.state.values?.[blockId];
  if (block === undefined) return undefined;

  const key = Object.keys(block)[0];
  if (key === undefined) return undefined;

  return block[key].value;
};
