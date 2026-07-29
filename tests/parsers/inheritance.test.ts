import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('Inheritance', () => {
  it('preserves class inheritance', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Base {
          public int Id { get; set; }
        }
        [TypeSharp]
        public class Child : Base {
          public string Name { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const child = results.flatMap(r => r.classes).find(c => c.name === 'Child');
    expect(child?.inheritsFrom).toBe('Base');
  });

  it('ignores C# interfaces in inheritance (e.g. IActionResult)', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class MyResult : IActionResult {
          public string Message { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'MyResult');
    expect(cls).toBeDefined();
    expect(cls!.inheritsFrom).toBeUndefined();
  });

  it('ignores C# interfaces but keeps concrete base class', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Base {
          public int Id { get; set; }
        }
        [TypeSharp]
        public class Child : Base, IDisposable {
          public string Name { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const child = results.flatMap(r => r.classes).find(c => c.name === 'Child');
    expect(child?.inheritsFrom).toBe('Base');
  });
});

afterAll(() => cleanupTempProjects());
