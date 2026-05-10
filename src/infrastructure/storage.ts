/**
 * Storage abstraction around browser.storage.local.
 * Strictly infrastructure — wraps WebExtension API.
 */
import browser from 'webextension-polyfill';

export interface IStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  getAll(): Promise<Record<string, unknown>>;
}

export class ExtensionStorage implements IStorage {
  private readonly AREA: browser.Storage.StorageArea = browser.storage.local;

  async get<T>(key: string): Promise<T | undefined> {
    const result = await this.AREA.get(key);
    return result[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.AREA.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await this.AREA.remove(key);
  }

  async getAll(): Promise<Record<string, unknown>> {
    return await this.AREA.get();
  }
}

export const storage = new ExtensionStorage();
