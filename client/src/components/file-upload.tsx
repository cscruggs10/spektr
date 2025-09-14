import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileImage, FileVideo, Upload, Loader2 } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  accept: string;
  endpoint: string;
  maxFiles?: number;
  maxSize?: number;
  onSuccess: (fileNames: string[]) => void;
  label?: string;
  buttonText?: string;
}

export const FileUpload = ({ 
  accept, 
  endpoint, 
  maxFiles = 1, 
  maxSize = 5, 
  onSuccess, 
  label = 'Upload Files', 
  buttonText = 'Select File'
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    setIsUploading(true);
    console.log(`Uploading ${files.length} files...`);
    
    // Check if we exceed the maximum number of files
    if (maxFiles > 0 && files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxFiles} file(s) at once.`,
        variant: "destructive"
      });
      setIsUploading(false);
      return;
    }
    
    try {
      // Create FormData
      const formData = new FormData();
      
      // Check file sizes and add to FormData
      let isFileTooLarge = false;
      Array.from(files).forEach((file) => {
        if (maxSize > 0 && file.size > maxSize * 1024 * 1024) {
          isFileTooLarge = true;
          return;
        }
        
        console.log(`Adding file:`, file.name, file.type, file.size);
        formData.append("files", file);
      });
      
      if (isFileTooLarge) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSize}MB.`,
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      // Show notification
      toast({
        title: "Uploading files...",
        description: `Uploading ${files.length} file(s)...`,
      });
      
      // Make direct fetch request
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `Failed to upload ${type}`);
      }
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      // If files data is available in response, use it
      if (data.files && Array.isArray(data.files)) {
        const fileNames = data.files.map((file: any) => file.filename);
        onSuccess(fileNames);
      } else if (data.filenames && Array.isArray(data.filenames)) {
        onSuccess(data.filenames);
      } else {
        // Otherwise create placeholders
        const placeholderNames = Array(data.count || 1)
          .fill(0)
          .map((_, i) => `file_${Date.now()}_${i}`);
        onSuccess(placeholderNames);
      }
      
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${files.length} file(s)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      // Safe error handling
      let errorMessage = `Failed to upload ${type}`;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center">
        <input
          type="file"
          id={`${type}-upload-${inspectionId}`}
          accept={type === 'photos' ? "image/*" : "video/*"}
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
        <label
          htmlFor={`${type}-upload-${inspectionId}`}
          className="cursor-pointer flex flex-col items-center"
        >
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            ) : (
              <Plus className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <span className="text-sm font-medium text-blue-600">
            {isUploading ? 'Uploading...' : buttonText}
          </span>
        </label>
      </div>
    </div>
  );
}