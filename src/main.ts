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
