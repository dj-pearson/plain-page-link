/**
 * US-238: onboarding threw away everything when the save failed.
 *
 * The page replaced the wizard with a spinner screen while saving. That
 * unmounted the wizard and with it every answer, so a failed save left the
 * agent on step 1 with an empty form and a toast. Step 5 also said "Your
 * Profile is Live!" before anything was saved, and the first listing's city
 * came from splitting a free-text address on commas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const updateProfile = vi.fn();
const listingInsert = vi.fn();
const upload = vi.fn();
const invoke = vi.fn();
const toast = vi.fn();
const renderAppIcons = vi.fn();
const profileUpdate = vi.fn();
const profileUpdateEq = vi.fn();

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1' },
    profile: { full_name: '', username: 'sarah' },
    updateProfile,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast }),
}));

vi.mock('@/lib/edgeFunctions', () => ({
  edgeFunctions: { invoke: (...args: unknown[]) => invoke(...args) },
}));

vi.mock('@/lib/renderAppIcons', () => ({
  renderAppIcons: (...args: unknown[]) => renderAppIcons(...args),
}));

vi.mock('@/lib/signupIntent', () => ({
  readPlanIntent: () => null,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => upload(...args),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
      }),
    },
    from: (table: string) =>
      table === 'profiles'
        ? {
            update: (values: unknown) => {
              profileUpdate(values);
              return { eq: (...args: unknown[]) => profileUpdateEq(...args) };
            },
          }
        : { insert: (...args: unknown[]) => listingInsert(...args) },
  },
}));

import OnboardingWizardPage from './OnboardingWizardPage';

const photo = () => new File(['img'], 'me.png', { type: 'image/png' });

/** Steps 1–3, ending on step 4 (Preview). */
async function fillToPreview(listing: { address: string; city: string; price: string }) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /Luxury/ }));
  await user.click(screen.getByRole('button', { name: /Next/ }));

  await user.upload(document.getElementById('photo-upload') as HTMLInputElement, photo());
  await user.type(screen.getByPlaceholderText('Sarah Johnson'), 'Sarah Johnson');
  await user.type(screen.getByPlaceholderText('Luxury Home Specialist'), 'Realtor');
  await waitFor(() => expect(screen.getByAltText('Preview')).toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /Next/ }));

  await user.type(screen.getByLabelText('Street address'), listing.address);
  await user.type(screen.getByLabelText('City'), listing.city);
  await user.type(screen.getByLabelText('Price'), listing.price);
  await user.click(screen.getByRole('button', { name: /Next/ }));

  expect(screen.getByText('Preview Your Profile')).toBeInTheDocument();
  return user;
}

describe('OnboardingWizardPage', () => {
  beforeEach(() => {
    updateProfile.mockReset();
    listingInsert.mockReset().mockResolvedValue({ error: null });
    upload.mockReset().mockResolvedValue({ error: null });
    invoke.mockReset().mockResolvedValue({});
    toast.mockReset();
    renderAppIcons.mockReset().mockRejectedValue(new Error('This browser cannot draw images'));
    profileUpdate.mockReset();
    profileUpdateEq.mockReset().mockResolvedValue({ error: null });
    window.history.pushState({}, '', '/onboarding/wizard');
  });

  it('keeps the agent on the same step with every field and photo when the save fails', async () => {
    let rejectSave!: (e: Error) => void;
    updateProfile.mockImplementation(() => new Promise<void>((_, reject) => (rejectSave = reject)));

    renderWithProviders(<OnboardingWizardPage />);
    const user = await fillToPreview({ address: '123 Main St', city: 'Austin', price: '$750,000' });

    await user.click(screen.getByRole('button', { name: /Save & publish/ }));

    // Saving overlays the wizard; it does not replace it.
    expect(await screen.findByRole('status')).toHaveTextContent('Setting up your profile');
    expect(screen.getByText('Preview Your Profile')).toBeInTheDocument();

    rejectSave(new Error('network down'));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Your profile was not saved.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    // Same step, same answers, same photo.
    expect(screen.getByText('Preview Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
    expect(screen.queryByText(/Your Profile is Live/)).not.toBeInTheDocument();
    expect(listingInsert).not.toHaveBeenCalled();
    expect(window.location.pathname).toBe('/onboarding/wizard');

    await user.click(screen.getByRole('button', { name: /Back/ }));
    expect(screen.getByLabelText('Street address')).toHaveValue('123 Main St');
    expect(screen.getByLabelText('City')).toHaveValue('Austin');
    expect(screen.getByLabelText('Price')).toHaveValue('$750,000');
  });

  it('says the profile is live only after a retry succeeds, then leaves on Go to Dashboard', async () => {
    updateProfile.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(undefined);

    renderWithProviders(<OnboardingWizardPage />);
    const user = await fillToPreview({ address: '123 Main St', city: 'Austin', price: '$750,000' });

    await user.click(screen.getByRole('button', { name: /Save & publish/ }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /Try again/ }));

    expect(await screen.findByText(/Your Profile is Live/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Link' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Back/ })).toBeDisabled();

    expect(listingInsert).toHaveBeenCalledTimes(1);
    expect(listingInsert.mock.calls[0][0]).toMatchObject({
      user_id: 'user-1',
      address: '123 Main St',
      city: 'Austin',
      price: '$750,000',
    });

    await user.click(screen.getByRole('button', { name: /Go to Dashboard/ }));
    expect(window.location.pathname).toBe('/dashboard');
  });

  // US-616: invoke returns { error } rather than throwing, so a failed welcome
  // email used to be silent while the toast sent the agent to their inbox.
  it.each([
    [{ data: { message: 'sent' }, error: null }, /We emailed you/],
    [
      { data: null, error: new Error('The welcome email could not be sent') },
      /Your dashboard shows/,
    ],
  ])(
    'tells the agent about the welcome email only when it was sent (%#)',
    async (result, description) => {
      invoke.mockResolvedValue(result);
      updateProfile.mockResolvedValueOnce(undefined);

      renderWithProviders(<OnboardingWizardPage />);
      const user = await fillToPreview({
        address: '123 Main St',
        city: 'Austin',
        price: '$750,000',
      });
      await user.click(screen.getByRole('button', { name: /Save & publish/ }));
      await screen.findByText(/Your Profile is Live/);

      expect(invoke).toHaveBeenCalledWith('send-welcome-email', {});
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Welcome to AgentBio',
          description: expect.stringMatching(description),
        })
      );
    }
  );

  it('will not leave step 3 with a listing that has no city', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizardPage />);
    await user.click(screen.getByRole('button', { name: /Luxury/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.type(screen.getByPlaceholderText('Sarah Johnson'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Luxury Home Specialist'), 'Realtor');
    await user.click(screen.getByRole('button', { name: /Next/ }));

    await user.type(screen.getByLabelText('Street address'), '123 Main St');
    await user.type(screen.getByLabelText('Price'), '$750,000');
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
    expect(screen.getByText(/fill in the street address, city and price/)).toBeInTheDocument();

    // Skip Setup with the half-filled listing saves the profile but no listing.
    updateProfile.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole('button', { name: 'Skip Setup' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(listingInsert).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Your first listing was not saved' })
    );
  });

  // US-493: the onboarding photo is most agents' first, and it used to get no
  // home-screen icons, so their installed page showed the AgentBio logo.
  it('stores the home-screen icons named after the onboarding photo, before saving the profile', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const icon192 = new Blob(['192'], { type: 'image/png' });
    const icon512 = new Blob(['512'], { type: 'image/png' });
    renderAppIcons.mockResolvedValue(
      new Map([
        [192, icon192],
        [512, icon512],
      ])
    );
    updateProfile.mockResolvedValueOnce(undefined);

    renderWithProviders(<OnboardingWizardPage />);
    const user = await fillToPreview({ address: '123 Main St', city: 'Austin', price: '$750,000' });
    await user.click(screen.getByRole('button', { name: /Save & publish/ }));
    expect(await screen.findByText(/Your Profile is Live/)).toBeInTheDocument();

    expect(upload.mock.calls.map((c) => c[0])).toEqual([
      'user-1/avatar-1700000000000.png',
      'user-1/avatar-1700000000000-app-icon-192.png',
      'user-1/avatar-1700000000000-app-icon-512.png',
    ]);
    expect(upload.mock.calls[1][1]).toBe(icon192);
    expect(upload.mock.calls[2][1]).toBe(icon512);
    expect(upload.mock.calls[2][2]).toMatchObject({ contentType: 'image/png', upsert: true });
    // The icons are in place before avatar_url points at the photo.
    expect(upload.mock.invocationCallOrder[2]).toBeLessThan(
      updateProfile.mock.invocationCallOrder[0]
    );
    expect(updateProfile.mock.calls[0][0]).toMatchObject({
      avatar_url: 'https://cdn.test/user-1/avatar-1700000000000.png',
    });
    vi.mocked(Date.now).mockRestore();
  });

  it('still saves the onboarding photo when its icons cannot be rendered or stored', async () => {
    // beforeEach: renderAppIcons rejects, as on a browser that cannot draw it.
    updateProfile.mockResolvedValueOnce(undefined);

    renderWithProviders(<OnboardingWizardPage />);
    const user = await fillToPreview({ address: '123 Main St', city: 'Austin', price: '$750,000' });
    await user.click(screen.getByRole('button', { name: /Save & publish/ }));
    expect(await screen.findByText(/Your Profile is Live/)).toBeInTheDocument();

    expect(upload).toHaveBeenCalledTimes(1);
    expect(updateProfile.mock.calls[0][0].avatar_url).toMatch(
      /^https:\/\/cdn\.test\/user-1\/avatar-\d+\.png$/
    );
    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Profile photo upload failed' })
    );
  });

  it('still saves the onboarding photo when an icon upload fails', async () => {
    renderAppIcons.mockResolvedValue(new Map([[192, new Blob(['192'], { type: 'image/png' })]]));
    upload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('storage quota') });
    updateProfile.mockResolvedValueOnce(undefined);

    renderWithProviders(<OnboardingWizardPage />);
    const user = await fillToPreview({ address: '123 Main St', city: 'Austin', price: '$750,000' });
    await user.click(screen.getByRole('button', { name: /Save & publish/ }));
    expect(await screen.findByText(/Your Profile is Live/)).toBeInTheDocument();

    expect(upload).toHaveBeenCalledTimes(2);
    expect(updateProfile.mock.calls[0][0].avatar_url).toMatch(/avatar-\d+\.png$/);
    expect(toast).not.toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Profile photo upload failed' })
    );
  });

  // US-446: agents who never opened Settings stayed on the UTC edition of the
  // morning email. Onboarding offers the zone and writes it on its own.
  it('saves the time zone chosen in onboarding in its own update', async () => {
    updateProfile.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizardPage />);
    await user.click(screen.getByRole('button', { name: /Luxury/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.type(screen.getByPlaceholderText('Sarah Johnson'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Luxury Home Specialist'), 'Realtor');
    await user.selectOptions(screen.getByLabelText('Time zone'), 'America/Chicago');

    await user.click(screen.getByRole('button', { name: 'Skip Setup' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));

    // Never part of the main profile update: a zone the database refuses must
    // not cost the agent onboarding_completed_at (US-108).
    expect(updateProfile.mock.calls[0][0]).not.toHaveProperty('timezone');
    expect(profileUpdate).toHaveBeenCalledWith({ timezone: 'America/Chicago' });
    expect(profileUpdateEq).toHaveBeenCalledWith('id', 'user-1');
    expect(updateProfile.mock.invocationCallOrder[0]).toBeLessThan(
      profileUpdate.mock.invocationCallOrder[0]
    );
  });

  it('finishes onboarding and says so when the database refuses the time zone', async () => {
    updateProfile.mockResolvedValueOnce(undefined);
    profileUpdateEq.mockResolvedValueOnce({
      error: { code: '23514', message: 'That is not a time zone we recognise.' },
    });
    const user = userEvent.setup();
    renderWithProviders(<OnboardingWizardPage />);
    await user.click(screen.getByRole('button', { name: /Luxury/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.type(screen.getByPlaceholderText('Sarah Johnson'), 'Sarah Johnson');
    await user.type(screen.getByPlaceholderText('Luxury Home Specialist'), 'Realtor');
    await user.selectOptions(screen.getByLabelText('Time zone'), 'Europe/London');

    await user.click(screen.getByRole('button', { name: 'Skip Setup' }));
    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));

    expect(updateProfile.mock.calls[0][0]).toHaveProperty('onboarding_completed_at');
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Your time zone was not saved' })
    );
  });
});
