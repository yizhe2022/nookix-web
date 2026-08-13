'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'

interface MinimalEditorProps {
    value: string
    onChange: (html: string) => void
    disabled?: boolean
}

export function MinimalEditor({ value, onChange, disabled }: MinimalEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }: { editor: Editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none dark:prose-invert',
            },
        },
    })

    // Sync editor content with external value updates (e.g. AI regeneration)
    useEffect(() => {
        if (editor && value) {
            const currentContent = editor.getHTML();

            // Heuristic to check if value seems to be Markdown (from AI) vs HTML (from Editor/DB)
            // If it starts with typical markdown chars or lacks HTML tags, parse it.
            // But we must be careful: if value comes from onChange (which is HTML), we shouldn't re-parse it as MD.
            // Since onChange updates simple state which passes back 'value', 'value' IS HTML usually.
            // PROBABLE ISSUE: The AI returns raw text. 'value' becomes raw text.
            // So we check if it looks like HTML.

            const contentToSet = isHtml(value) ? value : simpleMarkdownToHtml(value);

            // Only update if significantly different to avoid loops/cursor jumps
            if (currentContent !== contentToSet && editor.getHTML() !== contentToSet) {
                editor.commands.setContent(contentToSet);
            }
        }
    }, [value, editor]);

    if (!editor) {
        return null
    }

    return (
        <div className="border rounded-md">
            <div className="flex items-center gap-1 p-1 border-b bg-muted/20">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={disabled}
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={disabled}
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('blockquote')}
                    onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                    disabled={disabled}
                >
                    <Quote className="h-4 w-4" />
                </Toggle>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().undo().run()}
                    disabled={disabled || !editor.can().undo()}
                >
                    <Undo className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    onPressedChange={() => editor.chain().focus().redo().run()}
                    disabled={disabled || !editor.can().redo()}
                >
                    <Redo className="h-4 w-4" />
                </Toggle>
            </div>
            <EditorContent editor={editor} className="p-2" />
        </div>
    )
}

// Helpers for basic Markdown to HTML conversion (since we don't have 'marked')
function isHtml(text: string) {
    return /^\s*<[a-z][\s\S]*>/i.test(text);
}

function simpleMarkdownToHtml(markdown: string): string {
    if (!markdown) return '';
    if (typeof markdown !== 'string') return '';
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (inList) { html += '</ul>'; inList = false; }
            continue;
        }

        // Headers
        if (line.startsWith('#### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h4>${parseInline(line.substring(5))}</h4>`;
        } else if (line.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3>${parseInline(line.substring(4))}</h3>`;
        } else if (line.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h2>${parseInline(line.substring(3))}</h2>`;
        }
        // Lists
        else if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${parseInline(line.substring(2))}</li>`;
        }
        // Paragraphs
        else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${parseInline(line)}</p>`;
        }
    }
    if (inList) { html += '</ul>'; }
    return html;
}

function parseInline(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
}
