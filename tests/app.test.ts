import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.js';

describe('document access control', () => {
  let database: DatabaseSync;
  afterEach(() => database?.close());
  it('only allows shared users to read a document', async () => {
    database = new DatabaseSync(':memory:');
    database.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE); CREATE TABLE documents (id INTEGER PRIMARY KEY, title TEXT, content TEXT, owner_id INTEGER, updated_at TEXT); CREATE TABLE shares (document_id INTEGER, user_id INTEGER, PRIMARY KEY (document_id, user_id));');
    database.exec("INSERT INTO users VALUES (1, 'Maya', 'maya@example.com'), (2, 'Theo', 'theo@example.com'), (3, 'Unauthorised', 'una@example.com'); INSERT INTO documents VALUES (1, 'Private', '{\"type\":\"doc\"}', 1, datetime('now'));");
    const app = createApp(database);
    const server = app.listen(0);
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}`;
    const privateResponse = await fetch(`${url}/api/documents/1`, { headers: { 'x-user-id': '3' } });
    assert.equal(privateResponse.status, 404);
    const ownerResponse = await fetch(`${url}/api/documents/1`, { headers: { 'x-user-id': '1' } });
    assert.equal(ownerResponse.status, 200);
    database.prepare('INSERT INTO shares VALUES (1, 2)').run();
    const sharedResponse = await fetch(`${url}/api/documents/1`, { headers: { 'x-user-id': '2' } });
    assert.equal(sharedResponse.status, 200);
    server.close();
  });
});

function createDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, subscription_tier TEXT NOT NULL DEFAULT 'free'); CREATE TABLE documents (id INTEGER PRIMARY KEY, title TEXT, content TEXT, owner_id INTEGER, updated_at TEXT); CREATE TABLE shares (document_id INTEGER, user_id INTEGER, PRIMARY KEY (document_id, user_id)); CREATE TABLE import_usage (user_id INTEGER NOT NULL, import_date TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, import_date)); INSERT INTO users VALUES (1, 'Maya', 'maya@example.com', 'free'), (2, 'Theo', 'theo@example.com', 'free');");
  return database;
}

async function startTestServer(database: DatabaseSync) {
  const server = createApp(database).listen(0);
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { server, url: `http://127.0.0.1:${address.port}` };
}

describe('sharing, deletion, and import limits', () => {
  it('revokes shared access and only permits owners to delete', async () => {
    const database = createDatabase();
    const { server, url } = await startTestServer(database);
    const created = await fetch(`${url}/api/documents`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': '1' }, body: JSON.stringify({ title: 'Shared', content: '{"type":"doc"}' }) });
    const document = await created.json() as { id: number };
    const share = await fetch(`${url}/api/documents/${document.id}/shares`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': '1' }, body: JSON.stringify({ userId: 2 }) });
    assert.equal(share.status, 201);
    assert.equal((await fetch(`${url}/api/documents/${document.id}`, { headers: { 'x-user-id': '2' } })).status, 200);
    assert.equal((await fetch(`${url}/api/documents/${document.id}`, { method: 'DELETE', headers: { 'x-user-id': '2' } })).status, 403);
    assert.equal((await fetch(`${url}/api/documents/${document.id}/shares/2`, { method: 'DELETE', headers: { 'x-user-id': '1' } })).status, 200);
    assert.equal((await fetch(`${url}/api/documents/${document.id}`, { headers: { 'x-user-id': '2' } })).status, 404);
    assert.equal((await fetch(`${url}/api/documents/${document.id}`, { method: 'DELETE', headers: { 'x-user-id': '1' } })).status, 200);
    server.close(); database.close();
  });

  it('enforces the shared daily quota and preserves Markdown structure', async () => {
    const database = createDatabase();
    const { server, url } = await startTestServer(database);
    const headers = { 'Content-Type': 'application/json', 'x-user-id': '1' };
    for (let index = 0; index < 5; index += 1) { const result = await fetch(`${url}/api/imports`, { method: 'POST', headers, body: JSON.stringify({ fileName: `note-${index}.txt`, content: 'plain text' }) }); assert.equal(result.status, 201); }
    assert.equal((await fetch(`${url}/api/imports`, { method: 'POST', headers, body: JSON.stringify({ fileName: 'sixth.md', content: '# Full\n\n**bold** and *italic*\n\n- one\n- two\n\n1. first' }) })).status, 429);
    assert.equal((await fetch(`${url}/api/me/upgrade`, { method: 'POST', headers })).status, 200);
    const imported = await fetch(`${url}/api/imports`, { method: 'POST', headers, body: JSON.stringify({ fileName: 'full.md', content: '# Full\n\n**bold** and *italic*\n\n- one\n- two\n\n1. first' }) });
    assert.equal(imported.status, 201);
    const document = await imported.json() as { id: number };
    const saved = await (await fetch(`${url}/api/documents/${document.id}`, { headers: { 'x-user-id': '1' } })).json() as { content: string };
    const content = JSON.parse(saved.content);
    assert.equal(content.content[0].type, 'heading');
    assert.equal(content.content[1].content[0].marks[0].type, 'bold');
    assert.equal(content.content[2].type, 'bulletList');
    assert.equal(content.content[3].type, 'orderedList');
    const usage = await (await fetch(`${url}/api/me/usage`, { headers: { 'x-user-id': '1' } })).json() as { used: number; limit: number };
    assert.deepEqual(usage, { used: 6, limit: 50, remaining: 44, subscription: 'upgraded' });
    server.close(); database.close();
  });

  it('rejects the upgraded 51st import without creating a document', async () => {
    const database = createDatabase();
    const { server, url } = await startTestServer(database);
    const headers = { 'Content-Type': 'application/json', 'x-user-id': '1' };
    await fetch(`${url}/api/me/upgrade`, { method: 'POST', headers });
    const today = new Date().toISOString().slice(0, 10);
    database.prepare('INSERT INTO import_usage (user_id, import_date, count) VALUES (?, ?, 49)').run(1, today);
    const fiftieth = await fetch(`${url}/api/imports`, { method: 'POST', headers, body: JSON.stringify({ fileName: 'fiftieth.txt', content: 'allowed' }) });
    assert.equal(fiftieth.status, 201);
    const beforeRejected = database.prepare('SELECT count(*) as count FROM documents WHERE owner_id = 1').get() as { count: number };
    const fiftyFirst = await fetch(`${url}/api/imports`, { method: 'POST', headers, body: JSON.stringify({ fileName: 'fifty-first.txt', content: 'rejected' }) });
    assert.equal(fiftyFirst.status, 429);
    const afterRejected = database.prepare('SELECT count(*) as count FROM documents WHERE owner_id = 1').get() as { count: number };
    const usage = database.prepare('SELECT count FROM import_usage WHERE user_id = 1 AND import_date = ?').get(today) as { count: number };
    assert.equal(afterRejected.count, beforeRejected.count);
    assert.equal(usage.count, 50);
    server.close(); database.close();
  });
});
