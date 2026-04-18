import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeRenderProps {
    html: string;
}

/**
 * A safe alternative to dangerouslySetInnerHTML.
 * Uses DOMPurify to sanitize HTML and then parses a subset of safe tags
 * into React components.
 */
export const SafeRender: React.FC<SafeRenderProps> = ({ html }) => {
    const [nodes, setNodes] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        if (!html) {
            setNodes([]);
            return;
        }

        // 1. Sanitize with DOMPurify first
        const cleanHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['strong', 'em', 'code', 'br', 'span', 'a', 'b', 'i'],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
        });

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<body>${cleanHtml}</body>`, 'text/html');

        const mapNode = (node: Node, index: number): React.ReactNode => {
            const key = `node-${index}`;

            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();
                const children = Array.from(el.childNodes).map((child, i) => mapNode(child, i));

                switch (tagName) {
                    case 'strong':
                    case 'b':
                        return <strong key={key} className="font-bold">{children}</strong>;
                    case 'em':
                    case 'i':
                        return <em key={key} className="italic">{children}</em>;
                    case 'code':
                        return <code key={key} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border">{children}</code>;
                    case 'br':
                        return <br key={key} />;
                    case 'span':
                        // Only preserve a few relevant classes from translation hints
                        const className = el.className;
                        return <span key={key} className={className}>{children}</span>;
                    case 'a':
                        const href = el.getAttribute('href') || '#';
                        return (
                            <a
                                key={key}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-primary transition-colors"
                            >
                                {children}
                            </a>
                        );
                    default:
                        // For unsupported tags, we just render the children to avoid breaking the text flow
                        return <React.Fragment key={key}>{children}</React.Fragment>;
                }
            }

            return null;
        };

        const result = Array.from(doc.body.childNodes).map((node, i) => mapNode(node, i));
        setNodes(result);
    }, [html]);

    // Initial server render will be empty to avoid hydration mismatch
    // (since DOMParser is browser-only)
    if (nodes.length === 0 && html) {
        // Fallback: strip tags for initial render to avoid visual jump or XSS
        return <span>{html.replace(/<\/?[^>]+(>|$)/g, "")}</span>;
    }

    return <>{nodes}</>;
};
