import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its content', () => {
    renderWithProviders(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies the default variant styling', () => {
    renderWithProviders(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-gray-900');
  });

  it('applies the destructive variant styling', () => {
    renderWithProviders(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-red-500');
  });

  it('merges custom className', () => {
    renderWithProviders(<Badge className="custom-class">Tag</Badge>);
    expect(screen.getByText('Tag').className).toContain('custom-class');
  });
});
