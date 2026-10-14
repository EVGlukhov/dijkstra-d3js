import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";

type DirectedGraph = Record<string, Record<string, number>>;

const graph: DirectedGraph = {
  start: { A: 5, B: 2 },
  A: { C: 4, D: 2 },
  B: { A: 8, D: 7 },
  C: { D: 6, end: 3 },
  D: { end: 1 },
  end: {},
};

/*
  Пример взвешенного графа для алгоритма Дейкстры. Буквы обозначают вершины, 
  а числа — веса рёбер. Алгоритм ищет путь с наименьшей суммой весов 
  от начальной вершины start до конечной end.

          start
        /     |
    5 /       \2
    /         \
  A --------- B
  | \    8    |
  |   \       |
  |4    \2    |7    
  \       \   |
  |         \ |
  C --------- D
  |     6    /
  \         /
  |3       /1
  \       /
  \      /
    end
*/

function dijkstra(graph: DirectedGraph, start: string, end: string) {
  const distances: Record<string, number> = {};
  const visited = new Set();
  const path: Record<string, string> = {};

  for (const key in graph) {
    distances[key] = key === start ? 0 : Infinity;
  }

  while (!visited.has(end)) {
    let lowestDistance = Infinity;
    let node: string = "";

    for (const key in distances) {
      if (lowestDistance > distances[key] && !visited.has(key)) {
        lowestDistance = distances[key];
        node = key;
      }
    }

    const neighbors = graph[node];
    for (const key in neighbors) {
      const newDistance = distances[node] + neighbors[key];
      if (newDistance < distances[key]) {
        distances[key] = newDistance;
        path[key] = node;
      }
    }

    visited.add(node);
  }

  const shortPath = [];
  let current = end;
  while (current !== start) {
    shortPath.unshift(current);
    current = path[current];
  }

  shortPath.unshift(start);

  return shortPath;
}

console.log(dijkstra(graph, "start", "end"));

interface Node extends SimulationNodeDatum {
  id: string;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  weight: number;
}

// Turn the adjacency list into D3 nodes and weighted links.
const nodes: Node[] = Object.keys(graph).map((id) => ({ id }));
const links: Link[] = Object.entries(graph).flatMap(([source, neighbors]) =>
  Object.entries(neighbors).map(([target, weight]) => ({
    source,
    target,
    weight,
  })),
);
let selectedId: string | null = null;

const svg = select("#app")
  .append("svg")
  .attr("viewBox", "0 0 800 500")
  .attr("width", "100%")
  .attr("height", 500);

const graphGroup = svg
  .append("g")
  .attr(
    "transform",
    "translate(250, 150) rotate(30) scale(1.5) translate(-250, -150)",
  );

// Add an arrowhead so the directed edges are clear.
svg
  .append("defs")
  .append("marker")
  .attr("id", "arrow")
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 23)
  .attr("markerWidth", 10)
  .attr("markerHeight", 10)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5")
  .attr("fill", "#888");

const edgeLines = graphGroup
  .append("g")
  .selectAll<SVGLineElement, Link>("line")
  .data(links)
  .join("line")
  .attr("stroke", "#888")
  .attr("marker-end", "url(#arrow)");

const edgeWeights = graphGroup
  .append("g")
  .selectAll<SVGTextElement, Link>("text")
  .data(links)
  .join("text")
  .text((link) => link.weight)
  .attr("font-size", 12)
  .attr("text-anchor", "middle");

const nodeGroups = graphGroup
  .append("g")
  .selectAll<SVGElement, Node>("g")
  .data(nodes)
  .join("g");

nodeGroups
  .append("circle")
  .attr("r", 14)
  .attr("fill", "steelblue")
  .style("cursor", "pointer");

nodeGroups
  .append("text")
  .text((node) => node.id)
  .attr("text-anchor", "middle")
  .attr("font-size", 12)
  .attr("dy", 4)
  .attr("fill", "white")
  .style("cursor", "pointer");

nodeGroups.on("click", (event, node) => {
  event.stopPropagation();

  // Toggle off when the currently selected vertex is clicked again.
  selectedId = selectedId === node.id ? null : node.id;

  nodeGroups
    .classed("selected", (d) => d.id === selectedId)
    .select("circle")
    .attr("fill", (d) => (d.id === selectedId ? "red" : "steelblue"));
});

// D3 replaces link source/target IDs with node objects during simulation.
const nodeById = new Map(nodes.map((node) => [node.id, node]));
const getNode = (endpoint: string | Node): Node =>
  typeof endpoint === "string" ? nodeById.get(endpoint)! : endpoint;

// Calculate node positions, then update the SVG elements on each tick.
forceSimulation(nodes)
  .force(
    "link",
    forceLink<Node, Link>(links).id((node) => node.id),
  )
  .force("charge", forceManyBody().strength(-500))
  .force("center", forceCenter(400, 150))
  .on("tick", () => {
    edgeLines
      .attr("x1", (link) => getNode(link.source).x ?? 0)
      .attr("y1", (link) => getNode(link.source).y ?? 0)
      .attr("x2", (link) => getNode(link.target).x ?? 0)
      .attr("y2", (link) => getNode(link.target).y ?? 0);

    edgeWeights
      .attr(
        "x",
        (link) =>
          ((getNode(link.source).x ?? 0) + (getNode(link.target).x ?? 0)) / 2,
      )
      .attr(
        "y",
        (link) =>
          ((getNode(link.source).y ?? 0) + (getNode(link.target).y ?? 0)) / 2,
      );

    nodeGroups.attr(
      "transform",
      (node) => `translate(${node.x ?? 0}, ${node.y ?? 0})`,
    );
  });
