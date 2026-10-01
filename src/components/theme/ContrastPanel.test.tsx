import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { ContrastPanel } from './ContrastPanel';
import { themeContrastChecks } from '@/lib/themeContrast';

const colors = { primary: '#2563eb', secondary: '#059669', accent: '#b45309', background: '#ffffff', foreground: '#cccccc' };

describe('ContrastPanel (US-234)', () => {
  it('says a pair fails in words, and its fix applies the suggested colour', async () => {
    const onFix = vi.fn();
    renderWithProviders(<ContrastPanel checks={themeContrastChecks(colors)} onFix={onFix} onFixAll={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('1 colour pair is too low to save.');
    expect(screen.getByText('Too low')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /nearest passing colour for text on background/i }));
    expect(onFix).toHaveBeenCalledWith('foreground', expect.stringMatching(/^#[0-9a-f]{6}$/));
  });

  it('reports a readable theme as readable, with no fix buttons', () => {
    renderWithProviders(
      <ContrastPanel checks={themeContrastChecks({ ...colors, foreground: '#1f2937' })} onFix={vi.fn()} onFixAll={vi.fn()} />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Every colour pair is readable.');
    expect(screen.queryByRole('button')).toBeNull();
  });
});
