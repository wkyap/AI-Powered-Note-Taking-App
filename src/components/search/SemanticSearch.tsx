'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Sparkles, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { semanticSearch, type SearchResult } from '@/lib/search/semantic';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SemanticSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SemanticSearch({ open, onOpenChange }: SemanticSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await semanticSearch(query, 10);
        setResults(searchResults);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (noteId: string) => {
    onOpenChange(false);
    router.push(`/notes/${noteId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Semantic Search
          </DialogTitle>
        </DialogHeader>

        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by meaning... (e.g., 'notes about project planning')"
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Semantic search finds notes by meaning, not just keywords. Try describing what you&apos;re looking for.
          </p>
        </div>

        <ScrollArea className="max-h-[400px]">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.note.id}
                  onClick={() => handleSelect(result.note.id)}
                  className="flex w-full flex-col gap-1 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{result.note.title || 'Untitled'}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'ml-auto text-xs',
                        result.matchType === 'semantic' && 'bg-primary/10 text-primary',
                        result.matchType === 'both' && 'bg-green-500/10 text-green-600'
                      )}
                    >
                      {result.matchType === 'semantic' && 'Semantic'}
                      {result.matchType === 'keyword' && 'Keyword'}
                      {result.matchType === 'both' && 'Best Match'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {result.note.plainText.slice(0, 150)}
                    {result.note.plainText.length > 150 && '...'}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(result.note.updatedAt, { addSuffix: true })}
                  </span>
                </button>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notes found matching your query</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try different keywords or phrases
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Start typing to search your notes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Powered by AI embeddings for better results
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
