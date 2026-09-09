import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  public setItemToSessionStorage<T = unknown>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);

      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(
        `Ошибка при сохранении данных в sessionStorage по ключу "${key}":`,
        error
      );
    }
  }

  public getItemFromSessionStorage<T = unknown>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(
        `Ошибка при получении данных из sessionStorage по ключу "${key}":`,
        error
      );
      return null;
    }
  }

  public removeItemFromSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Ошибка при удалении данных из sessionStorage по ключу "${key}":`,
        error
      );
    }
  }

  public clearSessionStorage(): void {
    sessionStorage.clear();
  }
}
