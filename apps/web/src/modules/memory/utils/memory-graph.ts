import type { MemoryGraphNodeView, MemoryGraphView } from "@runelay/shared";
import type { LinkObject, NodeObject } from "force-graph";
import { GRAPH } from "@/modules/memory/constants/memory.constants";

export type GraphNode = MemoryGraphNodeView & NodeObject & { radius: number };

export type GraphLink = LinkObject<GraphNode>;

type Rgb = readonly [number, number, number];

export interface GraphPalette {
  node: Rgb;
  strong: Rgb;
  accent: Rgb;
  surface: Rgb;
  font: string;
}

export const buildGraph = ({ nodes, edges }: MemoryGraphView) => {
  const neighbors = new Map<string, Set<string>>(nodes.map((node) => [node.slug, new Set<string>()]));
  for (const { source, target } of edges) {
    neighbors.get(source)?.add(target);
    neighbors.get(target)?.add(source);
  }
  return {
    neighbors,
    nodes: nodes.map<GraphNode>((node) => ({
      ...node,
      radius: Math.min(GRAPH.nodeRadius + Math.sqrt(node.degree) * GRAPH.nodeRadiusGrowth, GRAPH.nodeRadiusMax),
    })),
    links: edges.map<GraphLink>((edge) => ({ ...edge })),
  };
};

export const gravityForce = (strength: number) => {
  let pulled: GraphNode[] = [];
  const force = (alpha: number) => {
    for (const node of pulled) {
      node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha;
      node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha;
    }
  };
  force.initialize = (nodes: GraphNode[]) => {
    pulled = nodes;
  };
  return force;
};

export const endSlug = (end: GraphLink["source"]) => (typeof end === "object" ? end.slug : String(end));

const matchScore = ({ name, slug }: GraphNode, term: string) => {
  const label = name.toLowerCase();
  if (label === term || slug === term) return 3;
  if (label.startsWith(term) || slug.startsWith(term)) return 2;
  return label.includes(term) || slug.includes(term) ? 1 : 0;
};

export const findNode = (nodes: GraphNode[], query: string) => {
  const term = query.trim().toLowerCase();
  if (!term) return null;
  let best: GraphNode | null = null;
  let bestScore = 0;
  for (const node of nodes) {
    const score = matchScore(node, term);
    if (score > bestScore || (score > 0 && score === bestScore && best && node.degree > best.degree)) {
      best = node;
      bestScore = score;
    }
  }
  return best;
};

const toRgb = (probe: CanvasRenderingContext2D, color: string): Rgb => {
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = probe.getImageData(0, 0, 1, 1).data;
  return [red, green, blue];
};

export const readPalette = (element: HTMLElement): GraphPalette => {
  const style = getComputedStyle(element);
  const probe = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", {
    willReadFrequently: true,
  });
  const token = (name: string): Rgb => (probe ? toRgb(probe, style.getPropertyValue(name).trim()) : [128, 128, 128]);
  return {
    node: token("--muted-foreground"),
    strong: token("--foreground"),
    accent: token("--chart-1"),
    surface: token("--background"),
    font: style.fontFamily,
  };
};

export const mix = (from: Rgb, to: Rgb, amount: number): Rgb => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
];

export const rgba = ([red, green, blue]: Rgb, alpha: number) =>
  `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${Math.round(alpha * 100) / 100})`;
