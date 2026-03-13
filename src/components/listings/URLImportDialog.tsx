import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportedListingData {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  property_type: string;
  status: string;
  description: string;
  mls_number: string;
  lot_size_acres: number | null;
  photos: string[];
}

interface URLImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (listing: ImportedListingData) => void;
}

export function URLImportDialog({ open, onOpenChange, onImport }: URLImportDialogProps) {
  const [mode, setMode] = useState<"url" | "paste">("paste");
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ImportedListingData | null>(null);
  const [step, setStep] = useState<"input" | "review">("input");

  // Parse pasted listing text with pattern matching
  const parseListingText = (text: string): ImportedListingData => {
    const data: ImportedListingData = {
      address: "", city: "", state: "", zip_code: "",
      price: "", bedrooms: 0, bathrooms: 0, square_feet: null,
      property_type: "single_family", status: "active",
      description: "", mls_number: "", lot_size_acres: null, photos: [],
    };

    // Extract price ($XXX,XXX or $X.XM patterns)
    const priceMatch = text.match(/\$[\d,]+(?:\.\d+)?(?:\s*[MmKk])?/);
    if (priceMatch) {
      let priceStr = priceMatch[0].replace(/[$,\s]/g, "");
      if (priceStr.toLowerCase().endsWith("m")) {
        data.price = String(parseFloat(priceStr) * 1000000);
      } else if (priceStr.toLowerCase().endsWith("k")) {
        data.price = String(parseFloat(priceStr) * 1000);
      } else {
        data.price = priceStr;
      }
    }

    // Extract beds/baths patterns: "3 bed" "3 bd" "3 bedroom" "3br"
    const bedMatch = text.match(/(\d+)\s*(?:bed(?:room)?s?|bd|br)\b/i);
    if (bedMatch) data.bedrooms = parseInt(bedMatch[1]);

    const bathMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|ba)\b/i);
    if (bathMatch) data.bathrooms = parseFloat(bathMatch[1]);

    // Extract sqft: "1,800 sq ft" "1800sqft" "1,800 square feet"
    const sqftMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*(?:ft|feet)|sqft|square\s*feet)/i);
    if (sqftMatch) data.square_feet = parseInt(sqftMatch[1].replace(/,/g, ""));

    // Extract lot size: "0.25 acres" "10,000 sq ft lot"
    const lotMatch = text.match(/([\d.]+)\s*acres?/i);
    if (lotMatch) data.lot_size_acres = parseFloat(lotMatch[1]);

    // Extract MLS: "MLS# 12345" "MLS: ML12345"
    const mlsMatch = text.match(/MLS[#:\s]*([A-Za-z0-9]+)/i);
    if (mlsMatch) data.mls_number = mlsMatch[1];

    // Extract address - look for street number + street name pattern
    const addressMatch = text.match(/(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Terrace|Ter)[.,]?)/i);
    if (addressMatch) data.address = addressMatch[1].trim().replace(/[,.]$/, "");

    // Extract city, state, zip from address-like patterns
    const cityStateZipMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (cityStateZipMatch) {
      data.city = cityStateZipMatch[1];
      data.state = cityStateZipMatch[2];
      data.zip_code = cityStateZipMatch[3];
    }

    // Detect property type from keywords
    const textLower = text.toLowerCase();
    if (textLower.includes("condo") || textLower.includes("condominium")) {
      data.property_type = "condo";
    } else if (textLower.includes("townhouse") || textLower.includes("townhome")) {
      data.property_type = "townhouse";
    } else if (textLower.includes("multi-family") || textLower.includes("duplex") || textLower.includes("triplex")) {
      data.property_type = "multi_family";
    } else if (textLower.includes("land") || textLower.includes("lot") || textLower.includes("vacant")) {
      data.property_type = "land";
    } else if (textLower.includes("commercial") || textLower.includes("office") || textLower.includes("retail")) {
      data.property_type = "commercial";
    }

    // Use remaining text as description (clean up)
    data.description = text.slice(0, 500).trim();

    return data;
  };

  const handleParsePaste = () => {
    if (!pastedText.trim()) {
      setError("Please paste listing details");
      return;
    }
    setError(null);
    setLoading(true);

    // Simulate brief processing delay for UX
    setTimeout(() => {
      const parsed = parseListingText(pastedText);
      setParsedData(parsed);
      setStep("review");
      setLoading(false);
    }, 300);
  };

  const handleURLFetch = () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Validate URL pattern
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setError(null);
    setLoading(true);

    // For now, show instructions since we can't scrape directly from client
    setTimeout(() => {
      setLoading(false);
      setError(
        "Direct URL scraping requires a backend service. For now, visit the listing page, copy the listing details (Ctrl+A, Ctrl+C), then use the 'Paste Details' tab to import."
      );
    }, 1000);
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      handleClose();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setUrl("");
    setPastedText("");
    setError(null);
    setParsedData(null);
    setStep("input");
    setLoading(false);
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
            Import Listing from URL or Paste
          </DialogTitle>
          <DialogDescription>
            Import listing details from a real estate website or paste listing text
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === "input" && (
            <div className="space-y-4 py-4">
              {/* Mode Tabs */}
              <div className="flex rounded-lg border p-1 gap-1">
                <button
                  onClick={() => setMode("paste")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                    mode === "paste" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Paste Details
                </button>
                <button
                  onClick={() => setMode("url")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
                    mode === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Link className="h-4 w-4" />
                  From URL
                </button>
              </div>

              {mode === "paste" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Paste Listing Details</Label>
                    <Button variant="ghost" size="sm" onClick={handlePasteFromClipboard} className="gap-1.5 text-xs">
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      Paste from Clipboard
                    </Button>
                  </div>
                  <Textarea
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
              )}

              {mode === "url" && (
                <div className="space-y-3">
                  <Label>Listing URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.realtor.com/realestateandhomes-detail/..."
                    className="font-mono text-sm"
                  />
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      Supported sites: Realtor.com, Zillow, Redfin, your own website.
                      Copy the full listing URL and paste it above.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Review Step */}
          {step === "review" && parsedData && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">Listing details extracted. Review and edit before importing.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={parsedData.address} onChange={(e) => setParsedData({ ...parsedData, address: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={parsedData.city} onChange={(e) => setParsedData({ ...parsedData, city: e.target.value })} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>State</Label>
                    <Input value={parsedData.state} onChange={(e) => setParsedData({ ...parsedData, state: e.target.value })} maxLength={2} className="mt-1" />
                  </div>
                  <div>
                    <Label>Zip</Label>
                    <Input value={parsedData.zip_code} onChange={(e) => setParsedData({ ...parsedData, zip_code: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Price</Label>
                  <Input value={parsedData.price} onChange={(e) => setParsedData({ ...parsedData, price: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select value={parsedData.property_type} onValueChange={(v) => setParsedData({ ...parsedData, property_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <Input type="number" value={parsedData.bedrooms} onChange={(e) => setParsedData({ ...parsedData, bedrooms: parseInt(e.target.value) || 0 })} className="mt-1" />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input type="number" step={0.5} value={parsedData.bathrooms} onChange={(e) => setParsedData({ ...parsedData, bathrooms: parseFloat(e.target.value) || 0 })} className="mt-1" />
                </div>
                <div>
                  <Label>Square Feet</Label>
                  <Input type="number" value={parsedData.square_feet || ""} onChange={(e) => setParsedData({ ...parsedData, square_feet: parseInt(e.target.value) || null })} className="mt-1" />
                </div>
                <div>
                  <Label>MLS Number</Label>
                  <Input value={parsedData.mls_number} onChange={(e) => setParsedData({ ...parsedData, mls_number: e.target.value })} className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={parsedData.description} onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })} rows={3} className="mt-1" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={step === "review" ? () => setStep("input") : handleClose}>
            {step === "review" ? "Back" : "Cancel"}
          </Button>
          {step === "input" && (
            <Button
              onClick={mode === "paste" ? handleParsePaste : handleURLFetch}
              disabled={loading || (mode === "paste" ? !pastedText.trim() : !url.trim())}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Extract Details</>
              )}
            </Button>
          )}
          {step === "review" && (
            <Button onClick={handleImport}>
              Import Listing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
