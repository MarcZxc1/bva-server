// Type declarations for reference files
// This file suppresses TypeScript errors for the shopee-auth reference implementation

declare module 'express' {
  export interface Request {
    body: any;
    params: any;
    query: any;
    headers: any;
    userId?: string;
    userRole?: string;
  }
  
  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
  }
  
  export interface NextFunction {
    (err?: any): void;
  }
  
  export interface Router {
    get(...args: any[]): any;
    post(...args: any[]): any;
    put(...args: any[]): any;
    delete(...args: any[]): any;
  }
  
  export function Router(): Router;
  export interface Application {}
}

declare module 'bcrypt' {
  export function hash(data: string, saltOrRounds: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string): any;
}

declare module '@prisma/client' {
  export class PrismaClient {
    appUser: any;
  }
}

declare module 'zod' {
  export class ZodError extends Error {
    errors: any[];
  }
  
  export interface ZodType<T = any> {
    parse(data: unknown): T;
  }
  
  export interface ZodString extends ZodType<string> {
    min(length: number): ZodString;
    max(length: number): ZodString;
    email(): ZodString;
    optional(): ZodOptional<string>;
  }
  
  export interface ZodOptional<T> extends ZodType<T | undefined> {}
  
  export interface ZodObject<T = any> extends ZodType<T> {
    parse(data: unknown): T;
  }
  
  export namespace z {
    function string(): ZodString;
    function object<T>(shape: any): ZodObject<T>;
    function infer<T extends ZodType>(schema: T): any;
  }
  
  export { z };
}

// Global declarations
declare namespace NodeJS {
  interface ProcessEnv {
    JWT_SECRET?: string;
    JWT_EXPIRATION?: string;
    DATABASE_URL?: string;
  }
  interface Process {
    env: ProcessEnv;
  }
}

declare const process: NodeJS.Process;
declare const console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
};
