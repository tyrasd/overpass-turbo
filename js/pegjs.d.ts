/**
 * Grammars are compiled to a parser module by the `peggy` plugin in
 * vite.config.mts, so they are importable but have no declarations of their own.
 */
declare module "*.pegjs" {
  const parser: {
    parse(input: string, options?: Record<string, unknown>): unknown;
    SyntaxError: new (...args: unknown[]) => Error;
  };
  export default parser;
}
