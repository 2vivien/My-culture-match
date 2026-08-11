import { Writable } from 'node:stream';
import { env } from '../../config/env';

/**
 * BETTER STACK LOGS (MP18) — transport Pino.
 *
 * Agrège les logs structurés vers Better Stack (https://betterstack.com/logs).
 * Les lignes JSON sont mises en buffer puis envoyées par lots (HTTP POST).
 * Désactivé (no-op) tant que `BETTER_STACK_SOURCE_TOKEN` est vide.
 *
 * La file d'attente mémoire est bornée : en cas de saturation, les plus
 * anciennes lignes sont simplement abandonnées — le logging ne doit JAMAIS
 * bloquer ou ralentir la boucle d'événements de l'API.
 */

const ENDPOINT = 'https://in.logs.betterstack.com';
const FLUSH_INTERVAL_MS = 2_000;
const MAX_BUFFERED_LINES = 200;

export function createBetterStackTransport(): Writable | null {
  const token = env.BETTER_STACK_SOURCE_TOKEN;
  if (!token) return null;

  const buffer: string[] = [];
  let timer: NodeJS.Timeout | null = null;
  let flushing = false;

  const flush = (): void => {
    if (buffer.length === 0 || flushing) return;
    flushing = true;
    const payload = buffer.splice(0, MAX_BUFFERED_LINES).join('');
    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: payload,
    })
      .catch(() => {
        // Logs perdus : on ne relance pas (anti-avalanche), on repartira
        // de zéro au prochain flush.
      })
      .finally(() => {
        flushing = false;
        if (buffer.length > 0) scheduleFlush();
      });
  };

  const scheduleFlush = (): void => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, FLUSH_INTERVAL_MS);
    timer.unref?.();
  };

  return new Writable({
    write(chunk, _encoding, callback) {
      const line = chunk.toString();
      if (line.trim().length === 0) {
        callback();
        return;
      }
      if (buffer.length >= MAX_BUFFERED_LINES * 2) {
        // Saturation : abandonne les lignes les plus anciennes.
        buffer.splice(0, buffer.length - MAX_BUFFERED_LINES);
      }
      buffer.push(line);
      if (buffer.length >= MAX_BUFFERED_LINES) flush();
      else scheduleFlush();
      callback();
    },
  });
}
