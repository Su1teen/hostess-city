import type { RefObject } from 'react';

/** Shared with the map renderer; scroll frames never pass through React state. */
export interface ScrollState {
  progress: number;
  activeChapter: number;
  paused: boolean;
}
export type ScrollStateRef = RefObject<ScrollState>;
