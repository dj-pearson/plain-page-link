/**
 * US-244: a lazily loaded profile modal shows something while its chunk loads
 * and offers a way out if it fails, instead of a blank pause on the first tap
 * or LazyLoadErrorBoundary's full-screen error replacing the whole profile.
 */
import { describe, it, expect, vi } from 'vitest';
import { lazy } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LazyModal } from './LazyModal';

describe('LazyModal', () => {
  it('shows a loading overlay until the chunk arrives', async () => {
    let resolve: ((m: { default: () => JSX.Element }) => void) | undefined;
    const Modal = lazy(
      () =>
        new Promise<{ default: () => JSX.Element }>((r) => {
          resolve = r;
        })
    );
    render(
      <LazyModal onClose={vi.fn()}>
        <Modal />
      </LazyModal>
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    resolve?.({ default: () => <div>the form</div> });
    expect(await screen.findByText('the form')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers Close when the chunk fails to load, without taking over the page', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onClose = vi.fn();
    const Broken = lazy(() =>
      Promise.reject(new TypeError('Failed to fetch dynamically imported module'))
    );
    render(
      <LazyModal onClose={onClose}>
        <Broken />
      </LazyModal>
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not be loaded/i);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
