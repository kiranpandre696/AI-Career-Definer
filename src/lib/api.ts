export const TOKEN_STORAGE_KEY = 'career_definer_auth_token';
export const USER_STORAGE_KEY = 'career_definer_user';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-auth-token', token);
  }

  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to parse response payload',
    }));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
      return {
        success: false,
        message: data.message || `Server responded with error status ${response.status}`,
        ...data,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network communication error. Please ensure the server is active.',
    };
  }
}
