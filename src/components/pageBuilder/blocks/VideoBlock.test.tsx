/**
 * US-236 (SC 1.4.2): an autoplaying video must start muted.
 * US-237 (SC 1.2.2, 4.1.2): captions, transcripts and a named frame.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoBlock } from './VideoBlock';

const video = (over: Record<string, unknown>) =>
  ({ type: 'video', videoUrl: 'https://www.youtube.com/watch?v=abc123', autoplay: false, muted: false, ...over }) as never;

const frame = () => document.querySelector('iframe')!;

describe('VideoBlock sound (US-236)', () => {
  it('forces mute when autoplay is on, even if "start muted" is off', () => {
    render(<VideoBlock config={video({ autoplay: true, muted: false })} />);
    expect(frame().getAttribute('src')).toContain('autoplay=1&mute=1');
  });

  it('leaves sound alone for a video the visitor starts', () => {
    render(<VideoBlock config={video({ autoplay: false, muted: false })} />);
    expect(frame().getAttribute('src')).toContain('autoplay=0&mute=0');
  });

  it('does the same for Vimeo', () => {
    render(<VideoBlock config={video({ videoUrl: 'https://vimeo.com/12345', autoplay: true })} />);
    expect(frame().getAttribute('src')).toContain('muted=1');
  });
});

describe('VideoBlock captions and transcript (US-237)', () => {
  it('YouTube turns captions on and the frame is named by the block title', () => {
    render(<VideoBlock config={video({ title: 'Meet your agent' })} />);
    expect(frame().getAttribute('src')).toContain('cc_load_policy=1');
    expect(frame()).toHaveAttribute('title', 'Video: Meet your agent');
  });

  it('an untitled embed says where it is from, not just "Video"', () => {
    render(<VideoBlock config={video({ videoUrl: 'https://vimeo.com/12345' })} />);
    expect(frame()).toHaveAttribute('title', 'Vimeo video');
  });

  it('a direct file is a native <video> with a default captions track', () => {
    const { container } = render(
      <VideoBlock
        config={video({
          videoUrl: 'https://cdn.example.test/tour.mp4',
          captionsUrl: 'https://cdn.example.test/tour.vtt',
          title: 'Home tour',
        })}
      />
    );
    expect(container.querySelector('iframe')).toBeNull();
    const el = container.querySelector('video')!;
    expect(el).toHaveAttribute('controls');
    expect(el).toHaveAttribute('aria-label', 'Home tour');
    const track = el.querySelector('track')!;
    expect(track).toHaveAttribute('kind', 'captions');
    expect(track).toHaveAttribute('src', 'https://cdn.example.test/tour.vtt');
    expect(track).toHaveAttribute('default');
  });

  it('a javascript: captions URL is dropped', () => {
    const { container } = render(
      <VideoBlock config={video({ videoUrl: 'https://cdn.example.test/tour.mp4', captionsUrl: 'javascript:alert(1)' })} />
    );
    expect(container.querySelector('track')).toBeNull();
  });

  it('a transcript sits behind a "Show transcript" disclosure', async () => {
    render(<VideoBlock config={video({ transcript: 'Hi, I am Dana. Welcome to 12 Oak Lane.' })} />);
    const summary = screen.getByText('Show transcript');
    expect(summary.tagName).toBe('SUMMARY');
    await userEvent.click(summary);
    expect(summary.closest('details')).toHaveAttribute('open');
    expect(screen.getByText(/Welcome to 12 Oak Lane/)).toBeVisible();
  });

  it('in the editor, prompts for captions or a transcript when there are neither', () => {
    const { rerender } = render(<VideoBlock config={video({})} isEditing />);
    expect(screen.getByText(/Add captions or a transcript/)).toBeInTheDocument();
    rerender(<VideoBlock config={video({ transcript: 'Words' })} isEditing />);
    expect(screen.queryByText(/Add captions or a transcript/)).toBeNull();
  });
});
