"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import nl from '@/locales/nl.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import it from '@/locales/it.json';
import de from '@/locales/de.json';
import sv from '@/locales/sv.json';
import { updateLanguage } from '@/actions/user';

const dictionaries: Record<string, any> = { en, nl, fr, es, it, de, sv };

type Language = 'en' | 'nl' | 'fr' | 'es' | 'it' | 'de' | 'sv';

const LanguageContext = createContext<{
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, variables?: Record<string, string | number>) => string;
}>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key,
});

export const LanguageProvider = ({ children, initialLanguage = 'en', user }: { children: React.ReactNode, initialLanguage?: string, user?: any }) => {
    const [language, setLanguageState] = useState<Language>(initialLanguage as Language);

    // Sync state if initialLanguage changes (e.g. fresh server render)
    useEffect(() => {
        if (initialLanguage && dictionaries[initialLanguage]) {
            setLanguageState(initialLanguage as Language);
        }
    }, [initialLanguage]);

    useEffect(() => {
        // If user NOT logged in or no initialLanguage provided, look at localStorage
        if (!user && typeof window !== 'undefined') {
            const stored = localStorage.getItem('language') as Language;
            if (stored && dictionaries[stored]) {
                setLanguageState(stored);
            }
        }
    }, [user]);

    const setLanguage = async (lang: Language) => {
        if (!dictionaries[lang]) return;
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('language', lang);
        }

        // If logged in, update DB
        if (user) {
            const formData = new FormData();
            formData.append('language', lang);
            await updateLanguage({}, formData);
        }
    };

    const t = (path: string, variables?: Record<string, string | number>) => {
        const keys = path.split('.');
        let current: any = dictionaries[language];
        let result: string | undefined = undefined;

        // Helper to traverse
        const traverse = (root: any, k: string[]) => {
            let node = root;
            for (const key of k) {
                if (node === undefined || node[key] === undefined) return undefined;
                node = node[key];
            }
            return node;
        }

        result = traverse(dictionaries[language], keys);

        // Fallback to English
        if (result === undefined) {
            result = traverse(dictionaries['en'], keys);
        }

        // If still not found, return path
        if (result === undefined || typeof result !== 'string') return path;

        // Interpolation
        if (variables) {
            for (const [key, value] of Object.entries(variables)) {
                result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
