/** US-236 (SC 1.4.2): an autoplaying video must start muted. */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoBlock } from './VideoBlock';

const video = (over: Record<string, unknown>) =>
  ({ type: 'video', videoUrl: 'https://www.youtube.com/watch?v=abc123', autoplay: false, muted: false, ...over }) as never;

describe('VideoBlock', () => {
  it('forces mute when autoplay is on, even if "start muted" is off', () => {
    render(<VideoBlock config={video({ autoplay: true, muted: false })} />);
    expect(screen.getByTitle('Video').getAttribute('src')).toContain('autoplay=1&mute=1');
  });

  it('leaves sound alone for a video the visitor starts', () => {
    render(<VideoBlock config={video({ autoplay: false, muted: false })} />);
    expect(screen.getByTitle('Video').getAttribute('src')).toContain('autoplay=0&mute=0');
  });

  it('does the same for Vimeo', () => {
    render(<VideoBlock config={video({ videoUrl: 'https://vimeo.com/12345', autoplay: true })} />);
    expect(screen.getByTitle('Video').getAttribute('src')).toContain('muted=1');
  });
});
