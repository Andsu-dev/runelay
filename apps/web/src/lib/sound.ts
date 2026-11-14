import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "./storage";

export type SoundName = "tap" | "toggle" | "open" | "close" | "success" | "error" | "attention";

interface Note {
  freq: number;
  at: number;
  dur: number;
  slide?: number;
}

const STORAGE_KEY = "runelay-sound";
const VOLUME = 0.016;
const listeners = new Set<() => void>();

const arpeggio = (freqs: number[], step: number, dur: number): Note[] =>
  freqs.map((freq, index) => ({ freq, at: index * step, dur }));

const RECIPES: Record<SoundName, Note[]> = {
  tap: [{ freq: 1046, at: 0, dur: 0.03, slide: 1318 }],
  toggle: arpeggio([659, 988], 0.045, 0.05),
  open: arpeggio([523, 659, 784, 1046], 0.04, 0.05),
  close: arpeggio([784, 659, 523], 0.04, 0.05),
  success: [
    { freq: 988, at: 0, dur: 0.07 },
    { freq: 1318, at: 0.07, dur: 0.22 },
  ],
  error: [
    { freq: 196, at: 0, dur: 0.09, slide: 164 },
    { freq: 147, at: 0.1, dur: 0.18, slide: 110 },
  ],
  attention: arpeggio([784, 784], 0.09, 0.06),
};

let enabled = readStorage(STORAGE_KEY) !== "off";
let context: AudioContext | null = null;

const audio = () => {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
};

export const cue = (name: SoundName) => {
  if (!enabled) return;
  const ctx = audio();
  const output = ctx.createBiquadFilter();
  output.type = "lowpass";
  output.frequency.value = 3800;
  output.connect(ctx.destination);
  for (const note of RECIPES[name]) {
    const start = ctx.currentTime + note.at;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(note.freq, start);
    if (note.slide) oscillator.frequency.exponentialRampToValueAtTime(note.slide, start + note.dur);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(VOLUME, start + 0.004);
    gain.gain.setValueAtTime(VOLUME, start + note.dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    oscillator.connect(gain).connect(output);
    oscillator.start(start);
    oscillator.stop(start + note.dur + 0.02);
  }
};

const playFromElement = (event: Event) => {
  const element = (event.target as Element | null)?.closest<HTMLElement>("[data-sound]");
  if (!element || element.matches(":disabled, [aria-disabled='true']")) return;
  cue(element.dataset.sound as SoundName);
};

export const startSound = () => {
  document.addEventListener("click", playFromElement, { capture: true });
  return () => document.removeEventListener("click", playFromElement, { capture: true });
};

export const setSoundEnabled = (next: boolean) => {
  enabled = next;
  writeStorage(STORAGE_KEY, next ? null : "off");
  if (next) cue("toggle");
  for (const listener of listeners) listener();
};

export const useSoundEnabled = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => enabled,
  );
