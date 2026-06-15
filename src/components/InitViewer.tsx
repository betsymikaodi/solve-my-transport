import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { TransportGrid } from "./TransportGrid";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";

export function InitViewer() {
  const { balanced, initResult, initStepIdx, setInitStep } = useStore();
  if (!balanced || !initResult) return null;
  const step = initResult.steps[initStepIdx];
  if (!step) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setInitStep(0)}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInitStep(Math.max(0, initStepIdx - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="font-mono text-sm px-3 py-1 bg-muted rounded">
          Étape {initStepIdx + 1} / {initResult.steps.length}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInitStep(Math.min(initResult.steps.length - 1, initStepIdx + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInitStep(initResult.steps.length - 1)}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        <div className="ml-auto text-sm">
          <span className="text-muted-foreground">Z courant : </span>
          <span className="font-mono font-bold text-primary">
            {step.allocations.reduce(
              (s: number, a) => s + (a.isEpsilon ? 0 : a.quantity * balanced.costs[a.row][a.col]),
              0,
            )}
          </span>
        </div>
      </div>

      <div className="rounded-md bg-surface border border-border p-3 text-sm">{step.message}</div>

      <TransportGrid
        problem={balanced}
        allocations={step.allocations}
        highlightCell={step.highlightCell ?? null}
        rowPenalties={step.rowPenalties ?? null}
        colPenalties={step.colPenalties ?? null}
        selectedAxis={step.selectedAxis ?? null}
        remainingSupply={step.remainingSupply}
        remainingDemand={step.remainingDemand}
      />
    </div>
  );
}
