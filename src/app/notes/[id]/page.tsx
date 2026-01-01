'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Pin, PinOff, Trash2, MoreHorizontal } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Editor } from '@/components/editor/Editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNote, updateNote, deleteNote } from '@/lib/db/hooks';
import { toast } from 'sonner';
import type { JSONContent } from '@tiptap/react';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const note = useNote(noteId);
  const [title, setTitle] = React.useState('');
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize title from note
  React.useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [note?.id]); // Only update when note ID changes

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  const handleEditorUpdate = (content: JSONContent, plainText: string) => {
    debouncedSave({
      content: JSON.stringify(content),
      plainText,
    });
  };

  const debouncedSave = (updates: Parameters<typeof updateNote>[1]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(noteId, updates);
    }, 500);
  };

  const handleTogglePin = async () => {
    if (!note) return;
    await updateNote(noteId, { isPinned: !note.isPinned });
    toast.success(note.isPinned ? 'Unpinned note' : 'Pinned note');
  };

  const handleDelete = async () => {
    await deleteNote(noteId);
    toast.success('Moved to trash');
    router.push('/');
  };

  if (!note) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  const content = note.content ? JSON.parse(note.content) : null;

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleTogglePin}
            >
              {note.isPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ThemeToggle />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl">
            {/* Title */}
            <div className="px-8 pt-8">
              <Input
                value={title}
                onChange={handleTitleChange}
                placeholder="Untitled"
                className="border-none bg-transparent text-3xl font-bold placeholder:text-muted-foreground/50 focus-visible:ring-0"
              />
            </div>

            {/* Editor */}
            <Editor content={content} onUpdate={handleEditorUpdate} />
          </div>
        </div>
      </main>

      <CommandPalette />
      <AIChatPanel noteContent={note.plainText} noteTitle={note.title} />
    </div>
  );
}
