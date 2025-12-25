
import { useState } from 'react';
import { extractUniqueVariables } from '@/lib/prompt-utils';

export type Variable = { key: string; description: string };

export function usePromptEditor(initialVariables: Variable[] = []) {
    const [variables, setVariables] = useState<Variable[]>(initialVariables);
    const [newAttachments, setNewAttachments] = useState<File[]>([]);
    const [newResultImages, setNewResultImages] = useState<File[]>([]);

    const addVariable = () => setVariables([...variables, { key: "", description: "" }]);
    const removeVariable = (index: number) => setVariables(variables.filter((_, i) => i !== index));
    const updateVariable = (index: number, field: "key" | "description", value: string) => {
        const newVars = [...variables];
        newVars[index][field] = value;
        setVariables(newVars);
    };

    const scanForVariables = (content: string, shortContent: string) => {
        const text = `${content} ${shortContent}`;
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

    return {
        variables,
        setVariables,
        addVariable,
        removeVariable,
        updateVariable,
        scanForVariables,
        newAttachments,
        newResultImages,
        handleFileChange,
        removeNewAttachment,
        removeNewResultImage
    };
}
