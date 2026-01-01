'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useNotes, createNote } from '@/lib/db/hooks';
import { FileText, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const notes = useNotes();

  const handleNewNote = async () => {
    const id = await createNote();
    router.push(`/notes/${id}`);
  };

  // Redirect to first note if exists
  useEffect(() => {
    if (notes.length > 0) {
      router.push(`/notes/${notes[0].id}`);
    }
  }, [notes, router]);

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-2">
          <div />
          <ThemeToggle />
        </header>

        {/* Empty State */}
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-muted p-6">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Welcome to Notes</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              A beautiful, minimal note-taking app powered by AI. Create your first note to get started.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleNewNote} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Note
              </Button>
            </div>

            <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Rich Editor"
                description="Notion-like block editor with slash commands"
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title="AI Assistant"
                description="Get help writing, summarizing, and brainstorming"
              />
              <FeatureCard
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                title="Smart Search"
                description="Find notes by meaning, not just keywords"
              />
            </div>
          </div>
        </div>
      </main>

      <CommandPalette />
      <AIChatPanel />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="mb-1 font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
