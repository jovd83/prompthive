"use client";

import { useRef, useState, useEffect } from "react";
import { Book, Code, Folder, GitBranch, Terminal, Shield, Menu, MessageSquare, Anchor, Lightbulb, Search, Globe, User, Lock, FileDown, ShieldCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { CopyToClipboard } from "@/components/CopyToClipboard";

const SCRAPER_SYSTEM_PROMPT = `**Role**: You are an expert data scraper and JSON formatter specialized in generating import files for the "PromptHive" application.

**Task**: 
1. Access and analyze the content of the following URL: [URL]
2. Identify all AI prompts, system instructions, or LLM examples on the page.
3. Extract them into a key-value structure containing:
            - **title**: A short, descriptive title (max 50 chars).
            - **content**: The main system instruction or prompt text.
            - **description**: Any explanatory text or context provided near the prompt.
            - **tags**: An array of 2-3 relevant topic tags based on the content (e.g., ["writing", "coding"]).
            - **usageExample**: If the page provides a "User Input" example (what the user types), extract it here. Otherwise, null.
            - **variableDefinitions**: If the prompt uses placeholders (e.g., {{name}}), list them here as a comma-separated string (e.g., "{{name}}, {{date}}"). Otherwise, null.
            - **resultText**: If the page provides an "Output" or "Response" example from the AI, extract it here. Otherwise, null.
            - **resource**: The URL of the page being scraped ([URL]).
4. **CRITICAL REQUIREMENT**: Add a \`collection\` field to EVERY prompt object. The value of this field MUST be the current date plus "Scrape" (e.g., "yyyy-mm-dd Scrape"). This ensures all imported prompts are grouped together.
5. Format the output as a valid JSON array.

**Target JSON Schema**:
\`\`\`json
[
    {
      "title": "Example Prompt Title",
      "content": "You are a helpful assistant. Please summarize {{content}}.",
      "description": "Used for general text summarization.",
      "tags": ["writing", "summary"],
      "usageExample": "Here is an article about space...",
      "variableDefinitions": "{{content}}",
      "resultText": "The article establishes that space is big...",
      "resource": "https://example.com/prompts/123",
      "collection": "yyyy-mm-dd Scrape"
    }
]
\`\`\`

**Constraints**:
- \`content\` must be a string. If the prompt has variables like {{name}}, preserve them.
- Output ONLY the raw JSON code block, no conversational filler.

**URL to Scrape**: [INSERT URL HERE]`;

export default function HelpPage() {
    const { t } = useLanguage();
    const [activeSection, setActiveSection] = useState("introduction");
    const observer = useRef<IntersectionObserver | null>(null);

    // --- Data Structure for Docs ---
    const DOC_SECTIONS = [
        {
            id: "introduction",
            title: t('help.sections.introduction'),
            icon: Book,
            content: (
                <div className="space-y-4">
                    <p className="lead text-lg text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('help.content.intro.welcome') }} />
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.intro.desc') }} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <Folder className="mb-2 text-primary" />
                            <h3 className="font-bold">{t('help.content.intro.organizeTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('help.content.intro.organizeDesc')}</p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <GitBranch className="mb-2 text-primary" />
                            <h3 className="font-bold">{t('help.content.intro.versionTitle')}</h3>
                            <p className="text-sm text-muted-foreground">{t('help.content.intro.versionDesc')}</p>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <Code className="mb-2 text-primary" />
                            <h3 className="font-bold">{t('help.content.intro.templatizeTitle')}</h3>
                            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('help.content.intro.templatizeDesc') }} />
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: "getting-started",
            title: t('help.sections.gettingStarted'),
            icon: Terminal,
            content: (
                <div className="space-y-6">
                    <div className="border border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-r shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-1">
                            <Lightbulb size={18} /> Tip
                        </div>
                        <p className="text-sm">{t('help.content.gettingStarted.tip')}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.gettingStarted.step1Title')}</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.gettingStarted.step1Li1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.gettingStarted.step1Li2') }} />
                            <li>{t('help.content.gettingStarted.step1Li3')}</li>
                            <li>{t('help.content.gettingStarted.step1Li4')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.gettingStarted.step1Li5') }} />
                        </ol>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.gettingStarted.step2Title')}</h3>
                        <p>{t('help.content.gettingStarted.step2Desc')}</p>
                        <ul className="list-disc list-inside ml-2">
                            <li>{t('help.content.gettingStarted.step2Li1')}</li>
                            <li>{t('help.content.gettingStarted.step2Li2')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.gettingStarted.step2Li3') }} />
                            <li>{t('help.content.gettingStarted.step2Li4')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.gettingStarted.step2Li5') }} />
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: "variables",
            title: t('help.sections.variables'),
            icon: Code,
            content: (
                <div className="space-y-6">
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.variables.desc') }} />

                    <h3 className="text-lg font-bold">{t('help.content.variables.syntaxTitle')}</h3>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm border border-border">
                        <span className="text-green-600 dark:text-green-400">{t('help.content.variables.good')}</span><br />
                        <span dangerouslySetInnerHTML={{ __html: t('help.content.variables.goodEx1') }} /><br />
                        <span dangerouslySetInnerHTML={{ __html: t('help.content.variables.goodEx2') }} /><br />
                        <span>Write a blog about <span className="text-blue-600 font-bold">[[topic]]</span>.</span><br /><br />
                        <span className="text-red-500 dark:text-red-400">{t('help.content.variables.bad')}</span><br />
                        {t('help.content.variables.badEx')}
                    </div>

                    <div className="border border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-r shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                            <Shield size={18} /> {t('help.content.variables.autoDetectTitle')}
                        </div>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.content.variables.autoDetectDesc') }} />
                    </div>
                </div>
            )
        },
        {
            id: "collections",
            title: t('help.sections.collections'),
            icon: Folder,
            content: (
                <div className="space-y-4">
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.collections.desc') }} />
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li dangerouslySetInnerHTML={{ __html: t('help.content.collections.li1') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('help.content.collections.li2') }} />
                        <li>{t('help.content.collections.li3')}</li>
                    </ul>
                    <h3 className="text-lg font-bold mt-4">{t('help.content.collections.dragDropTitle')}</h3>
                    <p>{t('help.content.collections.dragDropDesc')}</p>
                    <h3 className="text-lg font-bold mt-4">{t('help.content.collections.sortingTitle')}</h3>
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.collections.sortingDesc') }} />
                    <p className="mt-2" dangerouslySetInnerHTML={{ __html: t('help.content.collections.collapseDesc') }} />
                </div>
            )
        },
        {
            id: "ai-scraping",
            title: t('help.sections.aiScraping'),
            icon: Globe,
            content: (
                <div className="space-y-6">
                    <p>{t('help.content.aiScraping.desc1')}</p>
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.aiScraping.desc2') }} />

                    <div className="bg-muted p-4 rounded-lg border border-border">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <Terminal size={16} /> {t('help.content.aiScraping.systemPromptTitle')}
                        </h4>
                        <div className="relative">
                            <CopyToClipboard text={SCRAPER_SYSTEM_PROMPT} className="absolute top-2 right-2 text-white/50 hover:text-white hover:bg-white/10" variant="icon" />
                            <pre className="bg-black/80 text-white p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                {SCRAPER_SYSTEM_PROMPT}
                            </pre>
                        </div>

                    </div>
                </div >
            )
        },
        {
            id: "command-palette",
            title: t('help.sections.commandPalette'),
            icon: Search,
            content: (
                <div className="space-y-6">
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.commandPalette.desc') }} />

                    <div className="flex items-center gap-4 bg-muted p-6 rounded-lg border border-border">
                        <div className="flex flex-col items-center gap-1 min-w-[100px]">
                            <span className="text-xs font-bold text-muted-foreground uppercase">{t('help.content.commandPalette.shortcut')}</span>
                            <div className="flex gap-1">
                                <kbd className="px-2 py-1.5 text-sm font-mono bg-background border border-border rounded shadow-sm text-foreground">Ctrl</kbd>
                                <span className="text-muted-foreground self-center">+</span>
                                <kbd className="px-2 py-1.5 text-sm font-mono bg-background border border-border rounded shadow-sm text-foreground">K</kbd>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">{t('help.content.commandPalette.whatCanDo')}</h4>
                            <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                                <li dangerouslySetInnerHTML={{ __html: t('help.content.commandPalette.li1') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('help.content.commandPalette.li2') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('help.content.commandPalette.li3') }} />
                                <li dangerouslySetInnerHTML={{ __html: t('help.content.commandPalette.li4') }} />
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: "visual-diff",
            title: t('help.sections.versionHistory'),
            icon: GitBranch,
            content: (
                <div className="space-y-6">
                    <p dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.desc') }} />

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.visualDiff.howToTitle')}</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>{t('help.content.visualDiff.li1')}</li>
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.li2') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.li3') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.li4') }} />
                        </ol>

                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-md">
                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                <RotateCcw size={16} /> {t('help.content.visualDiff.restoreTitle') || "Restoring Old Versions"}
                            </h4>
                            <p className="text-sm">
                                {t('help.content.visualDiff.restoreDesc') || "You can restore any previous version to become the new current version. Click the 'Restore' icon (circular arrow) next to a version in the history list. This creates a new version copy, preserving your history linear."}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <span className="text-green-600 dark:text-green-400 font-bold block mb-1">{t('help.content.visualDiff.greenTitle')}</span>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.greenDesc') }} />
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <span className="text-red-600 dark:text-red-400 font-bold block mb-1">{t('help.content.visualDiff.redTitle')}</span>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.content.visualDiff.redDesc') }} />
                        </div>
                    </div>

                    <div className="border border-l-4 border-l-purple-500 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-r shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-400 mb-1">
                            <Lightbulb size={18} /> {t('help.content.visualDiff.tipTitle')}
                        </div>
                        <p className="text-sm">{t('help.content.visualDiff.tipDesc')}</p>
                    </div>
                </div>
            )
        },
        {
            id: "language",
            title: t('help.sections.language'),
            icon: Globe,
            content: (
                <div className="space-y-4">
                    <p>{t('help.content.language.desc')}</p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                        <li dangerouslySetInnerHTML={{ __html: t('help.content.language.li1') }} />
                        <li dangerouslySetInnerHTML={{ __html: t('help.content.language.li2') }} />
                        <li>{t('help.content.language.li3')}</li>
                    </ol>
                    <div className="border border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-r shadow-sm mt-4">
                        <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-1">
                            <Lightbulb size={18} /> Tip
                        </div>
                        <p className="text-sm">{t('help.content.language.tip')}</p>
                    </div>
                </div>
            )
        },
        {
            id: "user-profile",
            title: t('help.sections.userProfile'),
            icon: User,
            content: (
                <div className="space-y-6">
                    <p>{t('help.content.userProfile.desc')}</p>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.userProfile.accessTitle')}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t('help.content.userProfile.accessDesc') }} />
                        <ul className="list-disc list-inside ml-2 space-y-2">
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.userProfile.li1') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('help.content.userProfile.li2') }} />
                        </ul>
                    </div>

                    <div className="p-4 bg-muted rounded-lg border border-border">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <Lock size={16} /> {t('help.content.userProfile.forgotTitle')}
                        </h4>
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: t('help.content.userProfile.forgotDesc') }} />
                    </div>
                </div>
            )
        },
        {
            id: "admin",
            title: t('help.sections.admin'),
            icon: ShieldCheck,
            content: (
                <div className="space-y-6">
                    <p>{t('help.content.admin.desc')}</p>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.admin.usersTitle')}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t('help.content.admin.usersDesc') }} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.admin.registrationTitle')}</h3>
                        <div className="border border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10 p-4 rounded-r shadow-sm">
                            <p dangerouslySetInnerHTML={{ __html: t('help.content.admin.registrationDesc') }} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.admin.visibilityTitle')}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t('help.content.admin.visibilityDesc') }} />
                    </div>
                </div>
            )
        },
        {
            id: "exporting",
            title: t('help.sections.exporting'),
            icon: FileDown,
            content: (
                <div className="space-y-6">
                    <p>{t('help.content.exporting.desc')}</p>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.exporting.markdownTitle')}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t('help.content.exporting.markdownDesc') }} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold">{t('help.content.exporting.jsonTitle')}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t('help.content.exporting.jsonDesc') }} />
                    </div>
                </div>
            )
        },
        {
            id: "faq",
            title: t('help.sections.faq'),
            icon: MessageSquare,
            content: (
                <div className="space-y-6 divide-y divide-border">
                    <div className="pt-4 first:pt-0">
                        <h4 className="font-bold mb-2">{t('help.content.faq.q1')}</h4>
                        <p className="text-sm text-muted-foreground">{t('help.content.faq.a1')}</p>
                    </div>
                    <div className="pt-4">
                        <h4 className="font-bold mb-2">{t('help.content.faq.q2')}</h4>
                        <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('help.content.faq.a2') }} />
                    </div>

                </div>
            )
        }
    ];

    // Scroll spy effect using IntersectionObserver
    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            const visibleSection = entries.find((entry) => entry.isIntersecting)?.target;
            if (visibleSection) {
                setActiveSection(visibleSection.id);
            }
        }, {
            root: null, // Use viewport (or nearest scrollable ancestor if we wanted, but viewport is usually fine for 'main' since main usually fills it)
            rootMargin: "0px 0px -50% 0px", // Trigger when section is halfway up
            threshold: 0
        });

        const sections = DOC_SECTIONS.map(s => document.getElementById(s.id));
        sections.forEach((section) => {
            if (section) observer.current?.observe(section);
        });

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [t]); // Re-run effect when translation changes

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveSection(id);
        }
    };

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar Navigation (Sticky) */}
            <aside className="w-64 hidden lg:block border-r border-border shrink-0 h-[calc(100vh-64px)] sticky top-0 overflow-y-auto p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Book size={24} /> {t('help.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">{t('help.subtitle')}</p>
                </div>

                <nav className="space-y-1">
                    {DOC_SECTIONS.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${activeSection === section.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <Icon size={16} />
                                {section.title}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-8 pt-8 border-t border-border">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">{t('help.externalLinks')}</h3>
                    <div className="space-y-2">
                        <a href="https://nextjs.org" target="_blank" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                            Next.js Docs
                        </a>
                        <a href="https://prisma.io" target="_blank" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                            Prisma Docs
                        </a>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto p-6 md:p-10 pb-32">
                <div className="lg:hidden mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-2 text-primary mb-2">
                        <Book size={28} /> {t('help.title')}
                    </h1>
                </div>

                <div className="space-y-16">
                    {DOC_SECTIONS.map((section) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                <section.icon className="text-primary h-8 w-8" />
                                <h2 className="text-2xl font-bold">{section.title}</h2>
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-foreground/90">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-20 p-8 bg-surface rounded-xl border border-border text-center">
                    <h3 className="text-lg font-bold mb-2">{t('help.stillQuestions')}</h3>
                    <p className="text-muted-foreground mb-4">{t('help.checkRepo')}</p>
                    <a href="https://github.com/jovd83/prompthive" target="_blank" className="btn btn-outline inline-flex gap-2">
                        <Anchor size={16} /> {t('help.visitRepo')}
                    </a>
                </div>
            </main>
        </div>
    );
}
