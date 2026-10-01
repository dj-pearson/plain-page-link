import { useRef, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, TextareaField } from '@/components/forms/FormField';
import { HoneypotField } from '@/components/forms/HoneypotField';
import { useSpamGuard } from '@/hooks/useSpamGuard';
import { callEdgeFunction } from '@/lib/edgeFunctions';

/**
 * Report an accessibility barrier without an email client or an account
 * (US-239). Posts to the accessibility-feedback edge function, which mails
 * accessibility@agentbio.net with the reporter as Reply-To.
 */
export function AccessibilityFeedbackForm() {
  const [values, setValues] = useState({ name: '', email: '', pageUrl: '', assistiveTech: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [announcement, setAnnouncement] = useState('');
  const { honeypotRef, signals } = useSpamGuard();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (values.message.trim().length < 10) next.message = 'Please describe the problem in a sentence or two.';
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Please enter a valid email address, or leave it blank.';
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.message) return messageRef.current?.focus();

    setStatus('sending');
    try {
      await callEdgeFunction('accessibility-feedback', { body: { ...values, ...signals() } });
      setStatus('sent');
      setAnnouncement('Thank you. Your report was sent. We aim to reply within 5 business days.');
      setValues({ name: '', email: '', pageUrl: '', assistiveTech: '', message: '' });
    } catch {
      setStatus('failed');
      setAnnouncement('Your report could not be sent. Please email accessibility@agentbio.net.');
    }
  };

  return (
    <form onSubmit={submit} noValidate className="not-prose relative mt-6 space-y-4 rounded-xl border p-5" aria-labelledby="a11y-form-heading">
      <h3 id="a11y-form-heading" className="text-lg font-semibold">
        Accessibility feedback form
      </h3>
      <HoneypotField ref={honeypotRef} />
      <TextareaField
        ref={messageRef}
        id="a11y-message"
        label="What happened?"
        required
        rows={5}
        value={values.message}
        onChange={set('message')}
        error={errors.message}
        helperText="For example: which page, what you tried to do, and what got in the way."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="a11y-name" label="Your name (optional)" autoComplete="name" value={values.name} onChange={set('name')} />
        <FormField
          ref={emailRef}
          id="a11y-email"
          type="email"
          label="Email, if you would like a reply"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
        <FormField id="a11y-page" label="Page address (optional)" value={values.pageUrl} onChange={set('pageUrl')} />
        <FormField
          id="a11y-at"
          label="Device or assistive technology (optional)"
          value={values.assistiveTech}
          onChange={set('assistiveTech')}
          placeholder="e.g. iPhone with VoiceOver"
        />
      </div>
      <Button type="submit" disabled={status === 'sending'} className="min-h-[44px]">
        {status === 'sending' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
        Send report
      </Button>
      <p role="status" aria-live="polite" className="text-sm">
        {announcement}
      </p>
    </form>
  );
}
