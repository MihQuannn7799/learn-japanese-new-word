import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Notebook, NotebookEnvelope } from '../shared/notebook.ts';

export interface NotebookDatabase {
  read: () => NotebookEnvelope;
  write: (revision: number, notebook: Notebook) => boolean;
  close: () => void;
}

export function openNotebookDatabase(filename: string): NotebookDatabase {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA busy_timeout = 3000;
    CREATE TABLE IF NOT EXISTS notebook (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      revision INTEGER NOT NULL,
      payload TEXT NOT NULL
    );`);
  const select = db.prepare('SELECT revision, payload FROM notebook WHERE id = 1');
  const insert = db.prepare('INSERT INTO notebook (id, revision, payload) VALUES (1, 1, ?) ON CONFLICT DO NOTHING');
  const update = db.prepare('UPDATE notebook SET revision = revision + 1, payload = ? WHERE id = 1 AND revision = ?');

  return {
    read() {
      const row = select.get() as { revision: number; payload: string } | undefined;
      return row ? { revision: row.revision, notebook: JSON.parse(row.payload) } : { revision: 0, notebook: null };
    },
    write(revision: number, notebook: Notebook) {
      const payload = JSON.stringify(notebook);
      const result = revision === 0 ? insert.run(payload) : update.run(payload, revision);
      return result.changes === 1;
    },
    close: () => db.close(),
  };
}
