'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Copy, Wand2, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SmartJsonInputProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
    textareaClassName?: string;
    placeholder?: string;
}

export function SmartJsonInput({ value, onChange, disabled, className, textareaClassName, placeholder }: SmartJsonInputProps) {
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Validate on value change
    useEffect(() => {
        if (!value) {
            setError(null);
            setIsValid(true);
            return;
        }

        try {
            JSON.parse(value);
            setError(null);
            setIsValid(true);
        } catch (e: any) {
            setError(e.message);
            setIsValid(false);
        }
    }, [value]);

    const handlePrettify = () => {
        try {
            const parsed = JSON.parse(value);
            const formatted = JSON.stringify(parsed, null, 2);
            onChange(formatted);
            toast.success("JSON Formatted");
        } catch (e) {
            toast.error("Invalid JSON, cannot format");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        toast.success("Copied to clipboard");
    };

    const handleAutoFix = () => {
        if (!value) return;

        // Attempt 1: Standard Parse
        try {
            const parsed = JSON.parse(value);
            onChange(JSON.stringify(parsed, null, 2));
            toast.success("Already valid JSON, formatted.");
            return;
        } catch (e) {
            // Continue to repair
        }

        let fixed = value;

        // Strategy 1: Remove HTML tags
        fixed = fixed.replace(/<[^>]+>/g, '');
        fixed = fixed.replace(/&nbsp;/g, ' ');

        // Strategy 2: Remove artifacts before/after JSON
        const firstBrace = fixed.indexOf('{');
        const lastBrace = fixed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            fixed = fixed.substring(firstBrace, lastBrace + 1);
        }

        // Strategy 3: Fix Quotes
        // Replace full-width quotes with half-width
        fixed = fixed.replace(/[“”]/g, '"');

        // Fix Double Quotes artifact (""key"") -> ("key")
        fixed = fixed.replace(/""/g, '"');

        // Try to parse again
        try {
            const parsed = JSON.parse(fixed);
            onChange(JSON.stringify(parsed, null, 2));
            toast.success("JSON Auto-repaired & Formatted!");
        } catch (e: any) {
            // Second Pass: Fix unescaped quotes within values
            // This is risky but useful for common LLM errors
            // Regex looks for "key": "value" pattern, and tries to identify broken internal quotes
            // Simple fallback: Just notify user of partial fix
            onChange(fixed);
            toast.warning("Auto-repair applied but still invalid. Please check syntax manually.");
        }
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-t-md border border-b-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">JSON Editor</span>
                    {error ? (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Invalid Syntax
                        </span>
                    ) : (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Valid
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={handlePrettify}
                        disabled={disabled || !isValid}
                        title="Format JSON"
                    >
                        <AlignLeft className="w-3 h-3" /> Format
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={handleAutoFix}
                        disabled={disabled}
                        title="Auto Fix Common Errors"
                    >
                        <Wand2 className="w-3 h-3 text-purple-500" /> Auto Fix
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleCopy}
                        title="Copy"
                    >
                        <Copy className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className={cn(
                        "flex min-h-[300px] w-full rounded-b-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono",
                        error && "border-red-500 focus-visible:ring-red-500",
                        textareaClassName
                    )}
                    placeholder={placeholder || "{ ... }"}
                    spellCheck={false}
                />
                {error && (
                    <div className="absolute bottom-2 left-2 right-2 bg-red-50 text-red-600 text-xs p-2 rounded border border-red-200 opacity-90 truncate pointer-events-none">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
}
