export const POS_SHORTCUTS = {
  focusUpc: "f1",
  focusQty: "f2",
  focusPrice: "f3",
  deleteLine: "del",
  moveUp: "ctrl+up",
  moveDown: "ctrl+down",
  submitLine: "enter",
  payCash: "f9",
  payCard: "f10",
  payMixed: "f11",
  exit: "esc"
} as const;

export type PosShortcut = keyof typeof POS_SHORTCUTS;
