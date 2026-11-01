import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Loader2, AlertCircle, CheckCircle, Sparkles, ClipboardPaste } from 'lucide-react';
import {
  importErrorMessage,
  parseListingText,
  type ImportedListingData,
} from '@/lib/listingImport';

export type { ImportedListingData };

interface URLImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Saves the reviewed listing. The dialog awaits it and closes only when it
   * resolves; a rejection keeps the dialog, the pasted text and the reviewed
   * fields, and shows `importErrorMessage`'s text inline (US-253).
   */
  onImport: (listing: ImportedListingData) => Promise<void>;
}

export function URLImportDialog({ open, onOpenChange, onImport }: URLImportDialogProps) {
  const [pastedText, setPastedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ImportedListingData | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleParsePaste = () => {
    if (!pastedText.trim()) {
      setError('Please paste listing details');
      return;
    }
    setError(null);
    setParsedData(parseListingText(pastedText));
    setStep('review');
  };

  /**
   * Awaits the save. This used to call onImport without waiting and close
   * straight away, clearing the pasted text — so when the insert failed (as it
   * did every time, on the generated beds/baths/sqft) the agent got an error
   * toast and nothing to retry with (US-253).
   */
  const handleImport = async () => {
    if (!parsedData || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onImport(parsedData);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(importErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPastedText('');
    setError(null);
    setParsedData(null);
    setStep('input');
  };

  const handleClose = () => {
    // A save in flight finishes or fails with the dialog still open.
    if (saving) return;
    onOpenChange(false);
    reset();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedText(text);
    } catch {
      // Clipboard API may not be available
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Import a Listing
          </DialogTitle>
          <DialogDescription>
            Open the listing on Zillow, Realtor.com, Redfin or your own site, select the page
            (Ctrl+A or Cmd+A), copy it, and paste it below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/*
            There was a "From URL" tab here. It showed a spinner for a second
            and then told the agent to copy and paste instead: nothing fetches
            a listing page, and a browser cannot (US-253). Pasting is the one
            path that works, so it is the only one offered.
          */}
          {step === 'input' && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="url-import-pasted">Paste Listing Details</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteFromClipboard}
                    className="gap-1.5 text-xs"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Paste from Clipboard
                  </Button>
                </div>
                <Textarea
                  id="url-import-pasted"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Paste the listing details here. Our smart parser will extract:
- Address, city, state, zip
- Price, bedrooms, bathrooms
- Square footage, lot size
- MLS number, property type

Example:
$425,000 | 3 bed | 2 bath | 1,800 sqft
123 Oak Street, Springfield, IL 62701
MLS# ML12345
Beautiful ranch home with updated kitchen...`}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Smart parser automatically extracts property details from any format
                </div>
              </div>

              {error && <InlineError message={error} />}
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && parsedData && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  Listing details extracted. Review and edit before importing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={parsedData.address}
                    onChange={(e) => setParsedData({ ...parsedData, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={parsedData.city}
                    onChange={(e) => setParsedData({ ...parsedData, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>State</Label>
                    <Input
                      value={parsedData.state}
                      onChange={(e) => setParsedData({ ...parsedData, state: e.target.value })}
                      maxLength={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Zip</Label>
                    <Input
                      value={parsedData.zip_code}
                      onChange={(e) => setParsedData({ ...parsedData, zip_code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    value={parsedData.price}
                    onChange={(e) => setParsedData({ ...parsedData, price: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select
                    value={parsedData.property_type}
                    onValueChange={(v) => setParsedData({ ...parsedData, property_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={parsedData.bedrooms}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, bedrooms: parseInt(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    step={0.5}
                    value={parsedData.bathrooms}
                    onChange={(e) =>
                      setParsedData({ ...parsedData, bathrooms: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Square Feet</Label>
                  <Input
                    type="number"
                    value={parsedData.square_feet || ''}
                    onChange={(e) =>
                      setParsedData({
                        ...parsedData,
                        square_feet: parseInt(e.target.value) || null,
                      })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>MLS Number</Label>
                  <Input
                    value={parsedData.mls_number}
                    onChange={(e) => setParsedData({ ...parsedData, mls_number: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={parsedData.description}
                    onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {error && <InlineError message={error} />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            disabled={saving}
            onClick={
              step === 'review'
                ? () => {
                    setError(null);
                    setStep('input');
                  }
                : handleClose
            }
          >
            {step === 'review' ? 'Back' : 'Cancel'}
          </Button>
          {step === 'input' && (
            <Button onClick={handleParsePaste} disabled={!pastedText.trim()}>
              <Sparkles className="h-4 w-4 mr-2" /> Extract Details
            </Button>
          )}
          {step === 'review' && (
            <Button onClick={() => void handleImport()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                'Import Listing'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
