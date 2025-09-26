const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string | null;
  };
};

export type SupabaseUser = SupabaseSession["user"];

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: SupabaseUser;
  session?: {
    access_token: string;
    refresh_token: string;
    user?: SupabaseUser;
  } | null;
};

type SupabaseErrorPayload = {
  error_description?: string;
  message?: string;
  error?: string;
};

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase environment variables are missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    );
  }

  return {
    url: SUPABASE_URL.replace(/\/$/, ""),
    anonKey: SUPABASE_ANON_KEY,
  } as const;
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("Failed to parse Supabase response", error);
    return null;
  }
}

function buildHeaders(headers?: HeadersInit) {
  const { anonKey } = requireConfig();
  const baseHeaders: Record<string, string> = {
    apikey: anonKey,
  };

  if (headers) {
    return {
      ...baseHeaders,
      ...(headers as Record<string, string>),
    } satisfies HeadersInit;
  }

  return baseHeaders satisfies HeadersInit;
}

async function supabaseRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { url } = requireConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: buildHeaders(init.headers),
  });

  const data = await parseJsonSafe<T | SupabaseErrorPayload>(response);

  if (!response.ok) {
    const errorPayload = data as SupabaseErrorPayload | null;
    const message =
      errorPayload?.error_description || errorPayload?.message || errorPayload?.error || response.statusText;
    throw new Error(message || "Unexpected error communicating with Supabase.");
  }

  return (data as T | null) ?? ({} as T);
}

function mapAuthResponse(payload: SupabaseAuthResponse): SupabaseSession {
  const session = payload.session;
  if (session?.access_token && session.refresh_token) {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user: session.user ?? payload.user ?? { id: "" },
    };
  }

  if (payload.access_token && payload.refresh_token) {
    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      user: payload.user ?? { id: "" },
    };
  }

  throw new Error("Supabase did not return a session. Check your authentication settings.");
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function signInWithPassword(email: string, password: string): Promise<SupabaseSession> {
  const payload = await supabaseRequest<SupabaseAuthResponse>(`/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return mapAuthResponse(payload);
}

export async function signUpWithPassword(email: string, password: string): Promise<{
  session: SupabaseSession | null;
  user: SupabaseUser | null;
  requiresEmailConfirmation: boolean;
}> {
  const payload = await supabaseRequest<SupabaseAuthResponse>(`/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const session = (() => {
    try {
      return mapAuthResponse(payload);
    } catch (error) {
      return null;
    }
  })();

  return {
    session,
    user: payload.user ?? session?.user ?? null,
    requiresEmailConfirmation: !session,
  };
}

export async function upsertProfile(
  accessToken: string,
  profile: Record<string, unknown> & { id: string },
): Promise<void> {
  const { url } = requireConfig();
  const response = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: buildHeaders({
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    }),
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const errorPayload = await parseJsonSafe<SupabaseErrorPayload>(response);
    const message =
      errorPayload?.error_description || errorPayload?.message || errorPayload?.error || response.statusText;
    throw new Error(message || "Unable to create profile record.");
  }
}
