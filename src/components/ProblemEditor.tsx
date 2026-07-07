import { useStore, EXAMPLE } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TransportProblem } from "@/lib/transport/core";

export function ProblemEditor() {
  const { problem, setProblem } = useStore();
  const m = problem.supply.length,
    n = problem.demand.length;

  const setSize = (newM: number, newN: number) => {
    const supply = Array.from({ length: newM }, (_, i) => problem.supply[i] ?? 10);
    const demand = Array.from({ length: newN }, (_, j) => problem.demand[j] ?? 10);
    const costs = Array.from({ length: newM }, (_, i) =>
      Array.from({ length: newN }, (_, j) => problem.costs[i]?.[j] ?? 0),
    );
    setProblem({
      ...problem,
      supply,
      demand,
      costs,
      rowLabels: Array.from({ length: newM }, (_, i) => String.fromCharCode(65 + i)),
      colLabels: Array.from({ length: newN }, (_, j) => `D${j + 1}`),
    });
  };

  const update = (patch: Partial<TransportProblem>) => setProblem({ ...problem, ...patch });

  const totalS = problem.supply.reduce((a, b) => a + b, 0);
  const totalD = problem.demand.reduce((a, b) => a + b, 0);
  const balanced = totalS === totalD;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-display">
            Origines (m)
          </label>
          <Input
            type="number"
            min={2}
            max={8}
            value={m}
            onChange={(e) => setSize(+e.target.value, n)}
            className="w-20"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-display">
            Destinations (n)
          </label>
          <Input
            type="number"
            min={2}
            max={8}
            value={n}
            onChange={(e) => setSize(m, +e.target.value)}
            className="w-20"
          />
        </div>
        <Button variant="outline" onClick={() => setProblem(EXAMPLE)}>
          Charger l'exemple du cours
        </Button>
        <Button variant="outline" onClick={() => setProblem({
          supply: Array.from({ length: m }, () => 10),
          demand: Array.from({ length: n }, () => 10),
          costs: Array.from({ length: m }, () => Array.from({ length: n }, () => 0)),
          rowLabels: Array.from({ length: m }, (_, i) => String.fromCharCode(65 + i)),
          colLabels: Array.from({ length: n }, (_, j) => `D${j + 1}`),
        })}>
          Saisie manuelle
        </Button>
        <div
          className={`ml-auto px-3 py-2 rounded-md text-sm font-mono ${balanced ? "bg-positive/15 text-positive" : "bg-destructive/15 text-destructive"}`}
        >
          {balanced
            ? "✓ Équilibré"
            : `⚠ Déséquilibre : ${totalS > totalD ? "+" : ""}${totalS - totalD}`}{" "}
          (Σa={totalS}, Σb={totalD})
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-card p-2">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-1"></th>
              {problem.demand.map((_, j) => (
                <th key={j} className="p-1 text-xs font-display text-muted-foreground">
                  D{j + 1}
                </th>
              ))}
              <th className="p-1 text-xs font-display text-accent">Offre aᵢ</th>
            </tr>
          </thead>
          <tbody>
            {problem.supply.map((s, i) => (
              <tr key={i}>
                <th className="p-1 text-xs font-display text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </th>
                {problem.demand.map((_, j) => (
                  <td key={j} className="p-0.5">
                    <Input
                      type="number"
                      value={problem.costs[i][j]}
                      onChange={(e) => {
                        const costs = problem.costs.map((r) => [...r]);
                        costs[i][j] = +e.target.value;
                        update({ costs });
                      }}
                      className="w-16 h-9 text-center font-mono"
                    />
                  </td>
                ))}
                <td className="p-0.5">
                  <Input
                    type="number"
                    value={s}
                    onChange={(e) => {
                      const supply = [...problem.supply];
                      supply[i] = +e.target.value;
                      update({ supply });
                    }}
                    className="w-16 h-9 text-center font-mono bg-accent/10"
                  />
                </td>
              </tr>
            ))}
            <tr>
              <th className="p-1 text-xs font-display text-accent">Dem. bⱼ</th>
              {problem.demand.map((d, j) => (
                <td key={j} className="p-0.5">
                  <Input
                    type="number"
                    value={d}
                    onChange={(e) => {
                      const demand = [...problem.demand];
                      demand[j] = +e.target.value;
                      update({ demand });
                    }}
                    className="w-16 h-9 text-center font-mono bg-accent/10"
                  />
                </td>
              ))}
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
