export const kv = {
  async put<T>(kv: KVNamespace, key: string, value: T, options?: KVNamespacePutOptions): Promise<void> {
    await kv.put(key, JSON.stringify(value), options);
  },

  async get<T>(kv: KVNamespace, key: string): Promise<T | null> {
    const v = await kv.get(key);
    return v ? JSON.parse(v) as T : null;
  },
};
