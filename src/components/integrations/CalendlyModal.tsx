import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendlyEmbed } from './CalendlyEmbed';
import { buildCalendlyUrl, isCalendlyBooking } from '@/lib/calendly';
import { getLeadAttribution } from '@/lib/attribution';
import { submitLead } from '@/lib/leadSubmission';
import { useSpamGuard } from '@/hooks/useSpamGuard';
import { HoneypotField } from '@/components/forms/HoneypotField';
import { logger } from '@/lib/logger';

/**
 * Schedule a showing through the agent's Calendly (US-221).
 *
 * A booking made inside Calendly's iframe used to leave nothing in the
 * agent's CRM: no lead, no listing, no campaign, no notification — the most
 * valuable conversion on the page was invisible. Calendly's postMessage says
 * that a booking happened but not who made it, so the visitor gives their name
 * and email first (two fields, then prefilled into Calendly so they are not
 * typed twice), and the lead is recorded when Calendly reports the booking.
 */
interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendlyUrl: string;
  /** The agent (profiles.id) the lead belongs to. */
  agentId: string;
  title?: string;
  subtitle?: string;
  listingAddress?: string;
  listingId?: string;
}

export function CalendlyModal({
  isOpen,
  onClose,
  calendlyUrl,
  agentId,
  title = 'Schedule a Showing',
  subtitle = 'Choose a time that works for you',
  listingAddress,
  listingId,
}: CalendlyModalProps) {
  const [visitor, setVisitor] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [booked, setBooked] = useState(false);
  const recorded = useRef(false);
  const { honeypotRef, signals } = useSpamGuard();

  // A fresh start each time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setVisitor(null);
      setBooked(false);
      recorded.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !visitor) return;
    const onMessage = (event: MessageEvent) => {
      if (!isCalendlyBooking(event) || recorded.current) return;
      recorded.current = true;
      setBooked(true);
      void submitLead({
        agentId,
        leadType: listingId ? 'buyer' : 'contact',
        name: visitor.name,
        email: visitor.email,
        listingId,
        source: 'calendly_showing',
        data: {
          message: listingAddress
            ? `Booked a showing of ${listingAddress} through Calendly.`
            : 'Booked a meeting through Calendly.',
          ...(listingAddress ? { address: listingAddress } : {}),
        },
        spam: signals(),
      }).then((result) => {
        if (!result.success) logger.error('Calendly booking lead was not recorded', new Error(result.error));
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isOpen, visitor, agentId, listingId, listingAddress, signals]);

  const handleDetails = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return;
    setVisitor({ name: name.trim(), email: email.trim() });
  };

  const attribution = getLeadAttribution();
  const url = visitor
    ? buildCalendlyUrl(calendlyUrl, {
        name: visitor.name,
        email: visitor.email,
        listingAddress,
        utm: attribution,
      })
    : calendlyUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold mb-1">{title}</DialogTitle>
          <DialogDescription>{booked ? "You're booked — a confirmation is on its way." : subtitle}</DialogDescription>
          {listingAddress && <p className="text-sm text-primary font-medium mt-2">Property: {listingAddress}</p>}
        </DialogHeader>

        {visitor ? (
          <div className="overflow-y-auto" style={{ height: '650px' }}>
            <CalendlyEmbed url={url} minHeight="650px" />
          </div>
        ) : (
          <form onSubmit={handleDetails} className="relative space-y-4 p-6">
            <HoneypotField ref={honeypotRef} />
            <p className="text-sm text-muted-foreground">
              Who is the showing for? We&apos;ll fill these in on the calendar for you.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="calendly-name">Name</Label>
              <Input
                id="calendly-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calendly-email">Email</Label>
              <Input
                id="calendly-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full min-h-[44px]">
              Pick a time
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
