export const TV_KEY_CODES = {
  // Directional D-pad
  LEFT: [37, 'ArrowLeft', 'Left'],
  UP: [38, 'ArrowUp', 'Up'],
  RIGHT: [39, 'ArrowRight', 'Right'],
  DOWN: [40, 'ArrowDown', 'Down'],

  // Confirmation / Select / OK
  ENTER: [13, 'Enter', 'Select', 'Ok', 'Accept'],

  // Back / Return / Escape
  BACK: [
    27, // Escape
    8, // Backspace
    166, // BrowserBack
    10009, // Samsung Tizen Return
    461, // LG webOS Back
    27, // Android TV Back
    'Escape',
    'Backspace',
    'BrowserBack',
    'GoBack',
  ],

  // Media Controls
  PLAY_PAUSE: [179, 'MediaPlayPause'],
  PLAY: [250, 415, 'MediaPlay'],
  PAUSE: [19, 'MediaPause'],
  FAST_FORWARD: [417, 228, 'MediaFastForward'],
  REWIND: [412, 227, 'MediaRewind'],
  STOP: [178, 413, 'MediaStop'],

  // Numbers 0-9
  NUM_0: [48, '0'],
  NUM_1: [49, '1'],
  NUM_2: [50, '2'],
  NUM_3: [51, '3'],
  NUM_4: [52, '4'],
  NUM_5: [53, '5'],
  NUM_6: [54, '6'],
  NUM_7: [55, '7'],
  NUM_8: [56, '8'],
  NUM_9: [57, '9'],
} as const;

export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

export function isDirectionKey(e: KeyboardEvent): NavigationDirection | null {
  const key = e.key;
  const keyCode = e.keyCode;

  if (TV_KEY_CODES.LEFT.includes(key as never) || TV_KEY_CODES.LEFT.includes(keyCode as never)) {
    return 'left';
  }
  if (TV_KEY_CODES.RIGHT.includes(key as never) || TV_KEY_CODES.RIGHT.includes(keyCode as never)) {
    return 'right';
  }
  if (TV_KEY_CODES.UP.includes(key as never) || TV_KEY_CODES.UP.includes(keyCode as never)) {
    return 'up';
  }
  if (TV_KEY_CODES.DOWN.includes(key as never) || TV_KEY_CODES.DOWN.includes(keyCode as never)) {
    return 'down';
  }
  return null;
}

export function isEnterKey(e: KeyboardEvent): boolean {
  return TV_KEY_CODES.ENTER.includes(e.key as never) || TV_KEY_CODES.ENTER.includes(e.keyCode as never);
}

export function isBackKey(e: KeyboardEvent): boolean {
  return TV_KEY_CODES.BACK.includes(e.key as never) || TV_KEY_CODES.BACK.includes(e.keyCode as never);
}

export function isPlayPauseKey(e: KeyboardEvent): boolean {
  return (
    e.code === 'Space' ||
    TV_KEY_CODES.PLAY_PAUSE.includes(e.key as never) ||
    TV_KEY_CODES.PLAY_PAUSE.includes(e.keyCode as never) ||
    TV_KEY_CODES.PLAY.includes(e.key as never) ||
    TV_KEY_CODES.PLAY.includes(e.keyCode as never) ||
    TV_KEY_CODES.PAUSE.includes(e.key as never) ||
    TV_KEY_CODES.PAUSE.includes(e.keyCode as never)
  );
}

export function isFastForwardKey(e: KeyboardEvent): boolean {
  return (
    TV_KEY_CODES.FAST_FORWARD.includes(e.key as never) ||
    TV_KEY_CODES.FAST_FORWARD.includes(e.keyCode as never)
  );
}

export function isRewindKey(e: KeyboardEvent): boolean {
  return (
    TV_KEY_CODES.REWIND.includes(e.key as never) ||
    TV_KEY_CODES.REWIND.includes(e.keyCode as never)
  );
}
