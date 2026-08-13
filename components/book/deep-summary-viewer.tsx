'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { Quote, Lightbulb, AlertTriangle, ArrowRight, Share2, BookOpen } from 'lucide-react';

interface PublishedSummary {
    article_title?: string;
    article_content?: string;
    key_takeaways?: string[];
    [key: string]: unknown;
}

interface DeepSummaryViewerProps {
    summary: unknown;
}

export function DeepSummaryViewer({ summary }: DeepSummaryViewerProps) {
    const parsedData = useMemo(() => {
        if (!summary) return null;

        // Handle case where summary is already a JSON object (from PocketBase)
        if (typeof summary === 'object') {
            // Validate it has expected fields roughly? Or just cast it.
            return summary as PublishedSummary;
        }

        if (typeof summary === 'string') {
            const trimmedSummary = summary.trim();
            if (trimmedSummary.startsWith('<')) {
                // Strategy 1: Strip tags, clean &nbsp; and find JSON boundaries
                let textOnly = summary.replace(/<[^>]+>/g, '');
                textOnly = textOnly.replace(/&nbsp;/g, ' ');

                const firstBrace = textOnly.indexOf('{');
                const lastBrace = textOnly.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    textOnly = textOnly.substring(firstBrace, lastBrace + 1);
                }

                try {
                    return JSON.parse(textOnly) as PublishedSummary;
                } catch (e2) {
                    // Strategy 2: Fix "Double Double Quotes" artifact (e.g. ""Quote"")
                    try {
                        const fixedQuotes = textOnly.replace(/""/g, '"');
                        return JSON.parse(fixedQuotes) as PublishedSummary;
                    } catch (e3) {
                        // Strategy 3: Fix "&quot;" artifact if it wasn't decoded
                        try {
                            const fixedContent = textOnly.replace(
                                /("article_content"\s*:\s*")([\s\S]*?)("\s*,\s*"key_takeaways")/g,
                                (match, prefix, content, suffix) => {
                                    const escapedContent = content.replace(/"/g, '\\"');
                                    return prefix + escapedContent + suffix;
                                }
                            );
                            const fixedContent2 = fixedContent.replace(/""/g, '"');
                            return JSON.parse(fixedContent2) as PublishedSummary;
                        } catch (e5) {
                            console.warn("Failed to recover JSON via schema-aware fix", e5);
                        }
                    }
                }
            }
            // If string but doesn't start with <, it falls through to null -> rendered as markdown
        }

        return null;
    }, [summary]);

    // FALLBACK: If not valid JSON, render as standard Markdown (Legacy)
    if (!parsedData) {
        return (
            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{summary}</ReactMarkdown>
            </div>
        );
    }

    // NEW UI: Render Structured Data
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* SEO Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Article",
                        "headline": parsedData.article_title,
                        "articleBody": parsedData.article_content,
                        "keywords": parsedData?.key_takeaways?.join?.(", ") || "",
                    }),
                }}
            />

            {/* 1. Header & Title */}
            <div className="space-y-2 text-left pb-0">
                {/* genre_type hidden per user request */}
                <h1 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {parsedData.article_title || "Deep Read"}
                </h1>
            </div>

            {/* 2. TL;DR Card (In a Nutshell) */}
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-6 md:p-8">
                <h3 className="flex items-center text-lg font-bold text-amber-900 dark:text-amber-100 mb-4 font-serif">
                    <Lightbulb className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
                    In a Nutshell
                </h3>
                <ul className="space-y-3">
                    {(parsedData.key_takeaways || []).map((point, idx) => (
                        <li key={idx} className="flex items-start text-amber-900/80 dark:text-amber-100/80 leading-relaxed">
                            <span className="mr-3 font-semibold text-amber-500/80 select-none">•</span>
                            {point}
                        </li>
                    ))}
                </ul>
            </div>

            {/* 3. Main Article Content with Injected Quotes */}
            <ArticleContentWithQuotes
                content={parsedData.article_content || ""}
                quotes={parsedData.best_quotes || []}
            />

            {/* 4. Actionable Advice (What Now?) */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
                <h3 className="flex items-center text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 font-serif">
                    <ArrowRight className="w-5 h-5 mr-2 text-primary" />
                    What Now?
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {(parsedData.actionable_advice || []).map((advice, idx) => (
                        <div key={idx} className="flex items-start p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mr-3 mt-1">
                                {idx + 1}
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{advice}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Controversial Points (Discussion Trigger) */}
            {parsedData.controversial_points && parsedData.controversial_points.length > 0 && (
                <div className="mt-6 pt-0">
                    <h3 className="flex items-center text-lg font-bold text-red-600 dark:text-red-400 mb-4">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Up for Debate
                    </h3>
                    <div className="space-y-4">
                        {parsedData.controversial_points.map((point, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-zinc-800 dark:text-zinc-200 italic">
                                "{point}"
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Published summary content viewer
function ArticleContentWithQuotes({ content = "", quotes = [] }: { content: string, quotes: string[] }) {
    // Split content by paragraphs or headings to inject quotes logically
    // Simple strategy: Inject a quote roughly every 3-4 paragraphs (approx 800 words visually)

    // Convert newlines to processable chunks. 
    // We will render markdown normally, but we split the raw markdown string and interleave Quote components.
    // This is a bit tricky with ReactMarkdown. 
    // A safer simpler approach for MVP: Render quotes in fixed positions or sidebars using CSS Grid?
    // User requested: "When article roughly passes 1000 words, insert Blockquote".

    // Implementation: Split text by double newline (paragraphs). Reassemble into chunks.
    const paragraphs = content.split(/\n\n+/);
    const chunks: React.ReactNode[] = [];
    let quoteIndex = 0;
    let currentChunk: string[] = [];

    // Heuristic: Insert quote every 6 paragraphs
    const PARAGRAPHS_PER_QUOTE = 6;

    paragraphs.forEach((para, idx) => {
        currentChunk.push(para);

        if ((idx + 1) % PARAGRAPHS_PER_QUOTE === 0 && quoteIndex < quotes.length) {
            // Push current chunk
            chunks.push(
                <div key={`chunk-${idx}`} className="prose prose-zinc dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 prose-headings:font-serif prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-p:my-4 prose-headings:mt-8 prose-headings:mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentChunk.join("\n\n")}</ReactMarkdown>
                </div>
            );
            currentChunk = [];

            // Push Quote
            const quote = quotes[quoteIndex];
            chunks.push(
                <blockquote key={`quote-${quoteIndex}`} className="my-8 px-6 py-4 border-l-4 border-primary bg-zinc-50/50 dark:bg-zinc-900/50 rounded-r-lg italic text-lg font-serif text-zinc-800 dark:text-zinc-200 relative">
                    <Quote className="absolute top-4 left-2 w-4 h-4 text-zinc-300 dark:text-zinc-700 -z-10 opacity-50" />
                    "{quote}"
                </blockquote>
            );
            quoteIndex++;
        }
    });

    // Push remaining chunk
    if (currentChunk.length > 0) {
        chunks.push(
            <div key={`chunk-final`} className="prose prose-zinc dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 prose-headings:font-serif prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-p:my-4 prose-headings:mt-8 prose-headings:mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentChunk.join("\n\n")}</ReactMarkdown>
            </div>
        );
    }

    return <div>{chunks}</div>;
}
