import type { TokenClaims } from "./authTypes.ts"

// TS or express does not recognize user object in the Request object so we have to manually inject it in runtime for TS to recognize it.
export global {
    namespace Express {
        interface Request{
            auth? : TokenClaims;
        }
    }
}

export {}