"use client";

import EditPromptForm from "@/components/EditPromptForm";
import { useLanguage } from "./LanguageProvider";

export default function EditPromptContent({ prompt, latestVersion, collections, tags, agentSkills, tagColorsEnabled, privatePromptsEnabled = false }: any) {
    const { t } = useLanguage();
    return (
        <div className="max-w-3xl mx-auto pb-12">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                {prompt.itemType === 'AGENT_SKILL' ? (
                    <span className="shrink-0 text-xl leading-none" title="Agent Skill">
                        🤖
                    </span>
                ) : (
                    <span className="shrink-0 text-xl leading-none" title="Prompt">
                        📝
                    </span>
                )}
                {t('prompts.editTitle').replace('{{title}}', prompt.title)}
            </h1>
            <EditPromptForm 
                prompt={prompt} 
                latestVersion={latestVersion} 
                collections={collections} 
                tags={tags} 
                agentSkills={agentSkills}
                tagColorsEnabled={tagColorsEnabled} 
                privatePromptsEnabled={privatePromptsEnabled} 
            />
        </div>
    );
}
