export function logger(scope: string) {
  function format(...args: unknown[]) {
    return args.map(a => (typeof a === "object" ? JSON.stringify(a, null, 0) : String(a)))
  }

  return {
    info: (...args: unknown[]) => console.log(`[${scope}]`, ...format(...args)),
    warn: (...args: unknown[]) => console.warn(`[${scope}]`, ...format(...args)),
    error: (...args: unknown[]) => console.error(`[${scope}]`, ...format(...args)),
  }
}
