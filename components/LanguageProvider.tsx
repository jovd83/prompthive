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
    t: (key: string) => string;
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

    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = dictionaries[language];
        for (const key of keys) {
            if (current === undefined || current[key] === undefined) {
                // Fallback to English
                current = dictionaries['en'];
                for (const enKey of keys) {
                    if (current === undefined || current[enKey] === undefined) return path;
                    current = current[enKey];
                }
                return current as string;
            }
            current = current[key];
        }
        return current as string;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
