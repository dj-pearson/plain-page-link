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
