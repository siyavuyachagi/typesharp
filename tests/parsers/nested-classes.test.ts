import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

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

afterAll(() => cleanupTempProjects());
