"use client";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSelector() {
    const { language, setLanguage, t } = useLanguage();

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'nl', label: 'Nederlands' },
        { code: 'fr', label: 'Français' },
        { code: 'es', label: 'Español' },
        { code: 'it', label: 'Italiano' },
        { code: 'de', label: 'Deutsch' },
        { code: 'sv', label: 'Svenska' },
    ];

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{t('common.language')}</label>
            <select
                value={language}
                onChange={(e) => {
                    console.log(`LanguageSelector onChange: ${e.target.value}`);
                    setLanguage(e.target.value as any);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
