import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Add-ons on the roadmap, with a way to say "I'd use this" (US-224).
 *
 * The pricing page used to list these with prices as if they could be bought.
 * A press inserts a feature_waitlist row, which the operator reads to decide
 * what to build first. Remembered per browser so the button does not invite
 * pressing twice.
 */
const ADD_ONS = [
  { key: 'mls_integration', name: 'MLS sync', blurb: 'Listings that update from your MLS' },
  { key: 'crm_connectors', name: 'CRM connectors', blurb: 'Send leads to Follow Up Boss and others' },
  { key: 'sms_notifications', name: 'SMS alerts', blurb: 'A text the moment a lead arrives' },
  { key: 'premium_themes', name: 'Premium themes', blurb: 'More looks for your page' },
] as const;

type AddOnKey = (typeof ADD_ONS)[number]['key'];

const STORAGE_KEY = 'agentbio:addon-interest';

function readRegistered(): AddOnKey[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AddOnKey[];
  } catch {
    return [];
  }
}

export function AddOnWaitlist() {
  const [registered, setRegistered] = useState<AddOnKey[]>(readRegistered);
  const [pending, setPending] = useState<AddOnKey | null>(null);

  const register = async (feature: AddOnKey) => {
    setPending(feature);
    const { error } = await supabase.from('feature_waitlist').insert({ feature });
    setPending(null);
    if (error) {
      logger.error('Could not record add-on interest', error);
      return;
    }
    const next = [...registered, feature];
    setRegistered(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the row is recorded, the button just forgets */
    }
  };

  return (
    <div className="mt-16 text-center">
      <h3 className="text-2xl font-bold mb-2">On the roadmap</h3>
      <p className="text-muted-foreground mb-6">Not available yet. Tell us which you would use and we&apos;ll build those first.</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {ADD_ONS.map((addOn) => {
          const done = registered.includes(addOn.key);
          return (
            <Card key={addOn.key} className="p-4 flex flex-col gap-3 text-left">
              <div>
                <p className="font-semibold">{addOn.name}</p>
                <p className="text-sm text-muted-foreground">{addOn.blurb}</p>
              </div>
              <Button
                variant={done ? 'secondary' : 'outline'}
                size="sm"
                className="mt-auto min-h-[44px]"
                disabled={done || pending === addOn.key}
                onClick={() => register(addOn.key)}
              >
                {done ? (
                  <>
                    <Check className="mr-1 h-4 w-4" aria-hidden="true" /> We&apos;ll let you know
                  </>
                ) : (
                  'Notify me'
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
