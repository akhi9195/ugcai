import "express-serve-static-core";
declare module "express-serve-static-core" {
  namespace Express {
    interface Request {
      auth: () => { userId: string; has: (permission: any) => boolean };
      plan?: string;
      file: any;
      files: any;
    }
  }
}
