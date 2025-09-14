import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Upload, Check, Loader2 } from "lucide-react";
import { FileUpload } from "@/components/file-upload";
import { useToast } from "@/hooks/use-toast";

export default function UploadTestPage() {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [directUploadStatus, setDirectUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadResponse, setUploadResponse] = useState<any>(null);

  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast({
        title: "Error",
        description: "No files selected",
        variant: "destructive"
      });
      return;
    }

    setDirectUploadStatus('loading');
    
    try {
      // Create FormData
      const formData = new FormData();
      
      // Add each file
      Array.from(files).forEach(file => {
        console.log(`Adding file:`, file.name, file.type, file.size);
        formData.append("files", file);
      });
      
      // Make direct POST request to our test endpoint
      const response = await fetch('/api/test-upload', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setUploadResponse(data);
      
      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }
      
      setDirectUploadStatus('success');
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      setDirectUploadStatus('error');
      
      let errorMessage = "Failed to upload files";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Test Page</h1>
      <p className="text-gray-600 mb-8">This page is for testing file upload functionality.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Component Upload Test</CardTitle>
            <CardDescription>
              Testing the FileUpload component with a test ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Photo Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="border rounded-md p-2 bg-gray-50">
                      <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center mb-2">
                        <img 
                          src={`/uploads/${photo}`} 
                          alt={`Uploaded photo ${index}`}
                          className="max-h-full max-w-full object-contain rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Image+Error';
                          }}
                        />
                      </div>
                      <p className="text-sm truncate">{photo}</p>
                    </div>
                  ))}
                  <FileUpload 
                    type="photos" 
                    inspectionId="test" 
                    onSuccess={(fileNames) => {
                      setUploadedPhotos(prev => [...prev, ...fileNames]);
                    }}
                    label="Test Photo Upload"
                    buttonText="Upload Photo"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Video Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedVideos.map((video, index) => (
                    <div key={index} className="border rounded-md p-2 bg-gray-50">
                      <div className="aspect-video bg-gray-200 rounded-md flex items-center justify-center mb-2">
                        <video 
                          controls
                          src={`/uploads/${video}`}
                          className="max-h-full max-w-full rounded-md"
                          onError={(e) => {
                            console.error("Video load error", e);
                          }}
                        />
                      </div>
                      <p className="text-sm truncate">{video}</p>
                    </div>
                  ))}
                  <FileUpload 
                    type="videos" 
                    inspectionId="test" 
                    onSuccess={(fileNames) => {
                      setUploadedVideos(prev => [...prev, ...fileNames]);
                    }}
                    label="Test Video Upload"
                    buttonText="Upload Video"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct Upload Test</CardTitle>
            <CardDescription>
              Testing a direct fetch upload to our test endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center">
                <input
                  type="file"
                  id="direct-upload"
                  className="hidden"
                  onChange={handleDirectUpload}
                  disabled={directUploadStatus === 'loading'}
                />
                <label
                  htmlFor="direct-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    {directUploadStatus === 'loading' ? (
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    ) : directUploadStatus === 'success' ? (
                      <Check className="h-8 w-8 text-green-600" />
                    ) : (
                      <Upload className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <span className="text-base font-medium text-blue-600 mb-2">
                    {directUploadStatus === 'loading' 
                      ? 'Uploading...' 
                      : directUploadStatus === 'success'
                      ? 'Upload Successful!'
                      : 'Click to Upload File'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Upload any file to test the direct endpoint
                  </span>
                </label>
              </div>
              
              {uploadResponse && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Upload Response</h3>
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-80 text-sm">
                    {JSON.stringify(uploadResponse, null, 2)}
                  </pre>
                </div>
              )}
              
              {directUploadStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Upload Failed</AlertTitle>
                  <AlertDescription>
                    There was a problem with the direct upload. Check console for details.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">
              This test uses the /api/test-upload endpoint to test file uploads without any database operations.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}