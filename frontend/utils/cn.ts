// utils/cn.ts

type ClassValue = string | { [className: string]: unknown } | ClassValue[] | null | undefined;

export function cn(...args: ClassValue[]): string {
  return args
    .flatMap(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object' && arg !== null) {
        return Object.entries(arg)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
}
