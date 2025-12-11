/**
 * Time and date utility functions
 */

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function isExpired(expirationDate: Date): boolean {
  return expirationDate.getTime() < Date.now();
}

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function parseCronExpression(expression: string): boolean {
  // Basic validation - 5 or 6 fields
  const parts = expression.split(' ');
  return parts.length >= 5 && parts.length <= 6;
}
