'use client';

import { db, type Note } from '@/lib/db/schema';
import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface SearchResult {
  note: Note;
  score: number;
  matchType: 'semantic' | 'keyword' | 'both';
}

export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Get all notes that aren't trashed
  const notes = await db.notes.filter((note) => !note.trashedAt).toArray();

  if (notes.length === 0) {
    return [];
  }

  // If we don't have embeddings yet, fall back to keyword search
  const notesWithEmbeddings = notes.filter(
    (n) => n.embedding && n.embedding.length > 0
  );

  if (notesWithEmbeddings.length === 0 || queryEmbedding.length === 0) {
    // Fall back to keyword search
    return keywordSearch(query, notes, limit);
  }

  // Calculate similarity scores
  const results: SearchResult[] = notesWithEmbeddings.map((note) => ({
    note,
    score: cosineSimilarity(queryEmbedding, note.embedding!),
    matchType: 'semantic' as const,
  }));

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Also do keyword search and merge results
  const keywordResults = keywordSearch(query, notes, limit);

  // Merge results, preferring semantic matches but boosting if both match
  const mergedResults = mergeSearchResults(results, keywordResults);

  return mergedResults.slice(0, limit);
}

function keywordSearch(
  query: string,
  notes: Note[],
  limit: number
): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);

  const results: SearchResult[] = notes
    .map((note) => {
      const titleLower = note.title.toLowerCase();
      const textLower = note.plainText.toLowerCase();

      let score = 0;

      // Exact phrase match in title (highest score)
      if (titleLower.includes(lowerQuery)) {
        score += 1.0;
      }

      // Exact phrase match in content
      if (textLower.includes(lowerQuery)) {
        score += 0.5;
      }

      // Individual word matches
      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          score += 0.3;
        }
        if (textLower.includes(word)) {
          score += 0.1;
        }
      }

      return {
        note,
        score,
        matchType: 'keyword' as const,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

function mergeSearchResults(
  semantic: SearchResult[],
  keyword: SearchResult[]
): SearchResult[] {
  const resultMap = new Map<string, SearchResult>();

  // Add semantic results
  for (const result of semantic) {
    resultMap.set(result.note.id, result);
  }

  // Merge keyword results
  for (const result of keyword) {
    const existing = resultMap.get(result.note.id);
    if (existing) {
      // Boost score if both semantic and keyword match
      existing.score = existing.score * 0.7 + result.score * 0.3;
      existing.matchType = 'both';
    } else {
      // Add keyword-only results with lower base score
      result.score = result.score * 0.5;
      resultMap.set(result.note.id, result);
    }
  }

  // Convert to array and sort
  return Array.from(resultMap.values()).sort((a, b) => b.score - a.score);
}

export async function updateNoteEmbedding(noteId: string): Promise<void> {
  const note = await db.notes.get(noteId);
  if (!note) return;

  const textToEmbed = `${note.title}\n\n${note.plainText}`.trim();
  if (!textToEmbed) return;

  try {
    const embedding = await generateEmbedding(textToEmbed);
    if (embedding.length > 0) {
      await db.notes.update(noteId, { embedding });
    }
  } catch (error) {
    console.error('Error updating note embedding:', error);
  }
}

export async function generateAllEmbeddings(): Promise<number> {
  const notes = await db.notes
    .filter((note) => !note.trashedAt && (!note.embedding || note.embedding.length === 0))
    .toArray();

  let count = 0;
  for (const note of notes) {
    await updateNoteEmbedding(note.id);
    count++;
  }

  return count;
}
