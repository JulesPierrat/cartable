export type ShareCell = 'hit' | 'miss' | 'hint';

const emoji: Record<ShareCell, string> = { hit: '🟦', miss: '🟧', hint: '💡' };

/** Grille de partage à la Wordle : une case de couleur par coup, sans rien révéler de la réponse. */
export function shareGrid(cells: readonly ShareCell[]): string {
  return cells.map((cell) => emoji[cell]).join('');
}

/** « 9 h 12 min » avant minuit (heure locale), quand le prochain défi du jour arrive. */
export function timeUntilMidnight(now: Date): string {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const minutes = Math.ceil((midnight.getTime() - now.getTime()) / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;
}

/** « 1 min 42 s » */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min ${String(seconds % 60).padStart(2, '0')} s` : `${seconds} s`;
}
