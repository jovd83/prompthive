import { useState, useEffect } from 'react';
import { extractUniqueVariables } from '@/lib/prompt-utils';

export type Variable = { key: string; description: string };

type ExistingAttachment = {
    id: string;
    filePath: string;
    role: string;
    isLegacy?: boolean;
};

export type UsePromptEditorProps = {
    initialVariables?: Variable[];
    initialContent?: string;
    initialShortContent?: string;
    initialDescription?: string;
    existingAttachments?: ExistingAttachment[]; // All attachments, will be split by role
    legacyResultImage?: string | null;
    initialAgentUsage?: string;
    initialAgentSkillIds?: string;
    allAgentSkills?: any[];
};

export function usePromptEditor({
    initialVariables = [],
    initialContent = "",
    initialShortContent = "",
    initialDescription = "",
    existingAttachments = [],
    legacyResultImage = null,
    initialAgentUsage = "",
    initialAgentSkillIds = "[]",
    allAgentSkills = []
}: UsePromptEditorProps = {}) {
    // --- Form Content State ---
    const [content, setContent] = useState(initialContent);
    const [shortContent, setShortContent] = useState(initialShortContent);
    const [description, setDescription] = useState(initialDescription);
    const [agentUsage, setAgentUsage] = useState(initialAgentUsage);
    
    // Track selected skills and their sources (skill IDs that inherited them, or 'direct')
    const [selectedSkillsMap, setSelectedSkillsMap] = useState<Record<string, string[]>>(() => {
        const initialIds = JSON.parse(initialAgentSkillIds || "[]") as string[];
        const map: Record<string, string[]> = {};
        initialIds.forEach(id => {
            map[id] = ['direct'];
        });
        return map;
    });

    const agentSkillIds = Object.keys(selectedSkillsMap);

    console.log(`[usePromptEditor] Render. Desc: "${description}", Initial: "${initialDescription}"`);
    useEffect(() => { console.log("[usePromptEditor] Mount"); return () => console.log("[usePromptEditor] Unmount"); }, []);
    const [variables, setVariables] = useState<Variable[]>(initialVariables);

    // --- UI View State ---
    const [isCodeView, setIsCodeView] = useState(false);
    const [isLongCodeView, setIsLongCodeView] = useState(false);

    // --- File Handling: New ---
    const [newAttachments, setNewAttachments] = useState<File[]>([]);
    const [newResultImages, setNewResultImages] = useState<File[]>([]);

    // --- File Handling: Existing (Edit Mode) ---
    // Split existing attachments by role
    const initialKeptAttachments = existingAttachments.filter(a => a.role !== 'RESULT');
    const initialKeptResults = existingAttachments.filter(a => a.role === 'RESULT');

    // Handle legacy result image (if it exists and isn't already in the list)
    if (legacyResultImage && !initialKeptResults.some(a => a.filePath === legacyResultImage)) {
        initialKeptResults.push({
            id: 'legacy-result-image',
            filePath: legacyResultImage,
            role: 'RESULT',
            isLegacy: true
        });
    }

    const [keptAttachments, setKeptAttachments] = useState<ExistingAttachment[]>(initialKeptAttachments);
    const [keptResultImages, setKeptResultImages] = useState<ExistingAttachment[]>(initialKeptResults);

    // --- Actions: Variables ---
    const addVariable = () => setVariables([...variables, { key: "", description: "" }]);
    const removeVariable = (index: number) => setVariables(variables.filter((_, i) => i !== index));
    const updateVariable = (index: number, field: "key" | "description", value: string) => {
        const newVars = [...variables];
        newVars[index][field] = value;
        setVariables(newVars);
    };

    const scanForVariables = (c: string, lc: string) => {
        const text = `${c} ${lc}`;
        const matches = extractUniqueVariables(text);

        const newVariables = [...variables];
        let added = false;
        matches.forEach(key => {
            if (!newVariables.some(v => v.key === key)) {
                newVariables.push({ key, description: "" });
                added = true;
            }
        });

        if (added) setVariables(newVariables);
    };

    // --- Actions: Files (New) ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ATTACHMENT' | 'RESULT') => {
        const files = Array.from(e.target.files || []);
        const allowed = ['.txt', '.md', '.doc', '.docx', '.xls', '.xlsx', '.pdf', '.jpg', '.jpeg', '.png', '.svg', '.gif', '.json', '.j2', '.xml', '.xsd', '.swagger', '.jinja2'];

        const validFiles: File[] = [];
        for (const file of files) {
            const ext = "." + file.name.split('.').pop()?.toLowerCase();
            if (!allowed.includes(ext)) {
                alert(`Invalid file extension: ${ext}. Allowed: ${allowed.join(', ')}`);
                e.target.value = '';
                return;
            }
            validFiles.push(file);
        }

        if (type === 'ATTACHMENT') {
            setNewAttachments(prev => [...prev, ...validFiles]);
        } else {
            setNewResultImages(prev => [...prev, ...validFiles]);
        }
        e.target.value = '';
    };

    const removeNewAttachment = (index: number) => setNewAttachments(prev => prev.filter((_, i) => i !== index));
    const removeNewResultImage = (index: number) => setNewResultImages(prev => prev.filter((_, i) => i !== index));

    // --- Actions: Files (Existing) ---
    const removeKeptAttachment = (id: string) => setKeptAttachments(prev => prev.filter(att => att.id !== id));
    const removeKeptResultImage = (id: string) => setKeptResultImages(prev => prev.filter(att => att.id !== id));

    return {
        // Content
        content, setContent,
        shortContent, setShortContent,
        description, setDescription,
        variables, setVariables,

        // Variables Actions
        addVariable,
        removeVariable,
        updateVariable,
        scanForVariables,
        
        // Agent Actions
        agentUsage, setAgentUsage,
        agentSkillIds,
        selectedSkillsMap,
        toggleAgentSkill: (id: string, isDirect: boolean = true) => {
            setSelectedSkillsMap(prev => {
                const newMap = { ...prev };
                const isSelected = !!newMap[id] && newMap[id].includes(isDirect ? 'direct' : 'inherited');
                
                const skill = allAgentSkills.find(s => s.id === id);
                const inheritedIds = JSON.parse(skill?.versions?.[0]?.agentSkillIds || "[]") as string[];

                const recAdd = (targetId: string, sourceId: string, map: Record<string, string[]>) => {
                    if (!map[targetId]) map[targetId] = [];
                    if (!map[targetId].includes(sourceId)) {
                        map[targetId].push(sourceId);
                        // Recursively add for this skill's children
                        const targetSkill = allAgentSkills.find(s => s.id === targetId);
                        const children = JSON.parse(targetSkill?.versions?.[0]?.agentSkillIds || "[]") as string[];
                        children.forEach(childId => recAdd(childId, targetId, map));
                    }
                };

                const recRemove = (targetId: string, sourceId: string, map: Record<string, string[]>) => {
                    if (map[targetId]) {
                        map[targetId] = map[targetId].filter(s => s !== sourceId);
                        if (map[targetId].length === 0) {
                            const subSkill = allAgentSkills.find(s => s.id === targetId);
                            const children = JSON.parse(subSkill?.versions?.[0]?.agentSkillIds || "[]") as string[];
                            delete map[targetId];
                            children.forEach(childId => recRemove(childId, targetId, map));
                        }
                    }
                };

                if (newMap[id] && newMap[id].includes(isDirect ? 'direct' : 'inherited')) {
                    // Remove source
                    newMap[id] = newMap[id].filter(s => s !== (isDirect ? 'direct' : 'inherited'));
                    if (newMap[id].length === 0) {
                        delete newMap[id];
                        inheritedIds.forEach(childId => recRemove(childId, id, newMap));
                    }
                } else {
                    // Add source
                    if (!newMap[id]) newMap[id] = [];
                    newMap[id].push(isDirect ? 'direct' : 'inherited');
                    inheritedIds.forEach(childId => recAdd(childId, id, newMap));
                }
                return newMap;
            });
        },

        // UI State
        isCodeView, setIsCodeView,
        isLongCodeView, setIsLongCodeView,

        // New Files
        newAttachments,
        newResultImages,
        handleFileChange,
        removeNewAttachment,
        removeNewResultImage,

        // Existing Files
        keptAttachments,
        keptResultImages,
        removeKeptAttachment,
        removeKeptResultImage
    };
}
