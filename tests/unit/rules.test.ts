import { describe, expect, it } from 'vitest';
import type { Answers, PayeeKind } from '../../src/core/request.ts';
import { matchScripts } from '../../src/core/rules.ts';
import { SCRIPTS } from '../../src/core/scripts.ts';

const none: Answers = { contactedFirst: false, hurry: false, authority: false, secrecy: false };
const ids = (payeeKind: PayeeKind, answers: Partial<Answers> = {}) =>
  matchScripts({ payeeKind, answers: { ...none, ...answers } }).map((s) => s.id);

describe('scam scripts', () => {
  it('names the fake bank adviser for any safe account', () => {
    expect(ids('safe_account')[0]).toBe('safe_account');
    expect(ids('safe_account', { contactedFirst: true, authority: true, hurry: true, secrecy: true })).toEqual([
      'safe_account',
      'impersonation',
      'secrecy',
      'pressure',
    ]);
  });

  it('names impersonation when a caller claims authority', () => {
    expect(ids('business_chosen', { contactedFirst: true, authority: true })).toEqual([
      'impersonation',
      'offer_came_to_you',
    ]);
    expect(ids('known_in_person', { contactedFirst: true, authority: true })).toEqual([]);
  });

  it('always flags new bank details', () => {
    expect(ids('business_new_details')).toEqual(['changed_details']);
  });

  it('names the family emergency message only with contact and pressure', () => {
    expect(ids('known_in_person', { contactedFirst: true, hurry: true })).toEqual(['family_emergency', 'pressure']);
    expect(ids('known_in_person', { contactedFirst: true })).toEqual([]);
  });

  it('flags people known only online', () => {
    expect(ids('online_only')).toEqual(['online_only']);
  });

  it('flags offers that came to the parent', () => {
    expect(ids('business_chosen', { contactedFirst: true })).toEqual(['offer_came_to_you']);
  });

  it('raises nothing for an ordinary payment the parent started', () => {
    expect(ids('business_chosen')).toEqual([]);
    expect(ids('known_in_person')).toEqual([]);
  });

  it('flags secrecy on its own', () => {
    expect(ids('business_chosen', { secrecy: true })).toEqual(['secrecy']);
  });

  it('has unique ids, a question to ask, and families for every named script', () => {
    expect(new Set(SCRIPTS.map((s) => s.id)).size).toBe(SCRIPTS.length);
    for (const s of SCRIPTS) {
      expect(s.ask.length).toBeGreaterThan(0);
      expect(s.named ? s.families.length > 0 : s.families.length === 0).toBe(true);
    }
  });
});
