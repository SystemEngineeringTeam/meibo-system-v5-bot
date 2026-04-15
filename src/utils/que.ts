export const que = {
  async send<T>(queue: Queue, value: T, options?: QueueSendOptions): Promise<void> {
    await queue.send(JSON.stringify(value), options);
  },
};
