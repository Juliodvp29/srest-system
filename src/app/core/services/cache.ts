import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

@Injectable({
    providedIn: 'root',
})
export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private DEFAULT_TTL = 300000; // 5 minutes

    // Set a value with optional Time To Live (TTL)
    set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
        });
    }

    // Retrieve value if not expired
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    // RxJS caching wrapper
    cacheObservable<T>(key: string, observer: Observable<T>, ttl?: number): Observable<T> {
        const cached = this.get<T>(key);
        if (cached) {
            return of(cached);
        }

        return observer.pipe(
            tap((data) => this.set(key, data, ttl))
        );
    }

    // Promise caching wrapper
    async cachePromise<T>(key: string, promiseFn: () => Promise<T>, ttl?: number): Promise<T> {
        const cached = this.get<T>(key);
        if (cached) {
            return cached;
        }

        const data = await promiseFn();
        this.set(key, data, ttl);
        return data;
    }

    // Invalidate specific key
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    // Clear all keys matching prefix
    invalidateByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
}
