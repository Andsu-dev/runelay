import type { MemoryGraphView } from "@runelay/shared";
import { useRouter } from "@tanstack/react-router";
import ForceGraph from "force-graph";
import { useCallback, useRef } from "react";
import { maskName, readNamesHidden, subscribeNamesHidden } from "@/lib/hidden-names";
import { GRAPH } from "@/modules/memory/constants/memory.constants";
import {
  buildGraph,
  endSlug,
  findNode,
  type GraphLink,
  type GraphNode,
  gravityForce,
  mix,
  readPalette,
  rgba,
} from "@/modules/memory/utils/memory-graph";

const TAU = Math.PI * 2;

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

interface GraphControls {
  focus: (query: string) => void;
  zoomBy: (factor: number) => void;
  fit: () => void;
}

const idleControls: GraphControls = { focus: () => undefined, zoomBy: () => undefined, fit: () => undefined };

export const useMemoryGraph = (data: MemoryGraphView | undefined, initialQuery: string) => {
  const router = useRouter();
  const queryRef = useRef(initialQuery);
  const controlsRef = useRef<GraphControls>(idleControls);

  const attach = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container || !data) return;
      const { nodes, links, neighbors } = buildGraph(data);
      const byDegree = [...nodes].sort((first, second) => second.degree - first.degree);
      const graph = new ForceGraph<GraphNode, GraphLink>(container);
      let palette = readPalette(container);
      let hidden = readNamesHidden();
      let hovered: string | null = null;
      let focused: string | null = null;
      let lit: string | null = null;
      let fade = 0;
      let fitted = false;
      let colors = { node: "", strong: "", lifted: "", pinned: "", pinnedLit: "", surface: "", link: "", linkLit: "" };

      const isLit = (slug: string) => lit !== null && (slug === lit || Boolean(neighbors.get(lit)?.has(slug)));
      const touches = (link: GraphLink) =>
        lit !== null && (endSlug(link.source) === lit || endSlug(link.target) === lit);
      const dimmed = () => 1 - fade * GRAPH.dim;

      const drawNode = (node: GraphNode, ctx: CanvasRenderingContext2D) => {
        const glowing = isLit(node.slug);
        ctx.globalAlpha = lit && !glowing ? dimmed() : 1;
        const lifted = glowing && fade > 0;
        if (node.pinned) ctx.fillStyle = lifted ? colors.pinnedLit : colors.pinned;
        else ctx.fillStyle = lifted ? colors.lifted : colors.node;
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, node.radius, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      const redraw = () => graph.nodeCanvasObject(drawNode);

      const drawLabels = (ctx: CanvasRenderingContext2D, scale: number) => {
        const zoomAlpha = clamp((scale - GRAPH.labelZoomStart) / GRAPH.labelZoomRange);
        if (zoomAlpha === 0 && !lit) return;
        const pool = zoomAlpha === 0 && lit ? byDegree.filter((node) => isLit(node.slug)) : byDegree;
        const litNode = lit ? pool.find((node) => node.slug === lit) : undefined;
        const candidates = litNode ? [litNode, ...pool.filter((node) => node !== litNode)] : pool;
        const start = graph.screen2GraphCoords(0, 0);
        const end = graph.screen2GraphCoords(graph.width(), graph.height());
        const height = GRAPH.labelSize / scale;
        const gap = GRAPH.labelGap / scale;
        const placed: Array<[number, number, number, number]> = [];
        ctx.font = `500 ${height}px ${palette.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = colors.strong;
        ctx.strokeStyle = colors.surface;
        ctx.lineWidth = GRAPH.labelHalo / scale;
        ctx.lineJoin = "round";
        for (const node of candidates) {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          if (x < start.x || x > end.x || y < start.y || y > end.y) continue;
          const glowing = isLit(node.slug);
          const alpha = lit ? (glowing ? Math.max(zoomAlpha, fade) : zoomAlpha * dimmed()) : zoomAlpha;
          if (alpha < 0.02) continue;
          const text = hidden ? maskName(node.name) : node.name;
          const half = ctx.measureText(text).width / 2 + gap;
          const top = y + node.radius + 2 / scale;
          const box: [number, number, number, number] = [x - half, top - gap, x + half, top + height + gap];
          if (placed.some(([left, up, right, down]) => box[0] < right && box[2] > left && box[1] < down && box[3] > up))
            continue;
          placed.push(box);
          ctx.globalAlpha = alpha * GRAPH.labelAlpha;
          ctx.strokeText(text, x, top);
          ctx.fillText(text, x, top);
        }
        ctx.globalAlpha = 1;
      };

      const stepFade = () => {
        const active = hovered ?? focused;
        if (active) lit = active;
        const target = active ? 1 : 0;
        fade += (target - fade) * GRAPH.fadeStep;
        if (Math.abs(target - fade) < 0.01) fade = target;
        else redraw();
        if (fade === 0) lit = null;
        const tint = mix(palette.node, palette.accent, GRAPH.pinnedTint);
        colors = {
          node: rgba(palette.node, GRAPH.nodeAlpha),
          strong: rgba(palette.strong, 1),
          pinned: rgba(tint, GRAPH.pinnedAlpha),
          lifted: rgba(palette.strong, GRAPH.liftedAlpha),
          pinnedLit: rgba(tint, 1),
          surface: rgba(palette.surface, 1),
          link: rgba(palette.strong, GRAPH.linkAlpha * (lit ? dimmed() : 1)),
          linkLit: rgba(palette.strong, GRAPH.linkAlpha + (GRAPH.linkLitAlpha - GRAPH.linkAlpha) * fade),
        };
      };

      const focus = (query: string) => {
        const node = findNode(nodes, query);
        focused = node?.slug ?? null;
        if (node) {
          graph.centerAt(node.x, node.y, GRAPH.focusMs);
          graph.zoom(Math.max(graph.zoom(), GRAPH.focusZoom), GRAPH.focusMs);
        }
        redraw();
      };
      const fit = () => graph.zoomToFit(GRAPH.fitMs, Math.min(graph.width(), graph.height()) * GRAPH.fitInset);
      controlsRef.current = {
        focus,
        fit,
        zoomBy: (factor) => graph.zoom(graph.zoom() * factor, GRAPH.zoomMs),
      };

      graph
        .width(container.clientWidth)
        .height(container.clientHeight)
        .nodeId("slug")
        .nodeLabel(() => "")
        .nodeCanvasObject(drawNode)
        .nodePointerAreaPaint((node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, node.radius + GRAPH.hitPadding, 0, TAU);
          ctx.fill();
        })
        .linkColor((link) => (touches(link) ? colors.linkLit : colors.link))
        .linkWidth((link) => (touches(link) ? GRAPH.linkLitWidth : GRAPH.linkWidth))
        .autoPauseRedraw(true)
        .minZoom(GRAPH.minZoom)
        .maxZoom(GRAPH.maxZoom)
        .cooldownTime(GRAPH.cooldownMs)
        .d3AlphaDecay(GRAPH.alphaDecay)
        .d3VelocityDecay(GRAPH.velocityDecay)
        .onRenderFramePre(stepFade)
        .onRenderFramePost(drawLabels)
        .onNodeHover((node) => {
          hovered = node?.slug ?? null;
          redraw();
        })
        .onNodeClick((node) => router.navigate({ to: "/memory/$slug", params: { slug: node.slug } }))
        .onBackgroundClick(() => {
          focused = null;
          redraw();
        })
        .onEngineStop(() => {
          if (fitted) return;
          fitted = true;
          if (queryRef.current && findNode(nodes, queryRef.current)) focus(queryRef.current);
          else fit();
        })
        .graphData({ nodes, links });
      graph.d3Force("charge")?.strength(GRAPH.charge).distanceMax(GRAPH.chargeRange);
      graph.d3Force("link")?.distance(GRAPH.linkDistance);
      graph.d3Force("gravity", gravityForce(GRAPH.gravity));

      const resize = new ResizeObserver(([entry]) => {
        if (entry) graph.width(entry.contentRect.width).height(entry.contentRect.height);
      });
      resize.observe(container);
      const theme = new MutationObserver(() => {
        palette = readPalette(container);
        redraw();
      });
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      const unsubscribe = subscribeNamesHidden(() => {
        hidden = readNamesHidden();
        redraw();
      });

      return () => {
        resize.disconnect();
        theme.disconnect();
        unsubscribe();
        controlsRef.current = idleControls;
        graph._destructor();
        container.replaceChildren();
      };
    },
    [data, router],
  );

  const focus = (query: string) => {
    queryRef.current = query;
    controlsRef.current.focus(query);
  };

  return {
    attach,
    focus,
    fit: () => controlsRef.current.fit(),
    zoomIn: () => controlsRef.current.zoomBy(GRAPH.zoomStep),
    zoomOut: () => controlsRef.current.zoomBy(1 / GRAPH.zoomStep),
  };
};
