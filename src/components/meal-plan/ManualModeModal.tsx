import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, Image as ImageIcon, CheckCircle } from "lucide-react";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { ExtractedPreferences } from "@/types/meal-plan";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ManualModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreferencesExtracted: (preferences: ExtractedPreferences) => void;
}

export const ManualModeModal = ({ open, onOpenChange, onPreferencesExtracted }: ManualModeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPreferences | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleTextFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Read file as text
      const text = await file.text();
      
      // Send to API for extraction
      const response = await mealPlanApi.extractPreferences(text);
      
      if (response.success && response.extracted) {
        setExtractedData(response.extracted);
        toast.success("Preferences extracted from file! 📄");
      } else {
        throw new Error(response.error || 'Failed to extract preferences');
      }
    } catch (error: any) {
      console.error('Text file error:', error);
      toast.error(error.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setLoading(true);
    try {
      const response = await mealPlanApi.ocrImage(file);
      
      if (response.success && response.extracted) {
        setExtractedData(response.extracted);
        setOcrText(response.ocrText || '');
        toast.success("Text extracted from image! 📸");
      } else {
        throw new Error(response.error || 'Failed to process image');
      }
    } catch (error: any) {
      console.error('Image OCR error:', error);
      toast.error(error.message || 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onPreferencesExtracted(extractedData);
      toast.success("Preferences applied to your profile! ✅");
      onOpenChange(false);
      // Reset state
      setExtractedData(null);
      setOcrText('');
    }
  };

  const togglePreference = (type: keyof ExtractedPreferences, item: string) => {
    if (!extractedData) return;
    
    setExtractedData({
      ...extractedData,
      [type]: extractedData[type].includes(item)
        ? extractedData[type].filter((i) => i !== item)
        : [...extractedData[type], item],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat">
            Manual Mode - Upload Preferences
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload a text file or image with your food preferences
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Options */}
          {!extractedData && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Text/Doc Upload */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Upload Text/Doc File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  .txt, .doc, .docx, .pdf files supported
                </p>
                <Button variant="outline" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleTextFileUpload}
                  className="hidden"
                />
              </div>

              {/* Image Upload */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Upload Image of Notes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  JPG, PNG, WebP supported (max 10MB)
                </p>
                <Button variant="outline" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </>
                  )}
                </Button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Preview Extracted Data */}
          {extractedData && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {ocrText && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <Label className="text-sm font-semibold">Extracted Text (OCR)</Label>
                  <p className="text-xs text-muted-foreground mt-2 max-h-32 overflow-y-auto">
                    {ocrText}
                  </p>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Detected Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Review and edit before applying
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                {extractedData.preferences.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm mb-2">Likes / Preferences</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extractedData.preferences.map((pref) => (
                        <div
                          key={pref}
                          className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => togglePreference('preferences', pref)}
                          />
                          {pref}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avoids */}
                {extractedData.avoids.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm mb-2">Foods to Avoid</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extractedData.avoids.map((avoid) => (
                        <div
                          key={avoid}
                          className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm"
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => togglePreference('avoids', avoid)}
                          />
                          {avoid}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requests */}
                {extractedData.requests.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2">Meal Patterns / Requests</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extractedData.requests.map((request) => (
                        <div
                          key={request}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => togglePreference('requests', request)}
                          />
                          {request}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setExtractedData(null);
                    setOcrText('');
                  }}
                  className="flex-1"
                >
                  Upload Another
                </Button>
                <Button onClick={handleApply} className="flex-1">
                  Apply These Preferences
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Extracting your food preferences...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
