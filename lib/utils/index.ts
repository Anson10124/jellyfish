import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}

export * from './date-format';
export * from './format-genres';
export * from './language';
export * from './media-format';
export * from './media-info';
export * from './person-social';
export * from './tmdb-image';
