import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('[TypeSharp] attribute overrides', () => {
  it('[TypeIgnore] excludes the property', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Dto {
          public string Name { get; set; }
          [TypeIgnore]
          public string PasswordHash { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Dto');
    expect(cls!.properties.find(p => p.name === 'PasswordHash')).toBeUndefined();
    expect(cls!.properties.find(p => p.name === 'Name')).toBeDefined();
  });

  it('[TypeName] overrides the property name', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Dto {
          [TypeName("created_at")]
          public DateTime CreatedAt { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Dto');
    expect(cls!.properties.find(p => p.name === 'created_at')).toBeDefined();
    expect(cls!.properties.find(p => p.name === 'CreatedAt')).toBeUndefined();
  });

  it('[TypeAs] overrides the inferred type', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Dto {
          [TypeAs("Date")]
          public DateTime UpdatedAt { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Dto');
    const prop = cls!.properties.find(p => p.name === 'UpdatedAt');
    expect(prop?.type).toBe('Date');
  });
});

afterAll(() => cleanupTempProjects());
