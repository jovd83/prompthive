export type SimplePrompt = {
    id: string;
    title: string;
    variableDefinitions?: string | null;
};

export type WorkflowStep = {
    id: string; // internal id (temp or real) used for React keys
    promptId: string;
    order: number;
    inputMappings: Record<string, string>;
    // Joined data
    promptTitle: string;
    promptVars: string[]; // extracted
};
