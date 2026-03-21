import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseCSharpFiles } from '../../src/parser';

function makeTempProject(csContent: string): { dir: string; csproj: string } {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-parser-'));
  const csproj = path.join(dir, 'Test.csproj');
  fs.writeFileSync(csproj, `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>`);
  fs.writeFileSync(path.join(dir, 'Model.cs'), csContent);
  return { dir, csproj };
}

describe('Parser', () => {
  describe('[Obsolete] support', () => {
    it('marks a property with [Obsolete] as deprecated', async () => {
      const { csproj } = makeTempProject(`
        using System;
        namespace Test {
          [TypeSharp]
          public class Foo {
            public string Name { get; set; }
            [Obsolete]
            public string OldName { get; set; }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const foo = results.flatMap(r => r.classes).find(c => c.name === 'Foo');
      expect(foo).toBeDefined();

      const oldName = foo!.properties.find(p => p.name === 'OldName');
      expect(oldName?.isDeprecated).toBe(true);
      expect(oldName?.deprecationMessage).toBeUndefined();
    });

    it('captures the deprecation message from [Obsolete("...")]', async () => {
      const { csproj } = makeTempProject(`
        using System;
        namespace Test {
          [TypeSharp]
          public class Bar {
            [Obsolete("Use NewField instead.")]
            public string OldField { get; set; }
            public string NewField { get; set; }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const bar = results.flatMap(r => r.classes).find(c => c.name === 'Bar');
      const oldField = bar!.properties.find(p => p.name === 'OldField');

      expect(oldField?.isDeprecated).toBe(true);
      expect(oldField?.deprecationMessage).toBe('Use NewField instead.');
    });

    it('does NOT mark a normal property as deprecated', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class Baz {
            public string ActiveField { get; set; }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const baz = results.flatMap(r => r.classes).find(c => c.name === 'Baz');
      const active = baz!.properties.find(p => p.name === 'ActiveField');

      expect(active?.isDeprecated).toBe(false);
    });

    it('handles [Obsolete] on expression-bodied property', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class Computed {
            public string First { get; set; }
            [Obsolete("Use First.")]
            public string Full => First;
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'Computed');
      const full = cls!.properties.find(p => p.name === 'Full');

      expect(full?.isDeprecated).toBe(true);
      expect(full?.deprecationMessage).toBe('Use First.');
    });

    it('does NOT bleed @deprecated onto properties after a deprecated one', async () => {
      const { csproj } = makeTempProject(`
        using System;
        namespace Test {
          [TypeSharp]
          public class Bleed {
            public string First { get; set; }
            [Obsolete("Old")]
            public string OldField { get; set; }
            public string AfterOld { get; set; }
            public string AlsoAfter { get; set; }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'Bleed');
      expect(cls).toBeDefined();

      expect(cls!.properties.find(p => p.name === 'First')?.isDeprecated).toBe(false);
      expect(cls!.properties.find(p => p.name === 'OldField')?.isDeprecated).toBe(true);
      expect(cls!.properties.find(p => p.name === 'AfterOld')?.isDeprecated).toBe(false);
      expect(cls!.properties.find(p => p.name === 'AlsoAfter')?.isDeprecated).toBe(false);
    });
  });


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


  describe('Generic types', () => {
    it('parses a single generic parameter', async () => {
      const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class ApiResponse<T> {
          public bool Success { get; set; }
          public T Data { get; set; }
        }
      }
    `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'ApiResponse');
      expect(cls).toBeDefined();
      expect(cls!.genericParameters).toEqual(['T']);
    });

    it('parses multiple generic parameters', async () => {
      const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Result<TData, TError> {
          public bool IsSuccess { get; set; }
          public TData? Data { get; set; }
          public TError? Error { get; set; }
        }
      }
    `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'Result');
      expect(cls).toBeDefined();
      expect(cls!.genericParameters).toEqual(['TData', 'TError']);
    });

    it('preserves generic parameters in inheritance', async () => {
      const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class ApiResponse<T> {
          public bool Success { get; set; }
          public T? Data { get; set; }
        }
        [TypeSharp]
        public class PagedApiResponse<T> : ApiResponse<T> {
          public int PageNumber { get; set; }
          public int TotalPages { get; set; }
        }
      }
    `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'PagedApiResponse');
      expect(cls).toBeDefined();
      expect(cls!.genericParameters).toEqual(['T']);
      expect(cls!.inheritsFrom).toBe('ApiResponse');
      expect(cls!.baseClassGenerics).toEqual(['T']);
    });
  });


  describe('Nested classes', () => {
    it('extracts nested annotated class as standalone interface', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class AuthResponse {
            public string AccessToken { get; set; }
            public string RefreshToken { get; set; }
            [TypeSharp]
            public class User {
              public string FirstName { get; set; }
              public string LastName { get; set; }
            }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const classes = results.flatMap(r => r.classes);

      const user = classes.find(c => c.name === 'User');
      expect(user).toBeDefined();
      expect(user!.properties.find(p => p.name === 'FirstName')).toBeDefined();
      expect(user!.properties.find(p => p.name === 'LastName')).toBeDefined();
    });

    it('injects a reference property on the parent pointing to the nested class', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class AuthResponse {
            public string AccessToken { get; set; }
            public string RefreshToken { get; set; }
            [TypeSharp]
            public class User {
              public string FirstName { get; set; }
              public string LastName { get; set; }
            }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const classes = results.flatMap(r => r.classes);

      const authResponse = classes.find(c => c.name === 'AuthResponse');
      expect(authResponse).toBeDefined();

      expect(authResponse!.properties.find(p => p.name === 'FirstName')).toBeUndefined()
      const userProp = authResponse!.properties.find(p => p.name === 'user');
      expect(userProp).toBeDefined();
      expect(userProp!.type).toBe('User');
      expect(userProp!.isNullable).toBe(false);
      expect(userProp!.isArray).toBe(false);
    });

    it('does NOT bleed nested class properties into the parent', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class AuthResponse {
            public string AccessToken { get; set; }
            [TypeSharp]
            public class User {
              public string FirstName { get; set; }
              public string Email { get; set; }
            }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const classes = results.flatMap(r => r.classes);

      const authResponse = classes.find(c => c.name === 'AuthResponse');
      expect(authResponse).toBeDefined();

      expect(authResponse!.properties.find(p => p.name === 'FirstName')).toBeUndefined();
      expect(authResponse!.properties.find(p => p.name === 'Email')).toBeUndefined();
    });

    it('respects [TypeSharp("name")] override on nested class', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public class AuthResponse {
            public string AccessToken { get; set; }
            [TypeSharp("AuthUser")]
            public class User {
              public string FirstName { get; set; }
            }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const classes = results.flatMap(r => r.classes);

      const authUser = classes.find(c => c.name === 'AuthUser');
      expect(authUser).toBeDefined();

      const authResponse = classes.find(c => c.name === 'AuthResponse');
      const userProp = authResponse!.properties.find(p => p.name === 'user');
      expect(userProp!.type).toBe('AuthUser');
    });
  });
});