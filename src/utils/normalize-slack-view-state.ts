import type { ViewStateValue } from 'slack-cloudflare-workers';

interface SlackViewStateInput {
  [blockId: string]: {
    [actionId: string]: ViewStateValue;
  };
}

export type NormalizedViewState = Record<string, string | undefined>;

export function normalizeViewState(input: SlackViewStateInput): NormalizedViewState {
  const result: NormalizedViewState = {};

  for (const [blockId, actions] of Object.entries(input)) {
    for (const [_actionId, value] of Object.entries(actions)) {
      result[blockId] = value.value ?? value.selected_date ?? value.selected_option?.value;
    }
  }

  return result;
};
