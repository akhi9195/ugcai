import { Request } from "express";

export type AuthedRequest = Request & {
  auth: () => { userId: string; has: (permission: any) => boolean };
  plan?: string;
  files?: any;
  file?: any;
};
