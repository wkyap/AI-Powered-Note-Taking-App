'use client';

import * as React from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './EditorToolbar';
import { SlashCommand } from './SlashCommand';

const lowlight = createLowlight(common);

interface EditorProps {
  content: JSONContent | null;
  onUpdate: (content: JSONContent, plainText: string) => void;
  editable?: boolean;
}

export function Editor({ content, onUpdate, editable = true }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading';
          }
          return "Type '/' for commands...";
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      SlashCommand,
    ],
    content: content ?? undefined,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = editor.getText();
      onUpdate(json, text);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-headings:my-4 max-w-none focus:outline-none min-h-[500px] px-8 py-4',
      },
    },
  });

  // Update content when it changes externally
  React.useEffect(() => {
    if (editor && content && !editor.isFocused) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
