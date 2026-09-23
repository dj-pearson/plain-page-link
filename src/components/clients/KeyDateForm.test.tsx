/**
 * Plenty of agents know a client's daughter's birthday is March 14th without
 * knowing the year. Those are stored as 2000-03-14 with year_known = false, so
 * the dashboard says "Birthday" rather than "turns 26".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { addKeyDate, updateKeyDate } = vi.hoisted(() => ({
  addKeyDate: { mutateAsync: vi.fn(), isPending: false },
  updateKeyDate: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock('@/hooks/useContacts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useContacts')>('@/hooks/useContacts');
  return {
    ...actual,
    useKeyDates: () => ({
      keyDates: [],
      isLoading: false,
      addKeyDate,
      updateKeyDate,
      deleteKeyDate: { mutateAsync: vi.fn(), isPending: false },
    }),
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { KeyDateForm, toStoredEventDate } from './KeyDateForm';

describe('KeyDateForm', () => {
  beforeEach(() => {
    addKeyDate.mutateAsync.mockReset().mockResolvedValue(undefined);
    updateKeyDate.mutateAsync.mockReset().mockResolvedValue(undefined);
  });

  it('keeps month and day under year 2000 when the year is unknown', () => {
    expect(toStoredEventDate('2019-03-14', false)).toBe('2000-03-14');
    expect(toStoredEventDate('2024-02-29', false)).toBe('2000-02-29');
    expect(toStoredEventDate('1988-03-14', true)).toBe('1988-03-14');
    expect(toStoredEventDate('', true)).toBeNull();
  });

  it('saves an unknown-year birthday with year 2000 and year_known=false', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderWithProviders(
      <KeyDateForm contactId="contact-1" householdNames={['Emma']} onDone={onDone} />
    );

    // Birthday is the default kind, and suggests its own label.
    expect(screen.getByLabelText('Label')).toHaveValue('Birthday');
    expect(screen.getByLabelText('Repeats every year')).toBeChecked();

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-03-14' } });
    await user.click(screen.getByLabelText("I don't know the year"));
    await user.click(screen.getByRole('button', { name: 'Add date' }));

    expect(addKeyDate.mutateAsync).toHaveBeenCalledTimes(1);
    expect(addKeyDate.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_id: 'contact-1',
        kind: 'birthday',
        label: 'Birthday',
        person_name: null,
        event_date: '2000-03-14',
        year_known: false,
        recurs_annually: true,
        remind_days_before: 7,
      })
    );
    expect(onDone).toHaveBeenCalled();
  });

  it('stores the real year when it is known', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyDateForm contactId="contact-1" householdNames={[]} onDone={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '1988-03-14' } });
    await user.click(screen.getByRole('button', { name: 'Add date' }));

    expect(addKeyDate.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ event_date: '1988-03-14', year_known: true })
    );
  });

  it('does not save without a date', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KeyDateForm contactId="contact-1" householdNames={[]} onDone={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add date' }));

    expect(addKeyDate.mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a date.');
  });
});
