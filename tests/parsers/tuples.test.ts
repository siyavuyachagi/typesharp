import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('Tuple types', () => {
  it('maps a named tuple property to an inline object type', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class PollOption {
          public (string Text, int? Index) Option { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'PollOption');
    const option = cls!.properties.find(p => p.name === 'Option');
    expect(option?.type).toBe('{ text: string; index: number | null }');
    expect(option?.isArray).toBe(false);
  });

  it('maps a List<T> of named tuples to an array of inline object types', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class CreatePostCommand {
          public List<(string Text, int? Index)>? PollOptions { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'CreatePostCommand');
    const pollOptions = cls!.properties.find(p => p.name === 'PollOptions');
    expect(pollOptions?.type).toBe('{ text: string; index: number | null }');
    expect(pollOptions?.isArray).toBe(true);
    expect(pollOptions?.isNullable).toBe(true);
  });

  it('falls back to item1, item2... for unnamed tuple elements', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Pair {
          public (string, int) Coordinates { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Pair');
    const coords = cls!.properties.find(p => p.name === 'Coordinates');
    expect(coords?.type).toBe('{ item1: string; item2: number }');
  });

  it('supports ValueTuple<T1, T2> generic syntax', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Pair {
          public ValueTuple<string, int> Coordinates { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Pair');
    const coords = cls!.properties.find(p => p.name === 'Coordinates');
    expect(coords?.type).toBe('{ item1: string; item2: number }');
  });

  it('resolves nested generic types inside a tuple element', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public class Bundle {
          public (List<string> Tags, IFormFile? Thumbnail) Content { get; set; }
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'Bundle');
    const content = cls!.properties.find(p => p.name === 'Content');
    expect(content?.type).toBe('{ tags: string[]; thumbnail: File | null }');
  });

  it('handles tuple parameters in positional records', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public record VoteDto((string Text, int? Index) Option, string VoterId);
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const cls = results.flatMap(r => r.classes).find(c => c.name === 'VoteDto');
    expect(cls!.properties.map(p => p.name)).toEqual(['Option', 'VoterId']);
    const option = cls!.properties.find(p => p.name === 'Option');
    expect(option?.type).toBe('{ text: string; index: number | null }');
    const voterId = cls!.properties.find(p => p.name === 'VoterId');
    expect(voterId?.type).toBe('string');
  });
});

afterAll(() => cleanupTempProjects());