"use client";

import EditSkillForm from "@/components/EditSkillForm";
import { useLanguage } from "./LanguageProvider";

export default function EditSkillContent({ skill, collections, tags, agentSkills, tagColorsEnabled }: any) {
    const { t } = useLanguage();
    return (
        <div className="max-w-3xl mx-auto pb-12">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                <span className="shrink-0 text-xl leading-none" title="Agent Skill">
                    🤖
                </span>
                Edit Skill: {skill.title}
            </h1>
            <EditSkillForm 
                skill={skill} 
                collections={collections} 
                tags={tags} 
                agentSkills={agentSkills}
                tagColorsEnabled={tagColorsEnabled} 
            />
        </div>
    );
}
