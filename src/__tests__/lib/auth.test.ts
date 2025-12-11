import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthError, requireAdminToken, hashTournamentPassword, verifyTournamentPassword } from '@/lib/auth';

describe('AuthError', () => {
  it('creates an error with default status 401', () => {
    const error = new AuthError('Unauthorized');
    expect(error.message).toBe('Unauthorized');
    expect(error.status).toBe(401);
    expect(error).toBeInstanceOf(Error);
  });

  it('creates an error with custom status', () => {
    const error = new AuthError('Server Error', 500);
    expect(error.message).toBe('Server Error');
    expect(error.status).toBe(500);
  });
});

describe('requireAdminToken', () => {
  beforeEach(() => {
    vi.stubEnv('ADMIN_PASSWORD', 'test-admin-password');
  });

  it('throws error when ADMIN_PASSWORD is not configured', () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(() => requireAdminToken('some-token')).toThrow('ADMIN_PASSWORD not configured');
  });

  it('throws error when token is not provided', () => {
    expect(() => requireAdminToken()).toThrow('Invalid admin token');
    expect(() => requireAdminToken(null)).toThrow('Invalid admin token');
    expect(() => requireAdminToken(undefined)).toThrow('Invalid admin token');
  });

  it('throws error when token is invalid', () => {
    expect(() => requireAdminToken('wrong-token')).toThrow('Invalid admin token');
  });

  it('does not throw when token is valid', () => {
    expect(() => requireAdminToken('test-admin-password')).not.toThrow();
  });
});

describe('hashTournamentPassword', () => {
  it('returns a consistent hash for the same password', () => {
    const hash1 = hashTournamentPassword('mypassword');
    const hash2 = hashTournamentPassword('mypassword');
    expect(hash1).toBe(hash2);
  });

  it('returns different hashes for different passwords', () => {
    const hash1 = hashTournamentPassword('password1');
    const hash2 = hashTournamentPassword('password2');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashTournamentPassword('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});

describe('verifyTournamentPassword', () => {
  it('returns true for matching password and hash', () => {
    const password = 'mysecretpassword';
    const hash = hashTournamentPassword(password);
    expect(verifyTournamentPassword(password, hash)).toBe(true);
  });

  it('returns false for non-matching password and hash', () => {
    const hash = hashTournamentPassword('correctpassword');
    expect(verifyTournamentPassword('wrongpassword', hash)).toBe(false);
  });

  it('returns false for empty password against a hash', () => {
    const hash = hashTournamentPassword('somepassword');
    expect(verifyTournamentPassword('', hash)).toBe(false);
  });
});
