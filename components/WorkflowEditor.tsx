"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Save, Trash2, ArrowUp, ArrowDown, Settings, Plus, Info } from "lucide-react";
import Link from "next/link";
import { updateWorkflowAction } from "@/actions/workflows";
import { useRouter } from "next/navigation";

// Types
type SimplePrompt = {
    id: string;
    title: string;
    variableDefinitions?: string | null;
};

type Step = {
    id: string; // internal id (temp or real) used for React keys
    promptId: string;
    order: number;
    inputMappings: Record<string, string>;
    // Joined data
    promptTitle: string;
    promptVars: string[]; // extracted
};

export default function WorkflowEditor({ workflow, allPrompts }: { workflow: any, allPrompts: SimplePrompt[] }) {
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
    const [steps, setSteps] = useState<Step[]>(() => {
        if (!workflow.steps || workflow.steps.length === 0) return [];
        return workflow.steps.map((s: any) => {
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
        }).sort((a: Step, b: Step) => a.order - b.order);
    });

    const [isSaving, startTransition] = useTransition();
    const router = useRouter();
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);

    // Add Step
    const addStep = (promptId: string) => {
        const p = allPrompts.find(ap => ap.id === promptId);
        if (!p) return;

        const newStep: Step = {
            id: `temp-${Date.now()}-${Math.random()}`,
            promptId: p.id,
            order: steps.length,
            inputMappings: {},
            promptTitle: p.title,
            promptVars: parseVariables(p.variableDefinitions)
        };
        setSteps([...steps, newStep]);
        setIsAddStepOpen(false);
    };

    // Remove Step
    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        newSteps.forEach((s, i) => s.order = i);
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

    // Save
    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("title", workflow.title);
            formData.append("description", workflow.description || "");

            const apiSteps = steps.map((s, i) => ({
                promptId: s.promptId,
                order: i,
                inputMappings: s.inputMappings
            }));

            formData.append("steps", JSON.stringify(apiSteps));

            await updateWorkflowAction(workflow.id, formData);
            router.refresh();
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface p-4 rounded-lg border border-border sticky top-4 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/workflows" className="btn btn-ghost btn-sm btn-square"><ArrowLeft /></Link>
                    <div>
                        <h1 className="text-xl font-bold">{workflow.title}</h1>
                        <p className="text-xs text-muted-foreground">{steps.length} Steps</p>
                    </div>
                </div>
                <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                    <Save size={18} className="mr-2" />
                    {isSaving ? "Saving..." : "Save Workflow"}
                </button>
            </div>

            {/* Workflow Builder Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Step List */}
                <div className="lg:col-span-2 space-y-4">
                    {steps.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
                            <p className="text-muted-foreground mb-4">No steps yet. Add your first prompt.</p>
                        </div>
                    )}

                    {steps.map((step, index) => (
                        <div key={step.id} className="card bg-surface p-4 border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="badge badge-neutral rounded-full w-6 h-6 p-0 flex items-center justify-center">{index + 1}</span>
                                    {step.promptTitle}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button className="btn btn-sm btn-ghost btn-square" onClick={() => moveStep(index, 'up')} disabled={index === 0} title="Move Up"><ArrowUp size={16} /></button>
                                    <button className="btn btn-sm btn-ghost btn-square" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} title="Move Down"><ArrowDown size={16} /></button>
                                    <button className="btn btn-sm btn-ghost btn-square text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeStep(index)} title="Remove Step"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {/* Variable Mappings */}
                            {step.promptVars.length > 0 ? (
                                <div className="space-y-3 bg-muted/30 p-3 rounded-md border border-border/50">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                        <Settings size={12} /> Input Variables
                                    </h4>
                                    {step.promptVars.map(v => (
                                        <div key={v} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-sm">
                                            <label className="font-mono text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border self-start mt-2 sm:mt-0">{v}</label>
                                            <div className="sm:col-span-2">
                                                <select
                                                    className="select select-bordered select-sm w-full"
                                                    value={step.inputMappings[v] || "USER_INPUT"}
                                                    onChange={(e) => updateMapping(index, v, e.target.value)}
                                                >
                                                    <option value="USER_INPUT">Start: User Input</option>
                                                    {/* Previous steps outputs */}
                                                    {steps.slice(0, index).map((prev, prevIdx) => (
                                                        <option key={prev.id} value={`step_index:${prevIdx}`}>
                                                            Step {prevIdx + 1} Output: {prev.promptTitle.substring(0, 20)}...
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="text-[10px] text-muted-foreground mt-1 px-1">
                                                    {step.inputMappings[v]?.startsWith('step_index')
                                                        ? `Data comes from Step ${parseInt(step.inputMappings[v].split(':')[1]) + 1}`
                                                        : "You will enter this manually when running."}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic flex items-center gap-2">
                                    <Info size={12} /> No variables detected in this prompt. It will run as static text.
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Add Step Button */}
                    <div className="relative w-full">
                        <button
                            type="button"
                            onClick={() => setIsAddStepOpen(!isAddStepOpen)}
                            className="btn btn-outline btn-block border-dashed h-auto py-3"
                        >
                            <Plus size={18} /> Add Step
                        </button>

                        {isAddStepOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsAddStepOpen(false)}></div>
                                <div className="absolute bottom-full mb-2 left-0 z-50 w-full p-2 shadow-xl bg-surface rounded-box border border-border">
                                    <div className="sticky top-0 bg-surface p-2 border-b border-border z-10">
                                        <input type="text" placeholder="Search prompts..." className="input input-sm input-bordered w-full" autoFocus />
                                    </div>
                                    <ul className="pt-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {allPrompts.map(p => (
                                            <li key={p.id}>
                                                <button
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 hover:bg-muted/50 rounded-md transition-colors flex items-center justify-between group"
                                                    onClick={() => addStep(p.id)}
                                                >
                                                    <span className="font-bold">{p.title}</span>
                                                    {p.variableDefinitions && (
                                                        <span className="text-xs text-muted-foreground font-mono opacity-50 group-hover:opacity-100">
                                                            Vars: {p.variableDefinitions.substring(0, 20)}...
                                                        </span>
                                                    )}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar / Info */}
                <div className="lg:col-span-1">
                    <div className="card p-5 bg-surface border border-border sticky top-24">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Info size={16} /> Workflow Logic
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-4">
                            <p>
                                <strong>1. Sequence:</strong> Prompts run in order from top to bottom.
                            </p>
                            <p>
                                <strong>2. Variables:</strong> Each prompt can receive input from:
                            </p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><strong>User Input:</strong> Values you provide when you start the run.</li>
                                <li><strong>Step Output:</strong> The result generated by a previous step.</li>
                            </ul>
                            <div className="alert alert-info py-2 text-xs mt-4">
                                <Info size={14} /> Reordering steps may break mappings. Check your settings after moving items!
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
