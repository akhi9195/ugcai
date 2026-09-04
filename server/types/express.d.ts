// Augments Express's Request via the global `Express` namespace — the extension
// point @types/express-serve-static-core explicitly exposes for this
// ("These open interfaces may be extended in an application-specific manner via
// declaration merging"). `core.Request` extends `Express.Request`, so anything
// added here is visible on the `Request` imported from "express".
//
// Do NOT switch this back to `declare module "express-serve-static-core"`:
// there is no runtime package by that name (only @types/...), so if that bare
// specifier fails to resolve, `declare module` silently degrades into declaring
// a brand-new unrelated ambient module and the augmentation becomes a no-op.
// That is what broke the Vercel build (TS2339 on every `req.auth()`).
//
// `file` / `files` are intentionally not declared here — @types/multer already
// augments this same interface with them, and redeclaring them with different
// types is a merge conflict (TS2717).

export {};

declare global {
  namespace Express {
    interface Request {
      auth: () => { userId: string; has: (permission: any) => boolean };
      plan?: string;
    }
  }
}
