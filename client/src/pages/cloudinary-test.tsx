import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function CloudinaryTest() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTestUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("files", file);
      });

      const response = await fetch('/api/inspections/8/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        toast({
          title: "Upload Successful",
          description: `${data.count} files uploaded to Cloudinary`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Cloudinary Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleTestUpload}
              disabled={uploading}
              className="mb-4"
            />
          </div>
          
          {uploading && (
            <div>Uploading to Cloudinary...</div>
          )}
          
          {result && (
            <div className="space-y-2">
              <h3 className="font-medium">Upload Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.files && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files:</h4>
                  {result.files.map((file: any, index: number) => (
                    <div key={index} className="border p-2 rounded">
                      <div>Type: {file.type}</div>
                      <div>URL: <a href={file.url} target="_blank" className="text-blue-600 underline">{file.url}</a></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}