import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';

const Example = () => (
  <Dialog>
    <DialogTrigger>Open dialog</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm action</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

describe('Dialog', () => {
  it('is closed by default', () => {
    renderWithProviders(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens when the trigger is clicked', async () => {
    renderWithProviders(<Example />);
    await userEvent.click(screen.getByText('Open dialog'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('exposes an accessible name and description', async () => {
    renderWithProviders(<Example />);
    await userEvent.click(screen.getByText('Open dialog'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Confirm action');
  });
});
