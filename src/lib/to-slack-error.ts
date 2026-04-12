import type { inputMemberInfoSchema } from '@slack/schemas/member';
import type { InferIssue } from 'valibot';

export function toSlackErrors(issues: Array<InferIssue<typeof inputMemberInfoSchema>>): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of issues) {
    const blockId = issue.path?.[0]?.key;
    if (typeof blockId === 'string') {
      errors[blockId] = issue.message;
    }
  }

  return errors;
}
