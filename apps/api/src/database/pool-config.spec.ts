import { buildPoolConfig, withPoolDefaults } from './pool-config';

describe('withPoolDefaults', () => {
  it('adds a query string to a plain URL', () => {
    expect(withPoolDefaults('postgresql://u:p@10.0.0.5:5432/eventos')).toBe(
      'postgresql://u:p@10.0.0.5:5432/eventos?connection_limit=5&pool_timeout=20',
    );
  });

  it('appends to existing params (Cloud SQL socket URL)', () => {
    expect(
      withPoolDefaults(
        'postgresql://u:p@localhost/eventos?host=/cloudsql/p:r:i',
      ),
    ).toBe(
      'postgresql://u:p@localhost/eventos?host=/cloudsql/p:r:i&connection_limit=5&pool_timeout=20',
    );
  });

  it('keeps explicit values and only adds the missing one', () => {
    expect(
      withPoolDefaults(
        'postgresql://u:p@h/db?schema=public&connection_limit=3',
      ),
    ).toBe(
      'postgresql://u:p@h/db?schema=public&connection_limit=3&pool_timeout=20',
    );
  });

  it('is a no-op when both are present', () => {
    const url = 'postgresql://u:p@h/db?pool_timeout=9&connection_limit=2';
    expect(withPoolDefaults(url)).toBe(url);
  });

  it('handles a trailing ? or & and a fragment', () => {
    expect(withPoolDefaults('postgresql://u:p@h/db?')).toBe(
      'postgresql://u:p@h/db?connection_limit=5&pool_timeout=20',
    );
    expect(withPoolDefaults('postgresql://u:p@h/db?a=1&')).toBe(
      'postgresql://u:p@h/db?a=1&connection_limit=5&pool_timeout=20',
    );
    expect(withPoolDefaults('postgresql://u:p@h/db#frag')).toBe(
      'postgresql://u:p@h/db?connection_limit=5&pool_timeout=20#frag',
    );
  });
});

describe('buildPoolConfig', () => {
  it('applies the f1-micro defaults as pg pool options', () => {
    expect(buildPoolConfig('postgresql://u:p@h/db')).toEqual({
      connectionString:
        'postgresql://u:p@h/db?connection_limit=5&pool_timeout=20',
      max: 5,
      connectionTimeoutMillis: 20_000,
    });
  });

  it('honours explicit URL values', () => {
    const config = buildPoolConfig(
      'postgresql://u:p@h/db?connection_limit=2&pool_timeout=7',
    );

    expect(config.max).toBe(2);
    expect(config.connectionTimeoutMillis).toBe(7000);
  });

  it('falls back to defaults for non-numeric values', () => {
    expect(
      buildPoolConfig('postgresql://u:p@h/db?connection_limit=abc').max,
    ).toBe(5);
  });
});
