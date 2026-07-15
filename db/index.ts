import { env } from 'cloudflare:workers';

export function getDatabase() {
  if (!env.DB) {
    throw new Error('CoffeeCalc online storage is unavailable.');
  }

  return env.DB;
}
