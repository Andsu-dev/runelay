import { createInterface } from "node:readline/promises";
import { SPINNER_FRAMES } from "@/constants/cli.constants";

export const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

const colored = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const paint = (open: number, close: number) => (text: string) =>
  colored ? `\x1b[${open}m${text}\x1b[${close}m` : text;

export const bold = paint(1, 22);
export const dim = paint(2, 22);
export const green = paint(32, 39);
export const red = paint(31, 39);
export const cyan = paint(36, 39);

export const ask = async (question: string, fallback = "") => {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await reader.question(`${cyan("?")} ${question}${fallback ? dim(` (${fallback})`) : ""} `);
  reader.close();
  return answer.trim() || fallback;
};

export const confirm = async (question: string) => {
  const answer = await ask(`${question} ${dim("[S/n]")}`);
  return !/^n/i.test(answer);
};

export const startSpinner = (label: string) => {
  if (!interactive) {
    console.log(label);
    return (final: string) => console.log(final);
  }
  let frame = 0;
  const timer = setInterval(() => {
    frame = (frame + 1) % SPINNER_FRAMES.length;
    process.stdout.write(`\r\x1b[2K${cyan(SPINNER_FRAMES[frame] ?? "")} ${label}`);
  }, 80);
  return (final: string) => {
    clearInterval(timer);
    process.stdout.write(`\r\x1b[2K${final}\n`);
  };
};
