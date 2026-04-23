import { ArrowDown, ArrowUp, Info, Settings, Trash2 } from "lucide-react";
import { WorkflowStep } from "./types";

interface WorkflowStepCardProps {
    step: WorkflowStep;
    index: number;
    totalSteps: number;
    steps: WorkflowStep[]; // Needed for previous steps options
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    onRemove: (index: number) => void;
    onUpdateMapping: (index: number, varName: string, value: string) => void;
}

export function WorkflowStepCard({
    step,
    index,
    totalSteps,
    steps,
    onMoveUp,
    onMoveDown,
    onRemove,
    onUpdateMapping
}: WorkflowStepCardProps) {
    return (
        <div className="card bg-surface p-4 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border/50">
                <h3 className="font-bold flex items-center gap-2">
                    <span className="badge badge-neutral rounded-full w-6 h-6 p-0 flex items-center justify-center">{index + 1}</span>
                    {step.promptTitle}
                </h3>
                <div className="flex items-center gap-1">
                    <button className="btn btn-sm btn-ghost btn-square" onClick={() => onMoveUp(index)} disabled={index === 0} title="Move Up"><ArrowUp size={16} /></button>
                    <button className="btn btn-sm btn-ghost btn-square" onClick={() => onMoveDown(index)} disabled={index === totalSteps - 1} title="Move Down"><ArrowDown size={16} /></button>
                    <button className="btn btn-sm btn-ghost btn-square text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => onRemove(index)} title="Remove Step"><Trash2 size={16} /></button>
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
                                    onChange={(e) => onUpdateMapping(index, v, e.target.value)}
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
    );
}
