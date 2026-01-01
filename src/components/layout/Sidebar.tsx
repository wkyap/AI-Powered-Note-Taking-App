'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  Pin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/ui-store';
import { useNotes, usePinnedNotes, createNote } from '@/lib/db/hooks';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setCommandPaletteOpen, toggleAIPanel } = useUIStore();
  const notes = useNotes();
  const pinnedNotes = usePinnedNotes();

  const handleNewNote = async () => {
    const id = await createNote();
    router.push(`/notes/${id}`);
  };

  const currentNoteId = pathname?.startsWith('/notes/') ? pathname.split('/')[2] : null;

  if (!sidebarOpen) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r bg-sidebar py-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mb-3">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleNewNote}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setCommandPaletteOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleAIPanel}>
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h1 className="text-sm font-semibold">Notes</h1>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7">
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-1 p-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={handleNewNote}>
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleAIPanel}>
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="mb-4">
              <div className="mb-1 flex items-center gap-1 px-2 text-xs font-medium text-muted-foreground">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
              {pinnedNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isActive={note.id === currentNoteId}
                  onClick={() => router.push(`/notes/${note.id}`)}
                />
              ))}
            </div>
          )}

          {/* All Notes */}
          <div>
            <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">All Notes</div>
            {notes.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                No notes yet. Create one!
              </p>
            ) : (
              notes
                .filter((n) => !n.isPinned)
                .map((note) => (
                  <NoteItem
                    key={note.id}
                    note={note}
                    isActive={note.id === currentNoteId}
                    onClick={() => router.push(`/notes/${note.id}`)}
                  />
                ))
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator />
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => router.push('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}

function NoteItem({
  note,
  isActive,
  onClick,
}: {
  note: { id: string; title: string; updatedAt: Date };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent',
        isActive && 'bg-accent'
      )}
    >
      <div className="flex w-full items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{note.title || 'Untitled'}</span>
      </div>
      <span className="ml-6 text-xs text-muted-foreground">
        {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
      </span>
    </button>
  );
}
