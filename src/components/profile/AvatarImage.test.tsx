import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AvatarImage } from './AvatarImage';
import ProfileHeader from './ProfileHeader';
import type { PublicProfile } from '@/types/profile';

const DIR = 'https://example.supabase.co/storage/v1/object/public/avatars/u1/';

describe('AvatarImage (US-604)', () => {
  it('draws the 256px companion of a -full photo', () => {
    render(<AvatarImage url={`${DIR}avatar-1-full.jpg`} alt="Jane" />);
    expect(screen.getByAltText('Jane').getAttribute('src')).toBe(`${DIR}avatar-1-256.webp`);
  });

  it('falls back to the photo when the companion fails to load', () => {
    render(<AvatarImage url={`${DIR}avatar-1-full.jpg`} alt="Jane" />);
    const img = screen.getByAltText('Jane');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe(`${DIR}avatar-1-full.jpg`);
  });

  it('draws an older upload as stored, with no request for a companion', () => {
    render(<AvatarImage url={`${DIR}avatar-1.jpg`} alt="Jane" />);
    expect(screen.getByAltText('Jane').getAttribute('src')).toBe(`${DIR}avatar-1.jpg`);
  });

  it('ProfileHeader uses it for the circle above the fold', () => {
    const profile = {
      username: 'jane',
      full_name: 'Jane Doe',
      avatar_url: `${DIR}avatar-1-full.jpg`,
    } as unknown as PublicProfile;
    render(<ProfileHeader profile={profile} />);
    expect(screen.getByAltText('Jane Doe').getAttribute('src')).toBe(`${DIR}avatar-1-256.webp`);
  });
});

/**
 * US-643: an agent's headshot is drawn through AvatarImage wherever it is
 * rendered, so every small circle gets the 256px companion instead of the
 * up-to-800px photo. A raw `src={...avatar_url}` (or the open-house RPC's
 * agentAvatar) on an <img> or on the ui/avatar primitive bypasses that.
 */
describe('agent avatars go through AvatarImage (US-643)', () => {
  const SRC = resolve(__dirname, '..', '..');
  const RAW_AVATAR_SRC = /\bsrc=\{[^}]*\b(avatar_url|agentAvatar)\b[^}]*\}/g;

  function sources(path: string): string[] {
    if (statSync(path).isDirectory()) {
      return readdirSync(path).flatMap((entry) => sources(join(path, entry)));
    }
    return path.endsWith('.tsx') && !/\.test\.tsx$/.test(path) ? [path] : [];
  }

  it('flags a raw avatar src', () => {
    expect('<img src={profile.avatar_url} />'.match(RAW_AVATAR_SRC)).toHaveLength(1);
    expect('<img src={openHouse.agentAvatar} />'.match(RAW_AVATAR_SRC)).toHaveLength(1);
    expect('<AvatarImage url={profile.avatar_url} />'.match(RAW_AVATAR_SRC)).toBeNull();
  });

  it('no component renders avatar_url as a raw src', () => {
    const offenders = sources(SRC).flatMap((file) =>
      (readFileSync(file, 'utf8').match(RAW_AVATAR_SRC) ?? []).map(
        (m) => `${relative(SRC, file)}: ${m}`
      )
    );
    expect(offenders).toEqual([]);
  });
});
