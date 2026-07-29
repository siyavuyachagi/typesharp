import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('[TypeSharp("name")] class/enum name override', () => {
  it('overrides class name', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp("auth_response")]
        public class AuthResponse {
          public string AccessToken { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'auth_response');
    expect(cls).toBeDefined();
    expect(results.flatMap(r => r.classes).find(c => c.name === 'AuthResponse')).toBeUndefined();
  });

  it('overrides enum name', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp("user_role")]
        public enum UserRole {
          Admin,
          User,
          Guest
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const en = results.flatMap(r => r.classes).find(c => c.name === 'user_role');
    expect(en).toBeDefined();
    expect(en?.isEnum).toBe(true);
    expect(results.flatMap(r => r.classes).find(c => c.name === 'UserRole')).toBeUndefined();
  });

  it('[TypeSharp] without arg still works (no regression)', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class UserDto {
          public string Name { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'UserDto');
    expect(cls).toBeDefined();
  });

  it('override name is used as-is, ignoring namingConvention', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp("my_custom_Name")]
        public class SomethingElse {
          public string Value { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'my_custom_Name');
    expect(cls).toBeDefined();
    expect(results.flatMap(r => r.classes).find(c => c.name === 'SomethingElse')).toBeUndefined();
  });
});

afterAll(() => cleanupTempProjects());
