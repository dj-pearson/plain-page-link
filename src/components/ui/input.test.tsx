import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { Input } from './input';

describe('Input', () => {
  it('renders and accepts typed input', async () => {
    renderWithProviders(<Input aria-label="Email" placeholder="email" />);
    const input = screen.getByLabelText('Email');
    await userEvent.type(input, 'hello@example.com');
    expect(input).toHaveValue('hello@example.com');
  });

  it('sets aria-invalid when in error state', () => {
    renderWithProviders(<Input aria-label="Name" error />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('wires aria-describedby to the errorId', () => {
    renderWithProviders(<Input aria-label="Pwd" errorId="pwd-error" />);
    expect(screen.getByLabelText('Pwd')).toHaveAttribute('aria-describedby', 'pwd-error');
  });

  it('respects the disabled attribute', () => {
    renderWithProviders(<Input aria-label="Locked" disabled />);
    expect(screen.getByLabelText('Locked')).toBeDisabled();
  });

  it('forwards the type attribute', () => {
    renderWithProviders(<Input aria-label="Pass" type="password" />);
    expect(screen.getByLabelText('Pass')).toHaveAttribute('type', 'password');
  });
});
