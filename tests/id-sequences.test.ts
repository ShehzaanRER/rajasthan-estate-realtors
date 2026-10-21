/**
 * Regression tests for the RER ID sequences (rer_project_id_seq /
 * rer_property_id_seq) and draft-project creation.
 *
 * Bug: creating a draft project from Brochure Convert failed with
 *   Failed query: SELECT nextval('rer_project_id_seq')
 * because the dev schema push dropped the (Drizzle-unknown) sequence while the
 * server was running, and nothing recreated it until a restart.
 *
 * Run:  npm test
 *
 * The last suite talks to a real PostgreSQL, but only inside a transaction that
 * is always rolled back, and only when RER_TEST_DATABASE_URL is set:
 *   RER_TEST_DATABASE_URL=postgresql://... npm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import pg from 'pg';
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres';
import { Projects } from '../collections/Projects';
import {
  allocateIdSequence,
  isMissingRelationError,
  parseNextval,
} from '../collections/hooks/allocateIdSequence';
import { assignProjectId, formatProjectId } from '../collections/hooks/assignProjectId';
import { assignPropertyId, formatPropertyId } from '../collections/hooks/assignPropertyId';
import { idSequenceSchemaHook } from '../collections/hooks/idSequenceSchema';
import { createDraftProject } from '../lib/brochure-convert/createDraft';
import { validateExtractedProject } from '../lib/brochure-convert/validateProject';

// --- fakes -------------------------------------------------------------------

type Row = Record<string, unknown>;

/** The error drizzle throws when the sequence does not exist. */
function missingSequenceError(sequence: string): Error {
  const driverError = Object.assign(new Error(`relation "${sequence}" does not exist`), {
    code: '42P01',
  });
  return new Error(`Failed query: SELECT nextval('${sequence}')`, { cause: driverError });
}

/**
 * A payload stand-in whose `db.drizzle.execute` behaves like PostgreSQL for the
 * two statements the ID code issues: CREATE SEQUENCE IF NOT EXISTS and nextval.
 * `sequences` maps name -> last issued value; absent key = sequence dropped.
 */
function fakePayload(sequences: Map<string, number>, log: string[] = []) {
  const execute = async (query: { queryChunks?: unknown[] }) => {
    const text = String(
      (query.queryChunks ?? []).map((chunk) => (chunk as { value?: string[] }).value?.join('') ?? '').join(''),
    );
    log.push(text);

    const create = text.match(/CREATE SEQUENCE IF NOT EXISTS (\w+)/);
    if (create) {
      if (!sequences.has(create[1])) sequences.set(create[1], 0);
      return { rows: [] };
    }
    const nextval = text.match(/SELECT nextval\('(\w+)'\)/);
    if (nextval) {
      const name = nextval[1];
      if (!sequences.has(name)) throw missingSequenceError(name);
      const value = sequences.get(name)! + 1;
      sequences.set(name, value);
      return { rows: [{ nextval: String(value) }] };
    }
    // setval() from syncIdSequence — no stored docs in the fake, so unused.
    return { rows: [] };
  };

  return {
    db: { drizzle: { execute } },
    // syncIdSequence → payload.find; an empty collection means "nothing to sync".
    find: async () => ({ docs: [] }),
    logger: { warn: () => undefined },
    log,
  };
}

// --- ID formats ----------------------------------------------------------------

describe('ID formats are unchanged', () => {
  it('projects are RER-P-0000', () => {
    assert.equal(formatProjectId(1), 'RER-P-0001');
    assert.equal(formatProjectId(8), 'RER-P-0008');
    assert.equal(formatProjectId(12345), 'RER-P-12345');
  });

  it('properties are RER-00000', () => {
    assert.equal(formatPropertyId(23), 'RER-00023');
  });
});

describe('parseNextval', () => {
  it('reads node-postgres results (bigint arrives as a string)', () => {
    assert.equal(parseNextval({ rows: [{ nextval: '8' }] }, 'x'), 8);
  });
  it('rejects empty or non-positive results', () => {
    assert.throws(() => parseNextval({ rows: [] }, 'RER Project Number'), /RER Project Number/);
    assert.throws(() => parseNextval({ rows: [{ nextval: '0' }] }, 'x'));
  });
});

// --- allocation + self-healing ------------------------------------------------

describe('isMissingRelationError', () => {
  it('finds SQLSTATE 42P01 on the wrapped cause', () => {
    assert.equal(isMissingRelationError(missingSequenceError('rer_project_id_seq')), true);
  });
  it('ignores unrelated failures', () => {
    assert.equal(isMissingRelationError(new Error('connection terminated')), false);
    assert.equal(isMissingRelationError(undefined), false);
  });
});

describe('allocateIdSequence', () => {
  it('allocates normally when the sequence exists', async () => {
    const payload = fakePayload(new Map([['rer_project_id_seq', 7]]));
    const n = await allocateIdSequence({
      payload: payload as never,
      sequence: 'rer_project_id_seq',
      label: 'RER Project Number',
      ensure: async () => assert.fail('ensure must not run when the sequence exists'),
    });
    assert.equal(n, 8);
  });

  it('recreates a dropped sequence and retries instead of failing', async () => {
    const sequences = new Map<string, number>(); // sequence has been dropped
    const payload = fakePayload(sequences);
    let ensured = 0;
    const n = await allocateIdSequence({
      payload: payload as never,
      sequence: 'rer_project_id_seq',
      label: 'RER Project Number',
      ensure: async (p) => {
        ensured += 1;
        await p.db.drizzle.execute({
          queryChunks: [{ value: ['CREATE SEQUENCE IF NOT EXISTS rer_project_id_seq'] }],
        } as never);
      },
    });
    assert.equal(ensured, 1);
    assert.equal(n, 1);
  });

  it('does not mask other database errors', async () => {
    const payload = {
      db: {
        drizzle: {
          execute: async () => {
            throw new Error('connection terminated unexpectedly');
          },
        },
      },
      logger: { warn: () => undefined },
    };
    await assert.rejects(
      allocateIdSequence({
        payload: payload as never,
        sequence: 'rer_project_id_seq',
        label: 'x',
        ensure: async () => assert.fail('ensure must not run for unrelated errors'),
      }),
      /connection terminated/,
    );
  });

  it('gives up after one retry if recreation does not help', async () => {
    const payload = fakePayload(new Map());
    await assert.rejects(
      allocateIdSequence({
        payload: payload as never,
        sequence: 'rer_project_id_seq',
        label: 'x',
        ensure: async () => undefined, // ensure is a no-op, sequence stays missing
      }),
      /Failed query/,
    );
  });
});

// --- hooks ---------------------------------------------------------------------

const hookArgs = (operation: 'create' | 'update', payload: unknown, data: Row, originalDoc?: Row) =>
  ({ data, originalDoc, operation, req: { payload } }) as never;

describe('assignProjectId / assignPropertyId hooks', () => {
  it('continue the existing series after the last stored ID', async () => {
    const payload = fakePayload(
      new Map([
        ['rer_project_id_seq', 7],
        ['rer_property_id_seq', 22],
      ]),
    );
    const project = (await assignProjectId(hookArgs('create', payload, {}))) as Row;
    const property = (await assignPropertyId(hookArgs('create', payload, {}))) as Row;
    assert.equal(project.projectId, 'RER-P-0008');
    assert.equal(property.propertyId, 'RER-00023');
  });

  it('issue unique, increasing IDs across consecutive creates', async () => {
    const payload = fakePayload(new Map([['rer_project_id_seq', 7]]));
    const ids = new Set<string>();
    for (let i = 0; i < 5; i += 1) {
      const out = (await assignProjectId(hookArgs('create', payload, {}))) as Row;
      ids.add(String(out.projectId));
    }
    assert.equal(ids.size, 5);
  });

  it('never reassign an ID on update', async () => {
    const payload = fakePayload(new Map([['rer_project_id_seq', 7]]));
    const out = (await assignProjectId(
      hookArgs('update', payload, { projectId: 'RER-P-9999' }, { projectId: 'RER-P-0003' }),
    )) as Row;
    assert.equal(out.projectId, 'RER-P-0003');
  });

  it('survive a dropped sequence for both collections', async () => {
    const payload = fakePayload(new Map());
    const project = (await assignProjectId(hookArgs('create', payload, {}))) as Row;
    const property = (await assignPropertyId(hookArgs('create', payload, {}))) as Row;
    assert.equal(project.projectId, 'RER-P-0001');
    assert.equal(property.propertyId, 'RER-00001');
  });
});

// --- draft project creation (Brochure Convert → Create Draft Project) --------------

describe('createDraftProject', () => {
  /** payload.create stand-in that runs the real Projects beforeChange hooks. */
  function payloadRunningCollectionHooks(sequences: Map<string, number>) {
    const base = fakePayload(sequences);
    return {
      ...base,
      create: async ({ collection, data }: { collection: string; data: Row }) => {
        assert.equal(collection, 'projects');
        let working = { ...data };
        for (const hook of Projects.hooks?.beforeChange ?? []) {
          working = (await hook({
            data: working,
            operation: 'create',
            req: { payload: base },
          } as never)) as Row;
        }
        return { id: 99, ...working };
      },
    };
  }

  const extracted = () => validateExtractedProject({ name: 'Regression Heights', developer: 'Test Builder' });

  it('Projects registers assignProjectId on beforeChange', () => {
    assert.ok(Projects.hooks?.beforeChange?.includes(assignProjectId));
  });

  it('creates a draft with the next RER-P ID', async () => {
    const payload = payloadRunningCollectionHooks(new Map([['rer_project_id_seq', 7]]));
    const created = await createDraftProject(payload as never, {
      data: extracted(),
      amenityIds: [],
      slug: 'regression-heights',
      source: { sourceType: 'pasted-text', sourceFilename: null, extractionNotes: [] },
    });
    assert.equal(created.projectId, 'RER-P-0008');
    assert.equal(created.status, 'draft');
  });

  it('still creates the draft when the sequence was dropped (the reported failure)', async () => {
    const payload = payloadRunningCollectionHooks(new Map());
    const created = await createDraftProject(payload as never, {
      data: extracted(),
      amenityIds: [],
      slug: 'regression-heights',
      source: { sourceType: 'pasted-text', sourceFilename: null, extractionNotes: [] },
    });
    assert.match(String(created.projectId), /^RER-P-\d{4,}$/);
  });
});

// --- the schema push must own the sequences ---------------------------------------

describe('idSequenceSchemaHook', () => {
  it('adds both sequences to the schema without disturbing tables/relations', async () => {
    const tables = { projects: {} };
    const relations = { relations_projects: {} };
    const out = await idSequenceSchemaHook({
      schema: { enums: { enum_x: {} }, relations, tables },
    } as never);
    assert.equal(out.tables, tables);
    assert.equal(out.relations, relations);
    assert.ok('enum_x' in out.enums);
    assert.ok('rer_project_id_seq' in out.enums);
    assert.ok('rer_property_id_seq' in out.enums);
  });
});

const TEST_DB = process.env.RER_TEST_DATABASE_URL;

describe('dev schema push vs the ID sequences (real PostgreSQL, rolled back)', { skip: !TEST_DB }, () => {
  const SEQUENCES = ['rer_project_id_seq', 'rer_property_id_seq'];
  const mentionsSequence = (statement: string) => SEQUENCES.some((name) => statement.includes(name));

  /** Runs `fn` inside BEGIN … ROLLBACK so nothing here can touch real data. */
  async function inRolledBackTransaction(
    fn: (db: ReturnType<typeof drizzle>, client: pg.Client) => Promise<void>,
  ) {
    const client = new pg.Client({ connectionString: TEST_DB, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await client.query('BEGIN');
      await fn(drizzle({ client: client as unknown as pg.Pool }), client);
    } finally {
      await client.query('ROLLBACK');
      await client.end();
    }
  }

  async function pushStatements(db: unknown, imports: Record<string, unknown>): Promise<string[]> {
    const { pushSchema } = await import('drizzle-kit/api');
    const { statementsToExecute } = await pushSchema(imports, db as never, ['public']);
    return statementsToExecute.filter(mentionsSequence);
  }

  const declared = async () =>
    (await idSequenceSchemaHook({ schema: { enums: {}, relations: {}, tables: {} } } as never)).enums as Record<
      string,
      unknown
    >;

  it('control: a sequence unknown to the schema IS dropped (the original bug)', async () => {
    await inRolledBackTransaction(async (db, client) => {
      await client.query('CREATE SEQUENCE IF NOT EXISTS rer_project_id_seq AS BIGINT INCREMENT BY 1 MINVALUE 1 START WITH 1');
      const statements = await pushStatements(db, {});
      assert.ok(statements.some((s) => /DROP SEQUENCE/i.test(s) && s.includes('rer_project_id_seq')), String(statements));
    });
  });

  it('declared sequences that exist are left alone — no DROP, no ALTER', async () => {
    await inRolledBackTransaction(async (db, client) => {
      for (const name of SEQUENCES) {
        await client.query(`CREATE SEQUENCE IF NOT EXISTS ${name} AS BIGINT INCREMENT BY 1 MINVALUE 1 START WITH 1`);
      }
      assert.deepEqual(await pushStatements(db, await declared()), []);
    });
  });

  it('declared sequences that are missing are recreated by the push', async () => {
    await inRolledBackTransaction(async (db, client) => {
      for (const name of SEQUENCES) await client.query(`DROP SEQUENCE IF EXISTS ${name}`);
      const statements = await pushStatements(db, await declared());
      for (const name of SEQUENCES) {
        assert.ok(
          statements.some((s) => /CREATE SEQUENCE/i.test(s) && s.includes(name)),
          `${name} should be created: ${statements}`,
        );
      }
      assert.ok(!statements.some((s) => /DROP SEQUENCE/i.test(s)));
    });
  });
});
