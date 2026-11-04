const pendingKey = 'kotoba.notebook.pending.v1';

function readDraft() {
  try { return JSON.parse(sessionStorage.getItem(pendingKey)); }
  catch { return null; }
}

function storeDraft(draft) {
  try {
    if (draft) sessionStorage.setItem(pendingKey, JSON.stringify(draft));
    else sessionStorage.removeItem(pendingKey);
  } catch {
    // The current draft also remains in memory and the browser mirror.
  }
}

async function requestNotebook(payload) {
  const response = await fetch('/api/notebook', {
    signal: AbortSignal.timeout(4000),
    cache: 'no-store',
    ...(payload ? {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    } : {}),
  });
  return { status: response.status, value: await response.json() };
}

const sameNotebook = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function connectNotebook({ saved, enabled, onStatus }) {
  if (!enabled) return { saved, status: 'local', save() {}, retry() {} };

  let revision = null;
  let pending = readDraft();
  let initial = pending?.notebook ?? saved;
  let status = 'offline';
  let sending = false;

  function setStatus(next) {
    status = next;
    onStatus(next);
  }

  function reconcile(current) {
    revision = current.revision;
    if (!pending) return true;
    if (sameNotebook(current.notebook, pending.notebook)) {
      pending = null;
      storeDraft(null);
      return true;
    }
    if (pending.revision !== revision && current.notebook !== null) return false;
    pending.revision = revision;
    storeDraft(pending);
    return true;
  }

  try {
    const result = await requestNotebook();
    if (result.status !== 200) throw new Error();
    if (reconcile(result.value)) {
      initial = pending?.notebook ?? result.value.notebook ?? saved;
      status = result.value.notebook === null ? 'ready' : 'server';
    } else status = 'conflict';
  } catch {
    // Preserve the browser copy when starting without the local server.
  }

  async function flush() {
    if (sending || !pending || status === 'conflict') return;
    sending = true;
    setStatus('saving');
    try {
      if (revision === null) {
        const result = await requestNotebook();
        if (result.status !== 200) throw new Error();
        if (!reconcile(result.value)) {
          setStatus('conflict');
          return;
        }
      }
      while (pending) {
        const sent = pending;
        const { status: code, value } = await requestNotebook({ revision, notebook: sent.notebook });
        if (code === 409 && !sameNotebook(value.notebook, sent.notebook)) {
          setStatus('conflict');
          return;
        }
        if (code !== 200 && code !== 409) {
          setStatus(code >= 500 ? 'offline' : 'rejected');
          return;
        }
        revision = value.revision;
        pending = pending === sent ? null : { revision, notebook: pending.notebook };
        storeDraft(pending);
      }
      setStatus('server');
    } catch {
      setStatus('offline');
    } finally {
      sending = false;
    }
  }

  return {
    saved: initial,
    get status() { return status; },
    needsMigration: revision === 0 && !pending && Array.isArray(saved.words),
    save(notebook) {
      pending = { revision: pending ? pending.revision : revision, notebook };
      storeDraft(pending);
      void flush();
    },
    retry: flush,
    draft: () => pending?.notebook,
    useServer() { storeDraft(null); },
  };
}
