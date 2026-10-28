import { createContext, useContext, useState, type ReactNode } from 'react';

import type { GameState } from '@/games/jusqua-la-mer/engine/game';
import type { GameSetup } from '@/games/jusqua-la-mer/presentation';

/** Une partie terminée, transmise de l'écran de partie à celui du résultat. */
export type FinishedGame = { setup: GameSetup; state: GameState; durationMs: number };

type SessionValue = {
  lastGame: FinishedGame | null;
  finishGame: (game: FinishedGame) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [lastGame, finishGame] = useState<FinishedGame | null>(null);
  return <SessionContext.Provider value={{ lastGame, finishGame }}>{children}</SessionContext.Provider>;
}

export function useGameSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useGameSession doit être utilisé sous GameSessionProvider');
  }
  return value;
}
