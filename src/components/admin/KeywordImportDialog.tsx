import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2 } from "lucide-react";
import { useKeywords } from "@/hooks/useKeywords";
import { toast } from "sonner";

export function KeywordImportDialog() {
  const [open, setOpen] = useState(false);
  const { importKeywords, isImporting } = useKeywords();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = `keyword,category,difficulty,search_volume,notes
real estate agent portfolio,Real Estate,medium,1000,Example keyword
luxury home listings,Luxury Real Estate,hard,500,High-value properties
first time home buyer tips,Real Estate,easy,2000,Educational content`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Parse data rows
      const keywords = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const keyword: any = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            keyword[header] = values[index];
          }
        });
        
        return keyword;
      }).filter(k => k.keyword);

      if (keywords.length === 0) {
        toast.error("No valid keywords found in CSV");
        return;
      }

      await importKeywords(keywords);
      setOpen(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error("Failed to parse CSV file");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Keywords
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Keywords from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your keywords. New keywords will be added and existing ones will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                {isImporting ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {isImporting ? "Importing..." : "Click to upload CSV"}
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV files only
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">CSV Format:</p>
            <div className="bg-muted p-3 rounded-md text-xs font-mono">
              keyword,category,difficulty,search_volume,notes
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li><strong>keyword</strong> (required): The keyword phrase</li>
              <li><strong>category</strong>: Real Estate, Luxury Real Estate, etc.</li>
              <li><strong>difficulty</strong>: easy, medium, or hard</li>
              <li><strong>search_volume</strong>: Monthly search volume (number)</li>
              <li><strong>notes</strong>: Any additional notes</li>
            </ul>
          </div>

          <Button 
            onClick={downloadTemplate} 
            variant="secondary" 
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
