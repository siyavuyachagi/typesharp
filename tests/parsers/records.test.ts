import { describe, it, expect, afterAll } from 'vitest';
import { parseCSharpFiles } from '../../src/parser';
import { makeTempProject, cleanupTempProjects } from './_utils';

describe('Records', () => {
  // ── Positional (primary constructor) ────────────────────────────────────
  describe('Positional records', () => {
    it('parses a simple positional record', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record Point(int X, int Y);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'Point');
      expect(cls).toBeDefined();
      expect(cls!.isRecord).toBe(true);
      expect(cls!.properties.find(p => p.name === 'X')).toBeDefined();
      expect(cls!.properties.find(p => p.name === 'Y')).toBeDefined();
    });

    it('maps primitive types in positional parameters', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record ProductSummary(int Id, string Name, decimal Price, bool IsActive);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'ProductSummary');
      expect(cls).toBeDefined();
      expect(cls!.properties.find(p => p.name === 'Id')?.type).toBe('number');
      expect(cls!.properties.find(p => p.name === 'Name')?.type).toBe('string');
      expect(cls!.properties.find(p => p.name === 'Price')?.type).toBe('number');
      expect(cls!.properties.find(p => p.name === 'IsActive')?.type).toBe('boolean');
    });

    it('handles nullable parameters', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record UserRecord(int Id, string? DisplayName, DateOnly? DateOfBirth);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'UserRecord');
      expect(cls!.properties.find(p => p.name === 'Id')?.isNullable).toBe(false);
      expect(cls!.properties.find(p => p.name === 'DisplayName')?.isNullable).toBe(true);
      expect(cls!.properties.find(p => p.name === 'DateOfBirth')?.isNullable).toBe(true);
      expect(cls!.properties.find(p => p.name === 'DateOfBirth')?.type).toBe('string');
    });

    it('handles collection parameters (List<T>)', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record OrderDto(int Id, List<string> Tags);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'OrderDto');
      const tags = cls!.properties.find(p => p.name === 'Tags');
      expect(tags?.isArray).toBe(true);
      expect(tags?.type).toBe('string');
    });

    it('handles Dictionary parameters', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record ConfigDto(Dictionary<string, bool> Flags);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'ConfigDto');
      const flags = cls!.properties.find(p => p.name === 'Flags');
      expect(flags?.type).toBe('Record<string, boolean>');
      expect(flags?.isArray).toBe(false);
    });

    it('handles Guid and DateTime parameters', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record AuditDto(Guid TraceId, DateTime CreatedAt);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'AuditDto');
      expect(cls!.properties.find(p => p.name === 'TraceId')?.type).toBe('string');
      expect(cls!.properties.find(p => p.name === 'CreatedAt')?.type).toBe('string');
    });

    it('handles a default value on an optional positional parameter', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record FederationFilters(string? ProvinceName = default);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'FederationFilters');
      expect(cls).toBeDefined();
      const prop = cls!.properties.find(p => p.name === 'ProvinceName');
      expect(prop).toBeDefined();
      expect(prop?.type).toBe('string');
      expect(prop?.isNullable).toBe(true);
    });
  });

  // ── Record class / record struct keywords ────────────────────────────────
  describe('record class and record struct', () => {
    it('parses "record class" syntax', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record class AddressRecord(string Street, string City);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'AddressRecord');
      expect(cls).toBeDefined();
      expect(cls!.isRecord).toBe(true);
      expect(cls!.properties.length).toBe(2);
    });

    it('parses "record struct" syntax', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record struct CoordRecord(double Lat, double Lng);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'CoordRecord');
      expect(cls).toBeDefined();
      expect(cls!.isRecord).toBe(true);
      expect(cls!.properties.find(p => p.name === 'Lat')?.type).toBe('number');
    });
  });

  // ── Body-only record (no primary constructor) ────────────────────────────
  describe('Body-only records', () => {
    it('parses a record with body properties instead of a primary constructor', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record PersonRecord
          {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public int Age { get; set; }
          }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'PersonRecord');
      expect(cls).toBeDefined();
      expect(cls!.isRecord).toBe(true);
      expect(cls!.properties.find(p => p.name === 'FirstName')?.type).toBe('string');
      expect(cls!.properties.find(p => p.name === 'Age')?.type).toBe('number');
    });
  });

  // ── Generics ─────────────────────────────────────────────────────────────
  describe('Generic records', () => {
    it('parses a generic positional record', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record PagedResult<T>(IEnumerable<T> Items, int TotalCount);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'PagedResult');
      expect(cls).toBeDefined();
      expect(cls!.genericParameters).toEqual(['T']);
      expect(cls!.properties.find(p => p.name === 'Items')?.isArray).toBe(true);
      expect(cls!.properties.find(p => p.name === 'TotalCount')?.type).toBe('number');
    });
  });

  // ── Inheritance ──────────────────────────────────────────────────────────
  describe('Record inheritance', () => {
    it('preserves base record in extends clause', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record BaseEvent(Guid Id, DateTime OccurredAt);

          [TypeSharp]
          public record UserCreatedEvent(Guid Id, DateTime OccurredAt, string Email) : BaseEvent(Id, OccurredAt);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const child = results.flatMap(r => r.classes).find(c => c.name === 'UserCreatedEvent');
      expect(child).toBeDefined();
      expect(child!.inheritsFrom).toBe('BaseEvent');
    });

    it('ignores C# interfaces in record inheritance', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record MyRecord(int Id) : IEquatable<MyRecord>;
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'MyRecord');
      expect(cls).toBeDefined();
      expect(cls!.inheritsFrom).toBeUndefined();
    });
  });

  // ── Per-parameter attribute overrides ────────────────────────────────────
  describe('Record parameter attribute overrides', () => {
    it('[TypeIgnore] excludes a positional parameter', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record SecureRecord(string Name, [property: TypeIgnore] string Secret);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'SecureRecord');
      expect(cls!.properties.find(p => p.name === 'Secret')).toBeUndefined();
      expect(cls!.properties.find(p => p.name === 'Name')).toBeDefined();
    });

    it('[property: TypeAs] overrides the inferred type on a positional parameter', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record TimestampRecord([property: TypeAs("Date")] DateTime CreatedAt);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'TimestampRecord');
      expect(cls!.properties.find(p => p.name === 'CreatedAt')?.type).toBe('Date');
    });

    it('[property: Obsolete] marks a positional parameter as deprecated', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record LegacyRecord([property: Obsolete("Use NewId")] string OldId, string NewId);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'LegacyRecord');
      const oldId = cls!.properties.find(p => p.name === 'OldId');
      expect(oldId?.isDeprecated).toBe(true);
      expect(oldId?.deprecationMessage).toBe('Use NewId');
      expect(cls!.properties.find(p => p.name === 'NewId')?.isDeprecated).toBe(false);
    });
  });

  // ── [TypeSharp("name")] on records ───────────────────────────────────────
  describe('[TypeSharp("name")] on records', () => {
    it('overrides record name', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp("point_dto")]
          public record Point(int X, int Y);
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const cls = results.flatMap(r => r.classes).find(c => c.name === 'point_dto');
      expect(cls).toBeDefined();
      expect(cls!.isRecord).toBe(true);
      expect(results.flatMap(r => r.classes).find(c => c.name === 'Point')).toBeUndefined();
    });
  });

  // ── isRecord flag ────────────────────────────────────────────────────────
  describe('isRecord flag', () => {
    it('is true for records, false for classes', async () => {
      const { csproj } = makeTempProject(`
        namespace Test {
          [TypeSharp]
          public record MyRecord(int Id);

          [TypeSharp]
          public class MyClass { public int Id { get; set; } }
        }
      `);

      const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
      const classes = results.flatMap(r => r.classes);
      expect(classes.find(c => c.name === 'MyRecord')?.isRecord).toBe(true);
      expect(classes.find(c => c.name === 'MyClass')?.isRecord).toBe(false);
    });
  });


  it('does not let a later enum steal an earlier record\'s annotation', async () => {
    const { csproj } = makeTempProject(`
      namespace Test {
        [TypeSharp]
        public record FederationFilters(string? ProvinceName = default);

        [TypeSharp]
        public enum FederationSortBy
        {
            Default,
            NameAsc,
            NameDesc,
            Latest,
            Popular
        }
      }
    `);

    const results = await parseCSharpFiles({ source: csproj, outputPath: '/tmp/out' });
    const classes = results.flatMap(r => r.classes);

    const filters = classes.find(c => c.name === 'FederationFilters');
    expect(filters).toBeDefined();
    expect(filters!.isRecord).toBe(true);
    expect(filters!.properties.length).toBe(1);
    const provinceName = filters!.properties.find(p => p.name === 'ProvinceName');
    expect(provinceName).toBeDefined();
    expect(provinceName?.type).toBe('string');
    expect(provinceName?.isNullable).toBe(true);

    const sortEnums = classes.filter(c => c.name === 'FederationSortBy');
    expect(sortEnums.length).toBe(1);
    expect(sortEnums[0]!.isEnum).toBe(true);
    expect(sortEnums[0]!.enumValues).toEqual(['Default', 'NameAsc', 'NameDesc', 'Latest', 'Popular']);
  });
});

afterAll(() => cleanupTempProjects());
