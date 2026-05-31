/// <reference types="vite/client" />

// Minimal React type stubs to satisfy tsc in environments where @types/react may be missing.
// These are only for demo/deploy typing; runtime React comes from node_modules.

declare namespace React {
  type ReactNode = any;
  type FormEvent<T = any> = any;
}

declare module 'react' {
  export = React;
  export const StrictMode: any;
  export function createContext<T = any>(defaultValue?: T): any;
  export function useContext<T = any>(ctx: any): T;
  export function useState<T = any>(initial: any): [T, any];
  export function useEffect(effect: any, deps?: any[]): any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}


