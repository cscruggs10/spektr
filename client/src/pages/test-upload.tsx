import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestUploadPage() {
  const { toast } = useToast();
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('Starting upload...');
      
      // Create a new FormData
      const formData = new FormData();
      
      // Add each file to FormData
      Array.from(files).forEach((file, index) => {
        console.log(`Adding file:`, file.name, file.type, file.size);
        formData.append("files", file);
      });
      
      setUploadStatus('FormData created, sending to server...');
      
      // Test upload to a specific inspection
      const testInspectionId = 4; // Use a real inspection ID that exists in your system
      const response = await fetch(`/api/inspections/${testInspectionId}/uploads`, {
        method: "POST",
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Upload failed');
      }
      
      setUploadStatus(`Upload successful! Server response: ${JSON.stringify(responseData)}`);
      
      toast({
        title: "Files Uploaded",
        description: "Test files were uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      let errorMessage = "Failed to upload files";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      setUploadStatus(`Error: ${errorMessage}`);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Test File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Upload Test</h3>
              <p className="text-sm text-gray-500 mb-4">
                This page is for testing the file upload functionality.
              </p>
              
              <div className="flex flex-col items-center p-6 border rounded-md border-dashed">
                <input
                  type="file"
                  id="test-file-upload"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="test-file-upload"
                  className="mb-4 cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-4 rounded-md transition-colors"
                >
                  {isUploading ? 'Uploading...' : 'Select Files to Upload'}
                </label>
                
                <div className="w-full mt-4">
                  <h4 className="text-sm font-medium mb-2">Status:</h4>
                  <div className="p-3 bg-gray-50 rounded-md min-h-[100px] text-sm">
                    {uploadStatus || 'No upload attempted yet.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}