import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown'; // Import markdown language for highlighting
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme for PrismJS (adjustable)
import Editor from 'react-simple-code-editor';

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string; // Wrapper className (e.g. for height)
    name?: string;
    minHeight?: string;
}

const EDITOR_FONT_FAMILY = '"Fira code", "Fira Mono", monospace';
const EDITOR_FONT_SIZE = 14;
const EDITOR_LINE_HEIGHT = 21;
const EDITOR_PADDING = 15;

export default function CodeEditor({ value, onChange, placeholder, className, name, minHeight = "120px" }: CodeEditorProps) {
    // Ensure we have a string to split, even if value is null/undefined initially
    const safeValue = value || "";
    const lineCount = safeValue.split('\n').length;

    return (
        <div
            className={`relative border rounded-lg bg-[#2d2d2d] flex flex-col overflow-hidden ${className || ''}`}
            // Apply minHeight to the container if passed in className or style
            style={{
                minHeight: minHeight,
                // Ensure the container has a defined height context if parent expects it, 
                // typically the user passes a height class or style.
            }}
        >
            {/* Hidden input for form submission if name is provided */}
            {name && <input type="hidden" name={name} value={safeValue} />}

            <div className="flex-1 overflow-auto flex relative items-stretch">
                {/* Sidebar (Line Numbers) */}
                <div
                    className="flex-none text-right bg-[#1e1e1e] text-gray-500 select-none border-r border-gray-700 z-10 sticky left-0"
                    style={{
                        paddingTop: `${EDITOR_PADDING}px`,
                        paddingBottom: `${EDITOR_PADDING}px`,
                        paddingRight: '10px',
                        paddingLeft: '10px',
                        fontFamily: EDITOR_FONT_FAMILY,
                        fontSize: `${EDITOR_FONT_SIZE}px`,
                        lineHeight: `${EDITOR_LINE_HEIGHT}px`,
                        minWidth: '40px',
                        height: 'fit-content', // Allow it to shrink if needed, but min-h-full on parent handles it?
                        minHeight: '100%' // Ensure it stretches full height of scroll content
                    }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i} style={{ height: `${EDITOR_LINE_HEIGHT}px` }}>{i + 1}</div>
                    ))}
                </div>

                {/* Editor Area */}
                <div className="flex-1 min-h-full relative overflow-visible">
                    <Editor
                        value={safeValue}
                        onValueChange={onChange}
                        highlight={code => highlight(code, languages.markdown, 'markdown')}
                        padding={EDITOR_PADDING}
                        placeholder={placeholder}
                        style={{
                            fontFamily: EDITOR_FONT_FAMILY,
                            fontSize: EDITOR_FONT_SIZE,
                            lineHeight: `${EDITOR_LINE_HEIGHT}px`,
                            backgroundColor: 'transparent',
                            color: '#f8f8f2',
                            minHeight: '100%', // Ensure it stretches
                            whiteSpace: 'pre', // Disable wrapping to keep lines 1-to-1
                            overflow: 'hidden', // Let parent handle scroll
                        }}
                        className="font-mono"
                        textareaClassName="focus:outline-none"
                    />
                </div>
            </div>

            <div className="absolute top-2 right-4 text-xs text-white/20 select-none pointer-events-none z-20 bg-[#2d2d2d]/50 backdrop-blur-sm px-1 rounded">
                Markdown
            </div>
        </div>
    );
}
