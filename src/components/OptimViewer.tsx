import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { TransportGrid } from './TransportGrid';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';

export function OptimViewer() {
  const { balanced, optimResult, optimStepIdx, setOptimStep } = useStore();
  if (!balanced || !optimResult) return null;
  const step = optimResult.steps[optimStepIdx];
  if (!step) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => setOptimStep(0)}><SkipBack className="w-4 h-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => setOptimStep(Math.max(0, optimStepIdx - 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="font-mono text-sm px-3 py-1 bg-muted rounded">
          Itération {step.iteration} / {optimResult.iterations}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOptimStep(Math.min(optimResult.steps.length - 1, optimStepIdx + 1))}><ChevronRight className="w-4 h-4" /></Button>
        <Button size="sm" variant="outline" onClick={() => setOptimStep(optimResult.steps.length - 1)}><SkipForward className="w-4 h-4" /></Button>
        <div className="ml-auto text-sm">
          <span className="text-muted-foreground">Z = </span>
          <span className="font-mono font-bold text-primary text-lg">{step.totalCost}</span>
          {step.optimal && <span className="ml-2 px-2 py-0.5 text-xs rounded bg-positive/20 text-positive font-bold">OPTIMAL ✓</span>}
        </div>
      </div>

      <div className={`rounded-md p-3 text-sm border ${step.optimal ? 'bg-positive/10 border-positive/30' : 'bg-surface border-border'}`}>
        {step.message}
        {step.theta !== undefined && <span className="ml-2 font-mono">(θ = {step.theta})</span>}
      </div>

      <TransportGrid
        problem={balanced}
        allocations={step.allocations}
        cycle={step.cycle ?? null}
        potentials={step.potentials ?? null}
        deltas={step.deltas ?? null}
        enteringCell={step.enteringCell ?? null}
      />
    </div>
  );
}
