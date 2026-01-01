'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note, type Tag } from './schema';
import { nanoid } from 'nanoid';

export function useNotes() {
  const notes = useLiveQuery(
    () =>
      db.notes
        .filter((note) => !note.trashedAt)
        .reverse()
        .sortBy('updatedAt'),
    []
  );

  return notes ?? [];
}

export function usePinnedNotes() {
  const notes = useLiveQuery(
    () =>
      db.notes
        .filter((note) => note.isPinned && !note.trashedAt)
        .reverse()
        .sortBy('updatedAt'),
    []
  );

  return notes ?? [];
}

export function useNote(id: string | undefined) {
  const note = useLiveQuery(() => (id ? db.notes.get(id) : undefined), [id]);

  return note;
}

export function useTags() {
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  return tags ?? [];
}

export async function createNote(initialContent?: string): Promise<string> {
  const id = nanoid();
  const now = new Date();

  await db.notes.add({
    id,
    title: 'Untitled',
    content: initialContent ?? JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    plainText: '',
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    tags: [],
  });

  return id;
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, 'title' | 'content' | 'plainText' | 'isPinned' | 'tags'>>
) {
  await db.notes.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteNote(id: string) {
  await db.notes.update(id, {
    trashedAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function restoreNote(id: string) {
  await db.notes.update(id, {
    trashedAt: undefined,
    updatedAt: new Date(),
  });
}

export async function permanentlyDeleteNote(id: string) {
  await db.notes.delete(id);
}

export async function createTag(name: string, color: string): Promise<string> {
  const id = nanoid();

  await db.tags.add({
    id,
    name,
    color,
    createdAt: new Date(),
  });

  return id;
}

export async function deleteTag(id: string) {
  await db.tags.delete(id);
}

export async function searchNotes(query: string): Promise<Note[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const notes = await db.notes
    .filter(
      (note) =>
        !note.trashedAt &&
        (note.title.toLowerCase().includes(lowerQuery) ||
          note.plainText.toLowerCase().includes(lowerQuery))
    )
    .toArray();

  return notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
