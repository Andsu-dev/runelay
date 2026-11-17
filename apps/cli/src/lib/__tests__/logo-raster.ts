const RADIUS = 256;
const PIXEL = 33;
const COLUMNS = 21;
const PIXEL_ROWS = 16;
const SAMPLES = 16;
const CENTER_X = 512;
const CENTER_Y = 511.5;

const leftDisc = { edge: 492, centerY: 541 };
const rightDisc = { edge: 532, centerY: 482 };

const insideLogo = (x: number, y: number) =>
  (x <= leftDisc.edge && (x - leftDisc.edge) ** 2 + (y - leftDisc.centerY) ** 2 <= RADIUS ** 2) ||
  (x >= rightDisc.edge && (x - rightDisc.edge) ** 2 + (y - rightDisc.centerY) ** 2 <= RADIUS ** 2);

const filled = (column: number, row: number) => {
  const originX = CENTER_X - (COLUMNS * PIXEL) / 2;
  const originY = CENTER_Y - (PIXEL_ROWS * PIXEL) / 2;
  let hits = 0;
  for (let i = 0; i < SAMPLES; i++) {
    for (let j = 0; j < SAMPLES; j++) {
      const x = originX + (column + (i + 0.5) / SAMPLES) * PIXEL;
      const y = originY + (row + (j + 0.5) / SAMPLES) * PIXEL;
      if (insideLogo(x, y)) hits++;
    }
  }
  return hits / SAMPLES ** 2 >= 0.5;
};

const halfBlock = (top: boolean, bottom: boolean) => (top && bottom ? "█" : top ? "▀" : bottom ? "▄" : " ");

export const rasterizeLogo = () => {
  const rows = Array.from({ length: PIXEL_ROWS / 2 }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, column) =>
      halfBlock(filled(column, row * 2), filled(column, row * 2 + 1)),
    ).join(""),
  );
  const used = Array.from({ length: COLUMNS }, (_, column) => rows.some((row) => row[column] !== " "));
  const first = used.indexOf(true);
  const last = used.lastIndexOf(true);
  return rows.map((row) => row.slice(first, last + 1));
};
