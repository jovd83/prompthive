"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Check, Copy, Play, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { CopyToClipboard } from "@/components/CopyToClipboard";

type Step = {
    id: string;
    order: number;
    promptId: string;
    inputMappings: Record<string, string>; // { "varName": "USER_INPUT" | "step_index:0" }
    prompt: {
        id: string;
        title: string;
        versions: {
            content: string;
            variableDefinitions: string | null;
        }[]
    }
};

type Workflow = {
    id: string;
    title: string;
    description: string | null;
    steps: Step[];
};

export default function WorkflowRunner({ workflow }: { workflow: Workflow }) {
    // Execution State
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [userInputs, setUserInputs] = useState<Record<string, string>>({});
    const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({}); // Key: stepIndex (string) -> result
    const [currentOutput, setCurrentOutput] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    // Get current step
    const currentStep = workflow.steps[currentStepIdx];
    const totalSteps = workflow.steps.length;

    // Compile Prompt Function
    const compiledPrompt = useMemo(() => {
        if (!currentStep) return "";
        const version = currentStep.prompt.versions[0];
        if (!version) return "Error: No version found for prompt.";

        let content = version.content;
        const inputMappings = currentStep.inputMappings ? JSON.parse(currentStep.inputMappings as any) : {};

        // Find variables in content
        // This regex might differ from the one in PromptDetail, assuming standard {{var}}
        const variableRegex = /{{([^}]+)}}/g;

        return content.replace(variableRegex, (match, varName) => {
            const cleanVar = varName.trim();
            const source = inputMappings[cleanVar] || "USER_INPUT";

            if (source === "USER_INPUT") {
                return userInputs[`${currentStepIdx}-${cleanVar}`] || `{{${cleanVar}}}`;
            } else if (source.startsWith("step_index:")) {
                const sourceStepIdx = source.split(":")[1];
                return stepOutputs[sourceStepIdx] || `[WAITING FOR STEP ${parseInt(sourceStepIdx) + 1}]`;
            }
            return match;
        });
    }, [currentStep, currentStepIdx, userInputs, stepOutputs]);

    // Variables that need User Input for the CURRENT step
    const requiredUserInputs = useMemo(() => {
        if (!currentStep) return [];
        const version = currentStep.prompt.versions[0];
        if (!version?.variableDefinitions) return [];

        // Parse definitions
        const defs = version.variableDefinitions.split(',').map(s => s.trim());
        const inputMappings = currentStep.inputMappings ? JSON.parse(currentStep.inputMappings as any) : {};

        return defs.filter(v => {
            const cleanV = v.replace(/{{|}}/g, '').trim();
            const source = inputMappings[cleanV] || "USER_INPUT";
            return source === "USER_INPUT";
        }).map(v => v.replace(/{{|}}/g, '').trim());

    }, [currentStep]);

    // Handlers
    const handleInputChange = (varName: string, value: string) => {
        setUserInputs(prev => ({
            ...prev,
            [`${currentStepIdx}-${varName}`]: value
        }));
    };

    const handleNext = () => {
        // Save output
        setStepOutputs(prev => ({
            ...prev,
            [String(currentStepIdx)]: currentOutput
        }));

        // Move next or finish
        if (currentStepIdx < totalSteps - 1) {
            setCurrentStepIdx(prev => prev + 1);
            setCurrentOutput("");
        } else {
            setIsComplete(true);
        }
    };

    const handleReset = () => {
        if (confirm("Restart workflow? All progress will be lost.")) {
            setCurrentStepIdx(0);
            setUserInputs({});
            setStepOutputs({});
            setCurrentOutput("");
            setIsComplete(false);
        }
    };

    if (isComplete) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/workflows" className="btn btn-ghost btn-sm btn-square"><ArrowLeft /></Link>
                    <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Check size={28} /> Workflow Complete
                    </h1>
                </div>

                <div className="space-y-8">
                    {workflow.steps.map((step, idx) => (
                        <div key={step.id} className="card p-6 bg-surface border border-border">
                            <h3 className="font-bold text-lg mb-2 text-muted-foreground">Step {idx + 1}: {step.prompt.title}</h3>
                            <div className="bg-muted p-4 rounded-md font-mono text-sm whitespace-pre-wrap mb-4">
                                {stepOutputs[String(idx)]}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mt-8">
                    <button onClick={handleReset} className="btn btn-outline">
                        <RotateCcw size={18} className="mr-2" /> Start Over
                    </button>
                    <Link href="/workflows" className="btn btn-primary">
                        Back to Workflows
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/workflows" className="btn btn-ghost btn-sm btn-square"><ArrowLeft /></Link>
                    <div>
                        <h1 className="text-2xl font-bold">{workflow.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            Step {currentStepIdx + 1} of {totalSteps}
                        </p>
                    </div>
                </div>
                <button onClick={handleReset} className="btn btn-ghost text-red-500 hover:bg-red-50">
                    Exit Run
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentStepIdx) / totalSteps) * 100}%` }}></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Inputs & Prompt */}
                <div className="space-y-6">
                    <div className="card p-6 bg-surface border border-border">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="badge badge-primary rounded-full w-6 h-6 flex items-center justify-center p-0">{currentStepIdx + 1}</span>
                            {currentStep.prompt.title}
                        </h2>

                        {/* User Inputs Form */}
                        {requiredUserInputs.length > 0 && (
                            <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                                <h3 className="text-sm font-bold uppercase text-muted-foreground">Required Inputs</h3>
                                {requiredUserInputs.map(v => (
                                    <div key={v} className="form-control">
                                        <label className="label text-xs font-mono">{v}</label>
                                        <textarea
                                            className="textarea textarea-bordered textarea-sm w-full"
                                            value={userInputs[`${currentStepIdx}-${v}`] || ""}
                                            onChange={(e) => handleInputChange(v, e.target.value)}
                                            placeholder={`Enter value for ${v}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Compiled Prompt Display */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase text-muted-foreground">Compiled Prompt</h3>
                                <CopyToClipboard text={compiledPrompt} />
                            </div>
                            <div className="relative">
                                <textarea
                                    className="textarea textarea-bordered w-full h-64 font-mono text-sm leading-relaxed"
                                    value={compiledPrompt}
                                    readOnly
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Copy this prompt and run it in your AI tool (ChatGPT, Claude, etc).
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Output & Action */}
                <div className="space-y-6">
                    <div className="card p-6 bg-surface border border-border h-full flex flex-col">
                        <h2 className="text-lg font-bold mb-4">Step Result</h2>
                        <div className="form-control flex-1">
                            <label className="label">
                                <span className="label-text">Paste the AI response here:</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered w-full flex-1 min-h-[300px] font-mono text-sm"
                                placeholder="Paste response..."
                                value={currentOutput}
                                onChange={(e) => setCurrentOutput(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                className="btn btn-primary w-full md:w-auto"
                                onClick={handleNext}
                                disabled={!currentOutput.trim()}
                            >
                                {currentStepIdx < totalSteps - 1 ? (
                                    <>Next Step <ArrowRight size={18} /></>
                                ) : (
                                    <>Finish Workflow <Check size={18} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
