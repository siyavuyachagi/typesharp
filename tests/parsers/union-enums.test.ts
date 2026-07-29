import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('[Union] enum support', () => {
  it('sets isUnion: true when [TypeSharp][Union] decorates an enum', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        [Union]
        public enum Status { Active, Inactive }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Status');
    expect(cls).toBeDefined();
    expect(cls!.isEnum).toBe(true);
    expect(cls!.isUnion).toBe(true);
  });

  it('sets isUnion: true when [Union] comes before [TypeSharp]', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [Union]
        [TypeSharp]
        public enum Status { Active, Inactive }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Status');
    expect(cls).toBeDefined();
    expect(cls!.isUnion).toBe(true);
  });

  it('sets isUnion: true when [TypeSharp][Union] are on the same line', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp][Union]
        public enum Direction { North, South, East, West }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Direction');
    expect(cls?.isUnion).toBe(true);
  });

  it('does NOT set isUnion on a plain [TypeSharp] enum', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public enum UserRoleCode { Admin, User, Guest }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'UserRoleCode');
    expect(cls).toBeDefined();
    expect(cls!.isUnion).toBeFalsy();
  });

  it('ignores [Union] without [TypeSharp]', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [Union]
        public enum Ignored { A, B }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Ignored');
    expect(cls).toBeUndefined();
  });

  it('works with [TypeSharp("name")] name override', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp("status_type")]
        [Union]
        public enum Status { Active, Inactive }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'status_type');
    expect(cls).toBeDefined();
    expect(cls!.isUnion).toBe(true);
    expect(results.flatMap(r => r.classes).find(c => c.name === 'Status')).toBeUndefined();
  });

  it('preserves all enum values in a union enum', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        [Union]
        public enum OrderStatus { Pending, Processing, Shipped, Delivered, Cancelled }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'OrderStatus');
    expect(cls!.enumValues).toEqual(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
  });

  it('sets isUnion: true with [TypeSharp, Union] comma syntax', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp, Union]
        public enum Status { Active, Inactive }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Status');
    expect(cls).toBeDefined();
    expect(cls!.isUnion).toBe(true);
  });

  it('sets isUnion: true with [TypeSharp("name"), Union] comma syntax', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp("my_status"), Union]
        public enum Status { Active, Inactive }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'my_status');
    expect(cls).toBeDefined();
    expect(cls!.isUnion).toBe(true);
  });
});

afterAll(() => cleanupTempProjects());
