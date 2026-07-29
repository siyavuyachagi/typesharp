import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('init-only properties', () => {
  it('parses init-only properties as normal properties', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class LoginCommand {
          public string Email { get; init; } = default!;
          public string Password { get; init; } = default!;
          public bool RememberMe { get; init; } = false;
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'LoginCommand');
    expect(cls).toBeDefined();
    expect(cls!.properties.find(p => p.name === 'Email')).toBeDefined();
    expect(cls!.properties.find(p => p.name === 'Password')).toBeDefined();
    expect(cls!.properties.find(p => p.name === 'RememberMe')).toBeDefined();
  });

  it('maps init-only property types correctly', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class LoginCommand {
          public string Email { get; init; } = default!;
          public string Password { get; init; } = default!;
          public bool RememberMe { get; init; } = false;
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'LoginCommand');
    expect(cls!.properties.find(p => p.name === 'Email')?.type).toBe('string');
    expect(cls!.properties.find(p => p.name === 'Password')?.type).toBe('string');
    expect(cls!.properties.find(p => p.name === 'RememberMe')?.type).toBe('boolean');
  });

  it('respects nullability on init-only properties', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class ProfileCommand {
          public string Username { get; init; } = default!;
          public string? Bio { get; init; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'ProfileCommand');
    expect(cls!.properties.find(p => p.name === 'Username')?.isNullable).toBe(false);
    expect(cls!.properties.find(p => p.name === 'Bio')?.isNullable).toBe(true);
  });

  it('[TypeIgnore] excludes an init-only property', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class LoginCommand {
          public string Email { get; init; } = default!;
          [TypeIgnore]
          public string Password { get; init; } = default!;
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'LoginCommand');
    expect(cls!.properties.find(p => p.name === 'Password')).toBeUndefined();
    expect(cls!.properties.find(p => p.name === 'Email')).toBeDefined();
  });

  it('[TypeAs] overrides type on an init-only property', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class EventCommand {
          [TypeAs("Date")]
          public DateTime ScheduledAt { get; init; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'EventCommand');
    expect(cls!.properties.find(p => p.name === 'ScheduledAt')?.type).toBe('Date');
  });

  it('[Obsolete] marks an init-only property as deprecated', async () => {
    const { csproj } = makeTempProject(`
      using System;
      namespace Test {
        [TypeSharp]
        public class LoginCommand {
          [Obsolete("Use Email instead.")]
          public string Username { get; init; } = default!;
          public string Email { get; init; } = default!;
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'LoginCommand');
    const username = cls!.properties.find(p => p.name === 'Username');
    expect(username?.isDeprecated).toBe(true);
    expect(username?.deprecationMessage).toBe('Use Email instead.');
    expect(cls!.properties.find(p => p.name === 'Email')?.isDeprecated).toBe(false);
  });

  it('ignores the generic interface base (ICommand<T>) — no inheritsFrom set', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class LoginCommand : ICommand<string> {
          public string Email { get; init; } = default!;
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'LoginCommand');
    expect(cls).toBeDefined();
    expect(cls!.inheritsFrom).toBeUndefined();
  });
});

afterAll(() => cleanupTempProjects());
