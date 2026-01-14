import { useState } from "react";
import { SimplePrompt, WorkflowStep } from "./types";

export function useWorkflowSteps(initialSteps: any[], allPrompts: SimplePrompt[]) {

    // Helper: Parse variables
    const parseVariables = (def: string | null | undefined): string[] => {
        if (!def) return [];
        const matches = def.match(/{{([^}]+)}}/g);
        if (matches) {
            return matches.map(m => m.replace(/{{|}}/g, '').trim());
        }
        if (def.includes(',')) return def.split(',').map(s => s.trim());
        return [def.trim()].filter(Boolean);
    };

    // Initial State
    const [steps, setSteps] = useState<WorkflowStep[]>(() => {
        if (!initialSteps || initialSteps.length === 0) return [];
        return initialSteps.map((s: any) => {
            const p = allPrompts.find(ap => ap.id === s.promptId);
            const vars = parseVariables(p?.variableDefinitions);
            return {
                id: s.id,
                promptId: s.promptId,
                order: s.order,
                inputMappings: s.inputMappings ? JSON.parse(s.inputMappings) : {},
                promptTitle: p?.title || "Unknown Prompt",
                promptVars: vars
            };
        }).sort((a: WorkflowStep, b: WorkflowStep) => a.order - b.order);
    });

    // Add Step
    const addStep = (promptId: string) => {
        const p = allPrompts.find(ap => ap.id === promptId);
        if (!p) return;

        const newStep: WorkflowStep = {
            id: `temp-${Date.now()}-${Math.random()}`,
            promptId: p.id,
            order: steps.length,
            inputMappings: {},
            promptTitle: p.title,
            promptVars: parseVariables(p.variableDefinitions)
        };
        setSteps([...steps, newStep]);
    };

    // Remove Step
    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        newSteps.forEach((s, i) => s.order = i); // Re-index order
        setSteps(newSteps);
    };

    // Move Step
    const moveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

        // Re-index
        newSteps.forEach((s, i) => s.order = i);
        setSteps(newSteps);
    };

    // Update Mapping
    const updateMapping = (stepIndex: number, varName: string, value: string) => {
        const newSteps = [...steps];
        newSteps[stepIndex].inputMappings = {
            ...newSteps[stepIndex].inputMappings,
            [varName]: value
        };
        setSteps(newSteps);
    };

    return {
        steps,
        addStep,
        removeStep,
        moveStep,
        updateMapping
    };
}
