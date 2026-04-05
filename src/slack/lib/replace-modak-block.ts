import type { AnyModalBlock } from 'slack-cloudflare-workers';

export const replaceModalBlock = <T extends AnyModalBlock = AnyModalBlock>(blocks: AnyModalBlock[], blockId: string, replaceFn: (block: T) => T): AnyModalBlock[] => structuredClone(blocks).map((block) => {
  if (block.block_id === blockId) {
    return replaceFn(block as T);
  }
  return block;
});

export const isPlaneTextInputElement = (block: AnyModalBlock): block is AnyModalBlock => block.type === 'input' && block.element.type === 'plain_text_input';
