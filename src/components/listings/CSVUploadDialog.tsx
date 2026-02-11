import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVRow {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  property_type: string;
  status: string;
  description: string;
  mls_number: string;
  lot_size: string;
  year_built: string;
  virtual_tour_url: string;
  is_featured: string;
  [key: string]: string;
}

interface ParsedListing {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  property_type: string;
  status: string;
  description: string | null;
  mls_number: string | null;
  lot_size_acres: number | null;
  is_featured: boolean;
  virtual_tour_url: string | null;
  errors: string[];
}

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (listings: Omit<ParsedListing, "errors">[]) => Promise<void>;
}

const REQUIRED_HEADERS = ["address", "city", "state", "price"];
const SAMPLE_CSV = `address,city,state,zip_code,price,bedrooms,bathrooms,square_feet,property_type,status,description,mls_number,lot_size,year_built,is_featured
"123 Oak Street",Springfield,IL,62701,425000,3,2,1800,single_family,active,"Beautiful ranch home with updated kitchen",ML12345,0.25,2005,false
"456 Maple Ave Unit 3B",Chicago,IL,60601,350000,2,2,1200,condo,active,"Modern condo in downtown Chicago",ML67890,,2018,true
"789 Pine Road",Naperville,IL,60540,675000,4,3.5,2800,single_family,sold,"Stunning colonial on a quiet cul-de-sac",ML11111,0.5,1998,false`;

function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: CSVRow = {} as CSVRow;
    headers.forEach((header, i) => {
      row[header] = (values[i] || "").trim();
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function validateRow(row: CSVRow, index: number): ParsedListing {
  const errors: string[] = [];

  if (!row.address) errors.push("Address is required");
  if (!row.city) errors.push("City is required");
  if (!row.state) errors.push("State is required");

  const price = Number(String(row.price || "0").replace(/[^0-9.]/g, ""));
  if (!price || price <= 0) errors.push("Valid price is required");

  const bedrooms = Number(row.bedrooms) || 0;
  const bathrooms = Number(row.bathrooms) || 0;
  const sqft = row.square_feet ? Number(row.square_feet.replace(/[^0-9]/g, "")) : null;
  const lotSize = row.lot_size ? Number(row.lot_size) : null;

  const validStatuses = ["active", "pending", "under_contract", "sold", "draft"];
  const status = validStatuses.includes(row.status?.toLowerCase()) ? row.status.toLowerCase() : "active";

  const validTypes = ["single_family", "condo", "townhouse", "multi_family", "land", "commercial"];
  const propType = validTypes.includes(row.property_type?.toLowerCase()) ? row.property_type.toLowerCase() : "single_family";

  return {
    address: row.address || "",
    city: row.city || "",
    state: (row.state || "").toUpperCase().slice(0, 2),
    zip_code: row.zip_code || "",
    price,
    bedrooms,
    bathrooms,
    square_feet: sqft,
    property_type: propType,
    status,
    description: row.description || null,
    mls_number: row.mls_number || null,
    lot_size_acres: lotSize,
    is_featured: row.is_featured?.toLowerCase() === "true",
    virtual_tour_url: row.virtual_tour_url || null,
    errors,
  };
}

export function CSVUploadDialog({ open, onOpenChange, onImport }: CSVUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedListings, setParsedListings] = useState<ParsedListing[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      const parsed = rows.map((row, i) => validateRow(row, i));
      setParsedListings(parsed);
      setStep("preview");
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        const parsed = rows.map((row, i) => validateRow(row, i));
        setParsedListings(parsed);
        setStep("preview");
      };
      reader.readAsText(droppedFile);
    }
  }, []);

  const validListings = parsedListings.filter(l => l.errors.length === 0);
  const invalidListings = parsedListings.filter(l => l.errors.length > 0);

  const handleImport = async () => {
    setImporting(true);
    try {
      const toImport = validListings.map(({ errors, ...listing }) => listing);
      await onImport(toImport);
      setStep("done");
    } catch {
      // Error handling in parent
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setParsedListings([]);
    setStep("upload");
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_listings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Listings from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple listings at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4 py-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer"
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-base font-medium">Drop your CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-2">Supports .csv files</p>
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-2">CSV Format Requirements</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Required columns: <span className="font-medium text-foreground">address, city, state, price</span>
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Optional: zip_code, bedrooms, bathrooms, square_feet, property_type, status, description, mls_number, lot_size, year_built, virtual_tour_url, is_featured
                </p>
                <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
                  <Download className="h-3.5 w-3.5" />
                  Download Sample CSV
                </Button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{parsedListings.length}</div>
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{validListings.length}</div>
                  <div className="text-xs text-green-600">Ready to Import</div>
                </div>
                <div className={cn("rounded-lg p-3 text-center", invalidListings.length > 0 ? "bg-red-50" : "bg-muted")}>
                  <div className={cn("text-2xl font-bold", invalidListings.length > 0 ? "text-red-600" : "text-muted-foreground")}>
                    {invalidListings.length}
                  </div>
                  <div className={cn("text-xs", invalidListings.length > 0 ? "text-red-600" : "text-muted-foreground")}>
                    With Errors
                  </div>
                </div>
              </div>

              {/* Errors */}
              {invalidListings.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {invalidListings.length} row{invalidListings.length !== 1 ? "s" : ""} have errors and will be skipped
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {invalidListings.slice(0, 5).map((listing, idx) => (
                      <p key={idx} className="text-xs text-red-600">
                        Row {parsedListings.indexOf(listing) + 2}: {listing.errors.join(", ")}
                      </p>
                    ))}
                    {invalidListings.length > 5 && (
                      <p className="text-xs text-red-500">...and {invalidListings.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">Address</th>
                        <th className="px-3 py-2 text-left text-xs font-medium">City</th>
                        <th className="px-3 py-2 text-right text-xs font-medium">Price</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">Beds</th>
                        <th className="px-3 py-2 text-center text-xs font-medium">Baths</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedListings.slice(0, 20).map((listing, idx) => (
                        <tr key={idx} className={listing.errors.length > 0 ? "bg-red-50/50" : ""}>
                          <td className="px-3 py-2">
                            {listing.errors.length > 0 ? (
                              <X className="h-4 w-4 text-red-500" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs truncate max-w-[150px]">{listing.address}</td>
                          <td className="px-3 py-2 text-xs">{listing.city}</td>
                          <td className="px-3 py-2 text-xs text-right font-medium">
                            ${listing.price.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-center">{listing.bedrooms}</td>
                          <td className="px-3 py-2 text-xs text-center">{listing.bathrooms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedListings.length > 20 && (
                  <div className="px-3 py-2 bg-muted text-xs text-muted-foreground text-center">
                    Showing 20 of {parsedListings.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Done Step */}
          {step === "done" && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
              <p className="text-muted-foreground">
                Successfully imported {validListings.length} listing{validListings.length !== 1 ? "s" : ""}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {step === "done" ? "Close" : "Cancel"}
          </Button>
          {step === "preview" && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); setParsedListings([]); }}>
                Choose Different File
              </Button>
              <Button onClick={handleImport} disabled={validListings.length === 0 || importing}>
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <>Import {validListings.length} Listing{validListings.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
