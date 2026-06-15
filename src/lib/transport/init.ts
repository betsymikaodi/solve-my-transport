// Five initialization methods producing step-by-step traces.

import {
  Allocation,
  InitMethod,
  InitResult,
  InitStep,
  TransportProblem,
  cloneAllocs,
  computeCost,
  fixDegeneracy,
} from "./core";

function snapshot(
  message: string,
  type: InitStep["type"],
  allocations: Allocation[],
  rs: number[],
  rd: number[],
  extras: Partial<InitStep> = {},
): InitStep {
  return {
    type,
    message,
    allocations: cloneAllocs(allocations),
    remainingSupply: [...rs],
    remainingDemand: [...rd],
    ...extras,
  };
}

export function solveInit(method: InitMethod, p: TransportProblem): InitResult {
  switch (method) {
    case "NorthWest":
      return northWest(p);
    case "MINILI":
      return miniLi(p);
    case "MINICO":
      return miniCo(p);
    case "MINITAB":
      return miniTab(p);
    case "BHammer":
      return bHammer(p);
  }
}

function finalize(
  method: InitMethod,
  allocations: Allocation[],
  steps: InitStep[],
  p: TransportProblem,
): InitResult {
  const m = p.supply.length,
    n = p.demand.length;
  const fixed = fixDegeneracy(allocations, m, n, p.costs);
  if (fixed.addedEpsilons.length > 0) {
    steps.push({
      type: "note",
      message: `⚠️ Cas dégénéré : ${fixed.addedEpsilons.length} allocation(s) fictive(s) ε ajoutée(s) en ${fixed.addedEpsilons.map(([i, j]) => `(${i + 1},${j + 1})`).join(", ")}.`,
      allocations: cloneAllocs(fixed.allocations),
      remainingSupply: new Array(m).fill(0),
      remainingDemand: new Array(n).fill(0),
    });
  }
  return {
    method,
    allocations: fixed.allocations,
    steps,
    totalCost: computeCost(fixed.allocations, p.costs),
    isDegenerate: fixed.isDegenerate,
  };
}

function northWest(p: TransportProblem): InitResult {
  const m = p.supply.length,
    n = p.demand.length;
  const rs = [...p.supply],
    rd = [...p.demand];
  const allocs: Allocation[] = [];
  const steps: InitStep[] = [];
  let i = 0,
    j = 0;
  while (i < m && j < n) {
    const q = Math.min(rs[i], rd[j]);
    allocs.push({ row: i, col: j, quantity: q });
    rs[i] -= q;
    rd[j] -= q;
    steps.push(
      snapshot(
        `Allocation x(${i + 1},${j + 1}) = min(${rs[i] + q}, ${rd[j] + q}) = ${q}`,
        "allocate",
        allocs,
        rs,
        rd,
        { highlightCell: [i, j] },
      ),
    );
    if (rs[i] === 0 && rd[j] === 0) {
      // degenerate corner: move diagonally
      if (i < m - 1) i++;
      else j++;
    } else if (rs[i] === 0) i++;
    else j++;
  }
  return finalize("NorthWest", allocs, steps, p);
}

function miniByOrder(p: TransportProblem, byRow: boolean, name: InitMethod): InitResult {
  const m = p.supply.length,
    n = p.demand.length;
  const rs = [...p.supply],
    rd = [...p.demand];
  const allocs: Allocation[] = [];
  const steps: InitStep[] = [];
  const outer = byRow ? m : n;
  for (let k = 0; k < outer; k++) {
    // repeatedly allocate in this row/col until saturated
    while (true) {
      let bestI = -1,
        bestJ = -1,
        bestC = Infinity;
      if (byRow) {
        const i = k;
        if (rs[i] === 0) break;
        for (let j = 0; j < n; j++) {
          if (rd[j] === 0) continue;
          if (p.costs[i][j] < bestC) {
            bestC = p.costs[i][j];
            bestI = i;
            bestJ = j;
          }
        }
      } else {
        const j = k;
        if (rd[j] === 0) break;
        for (let i = 0; i < m; i++) {
          if (rs[i] === 0) continue;
          if (p.costs[i][j] < bestC) {
            bestC = p.costs[i][j];
            bestI = i;
            bestJ = j;
          }
        }
      }
      if (bestI < 0) break;
      const q = Math.min(rs[bestI], rd[bestJ]);
      allocs.push({ row: bestI, col: bestJ, quantity: q });
      rs[bestI] -= q;
      rd[bestJ] -= q;
      steps.push(
        snapshot(
          `${byRow ? `Ligne ${bestI + 1}` : `Colonne ${bestJ + 1}`} : min coût = ${bestC} en (${bestI + 1},${bestJ + 1}). Allocation = ${q}.`,
          "allocate",
          allocs,
          rs,
          rd,
          { highlightCell: [bestI, bestJ] },
        ),
      );
    }
  }
  return finalize(name, allocs, steps, p);
}

function miniLi(p: TransportProblem) {
  return miniByOrder(p, true, "MINILI");
}
function miniCo(p: TransportProblem) {
  return miniByOrder(p, false, "MINICO");
}

function miniTab(p: TransportProblem): InitResult {
  const m = p.supply.length,
    n = p.demand.length;
  const rs = [...p.supply],
    rd = [...p.demand];
  const allocs: Allocation[] = [];
  const steps: InitStep[] = [];
  while (true) {
    let bestI = -1,
      bestJ = -1,
      bestC = Infinity;
    for (let i = 0; i < m; i++) {
      if (rs[i] === 0) continue;
      for (let j = 0; j < n; j++) {
        if (rd[j] === 0) continue;
        if (p.costs[i][j] < bestC) {
          bestC = p.costs[i][j];
          bestI = i;
          bestJ = j;
        }
      }
    }
    if (bestI < 0) break;
    const q = Math.min(rs[bestI], rd[bestJ]);
    allocs.push({ row: bestI, col: bestJ, quantity: q });
    rs[bestI] -= q;
    rd[bestJ] -= q;
    steps.push(
      snapshot(
        `Min global = ${bestC} en (${bestI + 1},${bestJ + 1}). Allocation = ${q}.`,
        "allocate",
        allocs,
        rs,
        rd,
        { highlightCell: [bestI, bestJ] },
      ),
    );
  }
  return finalize("MINITAB", allocs, steps, p);
}

function bHammer(p: TransportProblem): InitResult {
  const m = p.supply.length,
    n = p.demand.length;
  const rs = [...p.supply],
    rd = [...p.demand];
  const allocs: Allocation[] = [];
  const steps: InitStep[] = [];
  const rowDone = new Array(m).fill(false);
  const colDone = new Array(n).fill(false);

  while (true) {
    const aliveRows = rowDone.map((d, i) => !d && rs[i] > 0);
    const aliveCols = colDone.map((d, j) => !d && rd[j] > 0);
    if (!aliveRows.some(Boolean) || !aliveCols.some(Boolean)) break;

    const rowPen: (number | null)[] = new Array(m).fill(null);
    const colPen: (number | null)[] = new Array(n).fill(null);

    for (let i = 0; i < m; i++) {
      if (!aliveRows[i]) continue;
      const cs = [];
      for (let j = 0; j < n; j++) if (aliveCols[j]) cs.push(p.costs[i][j]);
      if (cs.length === 0) continue;
      cs.sort((a, b) => a - b);
      rowPen[i] = cs.length === 1 ? cs[0] : cs[1] - cs[0];
    }
    for (let j = 0; j < n; j++) {
      if (!aliveCols[j]) continue;
      const cs = [];
      for (let i = 0; i < m; i++) if (aliveRows[i]) cs.push(p.costs[i][j]);
      if (cs.length === 0) continue;
      cs.sort((a, b) => a - b);
      colPen[j] = cs.length === 1 ? cs[0] : cs[1] - cs[0];
    }

    let maxPen = -Infinity;
    type Axis = { kind: "row" | "col"; index: number };
    let axis: Axis | null = null;
    for (let i = 0; i < m; i++) {
      const pv = rowPen[i];
      if (pv !== null && pv > maxPen) {
        maxPen = pv;
        axis = { kind: "row", index: i };
      }
    }
    for (let j = 0; j < n; j++) {
      const pv = colPen[j];
      if (pv !== null && pv > maxPen) {
        maxPen = pv;
        axis = { kind: "col", index: j };
      }
    }
    if (!axis) break;
    const sel: Axis = axis;

    // record penalty step
    steps.push(
      snapshot(
        `Pénalités calculées. Max = ${maxPen} sur ${sel.kind === "row" ? `ligne ${sel.index + 1}` : `colonne ${sel.index + 1}`}.`,
        "penalty",
        allocs,
        rs,
        rd,
        {
          rowPenalties: rowPen,
          colPenalties: colPen,
          selectedAxis: sel,
          blockedRows: rowDone.map((d, i) => (d ? i : -1)).filter((x) => x >= 0),
          blockedCols: colDone.map((d, j) => (d ? j : -1)).filter((x) => x >= 0),
        },
      ),
    );

    // pick min cost cell along that axis
    let bestI = -1,
      bestJ = -1,
      bestC = Infinity;
    if (sel.kind === "row") {
      const i = sel.index;
      for (let j = 0; j < n; j++) {
        if (!aliveCols[j]) continue;
        if (p.costs[i][j] < bestC) {
          bestC = p.costs[i][j];
          bestI = i;
          bestJ = j;
        }
      }
    } else {
      const j = sel.index;
      for (let i = 0; i < m; i++) {
        if (!aliveRows[i]) continue;
        if (p.costs[i][j] < bestC) {
          bestC = p.costs[i][j];
          bestI = i;
          bestJ = j;
        }
      }
    }
    const q = Math.min(rs[bestI], rd[bestJ]);
    allocs.push({ row: bestI, col: bestJ, quantity: q });
    rs[bestI] -= q;
    rd[bestJ] -= q;
    if (rs[bestI] === 0) rowDone[bestI] = true;
    if (rd[bestJ] === 0) colDone[bestJ] = true;

    steps.push(
      snapshot(
        `Allocation x(${bestI + 1},${bestJ + 1}) = ${q} (coût min = ${bestC} sur l'axe sélectionné).`,
        "allocate",
        allocs,
        rs,
        rd,
        { highlightCell: [bestI, bestJ] },
      ),
    );
  }
  return finalize("BHammer", allocs, steps, p);
}
