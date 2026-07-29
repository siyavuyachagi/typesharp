import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

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

afterAll(() => cleanupTempProjects());
