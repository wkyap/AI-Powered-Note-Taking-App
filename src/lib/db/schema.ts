import Dexie, { type Table } from 'dexie';

export interface Note {
  id: string;
  title: string;
  content: string; // Tiptap JSON stringified
  plainText: string; // For keyword search
  createdAt: Date;
  updatedAt: Date;
  trashedAt?: Date;
  isPinned: boolean;
  tags: string[];
  embedding?: number[]; // For semantic search
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface Settings {
  key: string;
  value: string;
}

export class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  tags!: Table<Tag>;
  settings!: Table<Settings>;

  constructor() {
    super('NoteTakingApp');

    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt, trashedAt, isPinned, *tags',
      tags: 'id, name',
      settings: 'key',
    });
  }
}

export const db = new NotesDatabase();
