import { isMockEnabled, mockFetch } from './mockApi';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (isMockEnabled()) {
    return mockFetch(input, init);
  }
  return fetch(input, init);
}

