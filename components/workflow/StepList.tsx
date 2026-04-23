import { Plus } from "lucide-react";
import { useState } from "react";
import { SimplePrompt, WorkflowStep } from "./types";
import { WorkflowStepCard } from "./WorkflowStepCard";

interface StepListProps {
    steps: WorkflowStep[];
    allPrompts: SimplePrompt[];
    onAddStep: (promptId: string) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    onRemove: (index: number) => void;
    onUpdateMapping: (index: number, varName: string, value: string) => void;
}

export function StepList({
    steps,
    allPrompts,
    onAddStep,
    onMoveUp,
    onMoveDown,
    onRemove,
    onUpdateMapping
}: StepListProps) {
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredPrompts = allPrompts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = (id: string) => {
        onAddStep(id);
        setIsAddStepOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="lg:col-span-2 space-y-4">
            {steps.length === 0 && (
                <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No steps yet. Add your first prompt.</p>
                </div>
            )}

            {steps.map((step, index) => (
                <WorkflowStepCard
                    key={step.id}
                    step={step}
                    index={index}
                    totalSteps={steps.length}
                    steps={steps}
                    onMoveUp={() => onMoveUp(index)}
                    onMoveDown={() => onMoveDown(index)}
                    onRemove={() => onRemove(index)}
                    onUpdateMapping={onUpdateMapping}
                />
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
                                <input
                                    type="text"
                                    placeholder="Search prompts..."
                                    className="input input-sm input-bordered w-full"
                                    autoFocus
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <ul className="pt-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {filteredPrompts.length > 0 ? filteredPrompts.map(p => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            className="w-full text-left px-3 py-2 hover:bg-muted/50 rounded-md transition-colors flex items-center justify-between group"
                                            onClick={() => handleAdd(p.id)}
                                        >
                                            <span className="font-bold">{p.title}</span>
                                            {p.variableDefinitions && (
                                                <span className="text-xs text-muted-foreground font-mono opacity-50 group-hover:opacity-100">
                                                    Vars: {p.variableDefinitions.substring(0, 20)}...
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                )) : (
                                    <li className="p-2 text-center text-sm text-muted-foreground">No prompts found</li>
                                )}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
