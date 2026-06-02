import { create } from 'zustand';
import { TransportProblem, InitMethod, OptimMethod, BalancedProblem, InitResult, OptimResult } from '@/lib/transport/core';
import { balanceProblem } from '@/lib/transport/core';
import { solveInit } from '@/lib/transport/init';
import { solveOptim } from '@/lib/transport/optim';

interface Store {
  problem: TransportProblem;
  initMethod: InitMethod;
  optimMethod: OptimMethod;
  balanced: BalancedProblem | null;
  initResult: InitResult | null;
  optimResult: OptimResult | null;

  initStepIdx: number;
  optimStepIdx: number;

  setProblem: (p: TransportProblem) => void;
  setInitMethod: (m: InitMethod) => void;
  setOptimMethod: (m: OptimMethod) => void;
  solve: () => void;
  reset: () => void;

  setInitStep: (i: number) => void;
  setOptimStep: (i: number) => void;
}

export const EXAMPLE: TransportProblem = {
  supply: [18, 32, 14, 9],
  demand: [9, 11, 28, 6, 14, 5],
  costs: [
    [24, 22, 61, 49, 83, 35],
    [23, 39, 78, 28, 65, 42],
    [67, 56, 92, 24, 53, 54],
    [71, 43, 91, 67, 40, 49],
  ],
  rowLabels: ['A', 'B', 'C', 'D'],
  colLabels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
};

export const useStore = create<Store>((set, get) => ({
  problem: EXAMPLE,
  initMethod: 'BHammer',
  optimMethod: 'MODI',
  balanced: null,
  initResult: null,
  optimResult: null,
  initStepIdx: 0,
  optimStepIdx: 0,

  setProblem: (p) => set({ problem: p, balanced: null, initResult: null, optimResult: null, initStepIdx: 0, optimStepIdx: 0 }),
  setInitMethod: (m) => set({ initMethod: m, initResult: null, optimResult: null, initStepIdx: 0, optimStepIdx: 0 }),
  setOptimMethod: (m) => set({ optimMethod: m, optimResult: null, optimStepIdx: 0 }),
  solve: () => {
    const { problem, initMethod, optimMethod } = get();
    const balanced = balanceProblem(problem);
    const initResult = solveInit(initMethod, balanced);
    const optimResult = solveOptim(optimMethod, initResult.allocations, balanced);
    set({
      balanced, initResult, optimResult,
      initStepIdx: initResult.steps.length - 1,
      optimStepIdx: optimResult.steps.length - 1,
    });
  },
  reset: () => set({ balanced: null, initResult: null, optimResult: null, initStepIdx: 0, optimStepIdx: 0 }),
  setInitStep: (i) => set({ initStepIdx: i }),
  setOptimStep: (i) => set({ optimStepIdx: i }),
}));
