'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search, Settings, Sparkles } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/ui-store';
import { useNotes, createNote, searchNotes } from '@/lib/db/hooks';
import type { Note } from '@/lib/db/schema';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleAIPanel } = useUIStore();
  const notes = useNotes();
  const [search, setSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Note[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  React.useEffect(() => {
    if (search.trim()) {
      searchNotes(search).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const handleNewNote = async () => {
    const id = await createNote();
    setCommandPaletteOpen(false);
    router.push(`/notes/${id}`);
  };

  const handleOpenNote = (id: string) => {
    setCommandPaletteOpen(false);
    router.push(`/notes/${id}`);
  };

  const handleOpenSettings = () => {
    setCommandPaletteOpen(false);
    router.push('/settings');
  };

  const handleOpenAI = () => {
    setCommandPaletteOpen(false);
    toggleAIPanel();
  };

  const displayNotes = search.trim() ? searchResults : notes.slice(0, 5);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search notes or type a command..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleNewNote}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </CommandItem>
          <CommandItem onSelect={handleOpenAI}>
            <Sparkles className="mr-2 h-4 w-4" />
            Open AI Assistant
          </CommandItem>
          <CommandItem onSelect={handleOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        {displayNotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={search.trim() ? 'Search Results' : 'Recent Notes'}>
              {displayNotes.map((note) => (
                <CommandItem key={note.id} onSelect={() => handleOpenNote(note.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {note.title || 'Untitled'}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
