export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.',
    );
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const error = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'ERROR',
      error?.message ?? 'Ocurrió un error inesperado. Intentá de nuevo.',
      error?.details,
    );
  }

  return payload as T;
}

type FlatErrors = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { error?: FlatErrors } | FlatErrors | undefined;
    const flat = details && 'error' in details ? details.error : (details as FlatErrors | undefined);
    const fieldError = flat?.fieldErrors
      ? Object.values(flat.fieldErrors).find((messages) => messages && messages.length > 0)?.[0]
      : undefined;
    return fieldError ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
}
