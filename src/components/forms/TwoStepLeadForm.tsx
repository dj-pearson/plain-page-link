import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, TextareaField } from './FormField';
import { FormPrivacyNotice } from './FormPrivacyNotice';
import { HoneypotField } from './HoneypotField';
import { useSpamGuard } from '@/hooks/useSpamGuard';
import { useFormOpenTracking } from '@/hooks/useFormOpenTracking';
import { enrichLead, submitLead, trackFormSubmission, type LeadType } from '@/lib/leadSubmission';

/**
 * A lead form in two steps (US-228).
 *
 * The buyer, seller and valuation forms each required eight or nine fields —
 * phone, bedrooms, bathrooms, square footage, condition, a reason for selling
 * — before a lead existed. On a phone, from an Instagram bio, most visitors
 * never reached the button. Step one asks for a name and an email or phone
 * (and the address, for a seller or a valuation) and creates the lead. Step two
 * offers the rest as optional and adds it to the same lead.
 */

export interface QualifierField {
  /** Key in the answers bag; see splitFormData for the ones with a column. */
  key: string;
  label: string;
  kind: 'select' | 'text' | 'number' | 'textarea';
  options?: [value: string, label: string][];
  placeholder?: string;
}

interface TwoStepLeadFormProps {
  agentId: string;
  agentName: string;
  leadType: LeadType;
  /** Funnel label, e.g. 'buyer_inquiry'. */
  formType: string;
  icon: ReactNode;
  title: string;
  description: string;
  /** Ask for the property address in step one (seller, valuation). */
  askAddress?: boolean;
  qualifiers: QualifierField[];
  /** Step-one answers to send along, e.g. the listing's address. */
  extraData?: Record<string, unknown>;
  listingId?: string;
  successTitle: string;
  successMessage: string;
  onSuccess?: () => void;
}

const selectClass =
  'w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export function TwoStepLeadForm({
  agentId,
  agentName,
  leadType,
  formType,
  icon,
  title,
  description,
  askAddress = false,
  qualifiers,
  extraData,
  listingId,
  successTitle,
  successMessage,
  onSuccess,
}: TwoStepLeadFormProps) {
  const [step, setStep] = useState<'contact' | 'details' | 'done'>('contact');
  const [contact, setContact] = useState({ name: '', email: '', phone: '', address: '' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lead, setLead] = useState<{ id: string; token: string } | null>(null);
  const { honeypotRef, signals } = useSpamGuard();
  useFormOpenTracking(agentId, formType);

  const finish = () => {
    setStep('done');
    setTimeout(() => onSuccess?.(), 3000);
  };

  const submitContact = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (contact.name.trim().length < 2) next.name = 'Please enter your name';
    const email = contact.email.trim();
    const phone = contact.phone.trim();
    if (!email && !phone) next.email = 'Please give an email or a phone number';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = 'Please enter a valid email address';
    if (phone && phone.replace(/\D/g, '').length < 7) next.phone = 'Please enter a valid phone number';
    if (askAddress && contact.address.trim().length < 5) next.address = 'Please enter the property address';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setSubmitError(null);
    const result = await submitLead({
      spam: signals(),
      agentId,
      leadType,
      name: contact.name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      listingId,
      data: { ...extraData, ...(askAddress ? { address: contact.address.trim() } : {}) },
    });
    setBusy(false);

    if (!result.success) {
      trackFormSubmission(agentId, formType, false);
      setSubmitError(result.error || 'Something went wrong. Please try again.');
      return;
    }
    trackFormSubmission(agentId, formType, true);
    if (result.leadId && result.updateToken && qualifiers.length > 0) {
      setLead({ id: result.leadId, token: result.updateToken });
      setStep('details');
    } else {
      finish();
    }
  };

  const submitDetails = async (e: FormEvent) => {
    e.preventDefault();
    if (!lead) return finish();
    const filled = Object.fromEntries(Object.entries(answers).filter(([, v]) => v.trim() !== ''));
    if (Object.keys(filled).length === 0) return finish();
    setBusy(true);
    const result = await enrichLead(lead.id, lead.token, filled);
    setBusy(false);
    // The lead already exists; a failure here loses only the extras.
    if (!result.success) setSubmitError('We got your details, but not these extras. Your agent will ask.');
    finish();
  };

  if (step === 'done') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4" role="status">
            <CheckCircle className="w-16 h-16 text-green-600" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">{successTitle}</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              {submitError && <p className="text-sm text-green-800 mt-2">{submitError}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {step === 'contact' ? title : `Thanks — ${agentName} has your details`}
        </CardTitle>
        <CardDescription>
          {step === 'contact' ? description : 'A few optional questions help them prepare. Skip any you like.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitError && step === 'contact' && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {step === 'contact' ? (
          <form onSubmit={submitContact} className="relative space-y-4" noValidate>
            <HoneypotField ref={honeypotRef} />
            <FormField
              label="Your Name"
              id={`${formType}-name`}
              autoComplete="name"
              required
              value={contact.name}
              error={errors.name}
              onChange={(e) => setContact({ ...contact, name: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Email"
                id={`${formType}-email`}
                type="email"
                autoComplete="email"
                value={contact.email}
                error={errors.email}
                helperText="Email or phone — whichever you prefer"
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
              <FormField
                label="Phone"
                id={`${formType}-phone`}
                type="tel"
                autoComplete="tel"
                value={contact.phone}
                error={errors.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            {askAddress && (
              <FormField
                label="Property Address"
                id={`${formType}-address`}
                autoComplete="street-address"
                required
                value={contact.address}
                error={errors.address}
                onChange={(e) => setContact({ ...contact, address: e.target.value })}
              />
            )}
            <Button type="submit" className="w-full min-h-[44px]" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Send to {agentName}
            </Button>
            <FormPrivacyNotice />
          </form>
        ) : (
          <form onSubmit={submitDetails} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {qualifiers.map((field) => {
                const id = `${formType}-${field.key}`;
                const value = answers[field.key] ?? '';
                const set = (v: string) => setAnswers({ ...answers, [field.key]: v });
                if (field.kind === 'textarea') {
                  return (
                    <div key={field.key} className="md:col-span-2">
                      <TextareaField
                        label={field.label}
                        id={id}
                        rows={3}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      />
                    </div>
                  );
                }
                if (field.kind === 'select') {
                  return (
                    <div key={field.key} className="space-y-2">
                      <label htmlFor={id} className="text-sm font-medium">
                        {field.label}
                      </label>
                      <select id={id} className={selectClass} value={value} onChange={(e) => set(e.target.value)}>
                        <option value="">—</option>
                        {field.options?.map(([v, label]) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <FormField
                    key={field.key}
                    label={field.label}
                    id={id}
                    type={field.kind === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                );
              })}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="min-h-[44px]" onClick={finish} disabled={busy}>
                Skip
              </Button>
              <Button type="submit" className="min-h-[44px]" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Add these details
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
