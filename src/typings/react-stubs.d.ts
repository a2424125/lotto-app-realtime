declare module "react" {
  export type FC<P = {}> = (props: P & { children?: any }) => any;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  const React: { createElement: any };
  export default React;
}

declare module "react-dom/client" {
  export function createRoot(container: Element | DocumentFragment): any;
}