"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import LanguageSelector from "../LanguageSelector";

export default function LanguageSettings() {
    const { t } = useLanguage();

    return (
        <div className="card space-y-6 mb-6">
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Globe size={20} />
                    {t('settings.languageSettings') || "Language Settings"}
                </h2>

                <div className="p-4 border border-border rounded-lg bg-secondary/10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1">
                            <h3 className="font-medium">{t('common.language') || "Language"}</h3>
                            <p className="text-xs text-muted-foreground">{t('help.content.language.desc') || "Select your interface language"}</p>
                        </div>
                    </div>
                    <LanguageSelector />
                </div>
            </div>
        </div>
    );
}
