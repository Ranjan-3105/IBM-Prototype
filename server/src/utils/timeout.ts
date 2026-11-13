export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
