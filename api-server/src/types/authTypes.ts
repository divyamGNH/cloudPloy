export interface AuthTokens {
  accessTTL: number; // time.Duration
  refreshTTL: number; // time.Duration
  accessToken: string;
  refreshToken: string;
}

export interface LoginReq {
  email: string;
  password: string;
}

export interface SignupReq {
  name: string;
  email: string;
  password: string;
}

export interface LoginRes {
  userId: string; // uuid.UUID
  name: string;
  email: string;
  tokens: AuthTokens;
}

export interface SignupRes {
  userId: string; // uuid.UUID
  name: string;
  email: string;
}

export interface MeRes {
  authenticated: boolean;
  userId: string; // uuid.UUID
}

export interface RefreshRes {
  accessToken: string;
}

export interface TokenClaims {
    userId : string;
}