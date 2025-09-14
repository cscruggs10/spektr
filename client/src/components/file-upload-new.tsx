import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  X,
  Image as ImageIcon, 
  FileVideo,
  FilePlus,
  FileAudio,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for the FileUpload component props
export interface FileUploadProps {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  endpoint: string;
  buttonText?: string;
  inputId?: string;
  className?: string;
  disabled?: boolean;
  allowMultiple?: boolean;
}

export function FileUpload({
  onSuccess,
  onError,
  maxFiles = 10,
  maxSize = 50, // Default 50MB
  accept,
  endpoint,
  buttonText = "Upload Files",
  inputId = "file-upload",
  className = "",
  disabled = false,
  allowMultiple = true,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert maxSize from MB to bytes for file validation
  const maxSizeBytes = maxSize * 1024 * 1024;

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Process files (either from drop or file input)
  const processFiles = async (fileList: FileList) => {
    setError(null);
    
    // Check if too many files are being uploaded
    if (fileList.length > maxFiles) {
      const error = new Error(`Too many files. Maximum allowed is ${maxFiles}`);
      setError(error.message);
      onError?.(error);
      return;
    }
    
    // Create a FormData object to send the files
    const formData = new FormData();
    let hasInvalidFiles = false;
    let errorMessages: string[] = [];
    
    // Check each file and add valid ones to FormData
    Array.from(fileList).forEach((file) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        hasInvalidFiles = true;
        errorMessages.push(`"${file.name}" is too large (max: ${maxSize}MB)`);
        return;
      }
      
      // Check file type if accept is specified
      if (accept && !accept.split(",").some(type => {
        // Handle wildcards e.g. "image/*" matches "image/jpeg"
        if (type.endsWith("/*")) {
          const mainType = type.split("/")[0];
          return file.type.startsWith(mainType + "/");
        }
        return file.type === type;
      })) {
        hasInvalidFiles = true;
        errorMessages.push(`"${file.name}" has an invalid file type`);
        return;
      }
      
      // Add valid file to FormData
      formData.append("files", file);
    });
    
    // If there are invalid files, show errors and stop
    if (hasInvalidFiles) {
      const error = new Error(errorMessages.join(", "));
      setError(error.message);
      onError?.(error);
      return;
    }
    
    // If no files are valid, stop
    if (formData.getAll("files").length === 0) {
      const error = new Error("No valid files to upload");
      setError(error.message);
      onError?.(error);
      return;
    }
    
    // Upload the files
    try {
      setUploading(true);
      
      // Simple progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 95) {
            clearInterval(progressInterval);
            return prevProgress;
          }
          return prevProgress + 5;
        });
      }, 100);
      
      // Make the API request
      const response = await apiRequest("POST", endpoint, formData);
      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Handle successful upload
      if (response.ok) {
        if (onSuccess) {
          onSuccess(data);
        }
        
        // Show success toast with file details
        toast({
          title: "Upload Successful",
          description: `${data.count || "All"} files uploaded successfully to cloud storage`,
        });
        
        // Reset the component state
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          
          // Clear the file input
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }, 1000); // Longer delay to show success state
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err) {
      // Handle errors
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error.message);
      onError?.(error);
      
      // Show error toast
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (disabled || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    processFiles(e.dataTransfer.files);
  };

  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length || 0, 'files');
    if (disabled || !e.target.files || e.target.files.length === 0) {
      console.log('No files selected or input disabled');
      return;
    }
    
    // Log file details for debugging
    Array.from(e.target.files).forEach((file, i) => {
      console.log(`File ${i}: ${file.name}, type: ${file.type}, size: ${file.size}`);
    });
    
    processFiles(e.target.files);
  };

  // Handle button click to open file dialog
  const handleButtonClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  // Determine border color based on state
  const getBorderColor = () => {
    if (error) return "border-destructive";
    if (dragging) return "border-primary border-dashed";
    return "border-input border-dashed";
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative rounded-md ${getBorderColor()} p-4 transition-colors ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple={allowMultiple}
          className="sr-only"
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled || uploading}
          capture={accept?.includes('image') ? 'environment' : accept?.includes('video') ? 'environment' : undefined}
        />
        
        <div className="flex flex-col items-center justify-center py-4 text-center">
          {!uploading ? (
            <>
              <Upload className="h-10 w-10 text-primary mb-2" />
              <p className="text-sm font-medium mb-1">{buttonText}</p>
              <p className="text-xs text-muted-foreground mb-2">
                Drag and drop or click to browse
              </p>
              {accept && (
                <p className="text-xs text-muted-foreground">
                  Allowed: {accept.replace(/\./g, "").toUpperCase()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} file{maxFiles === 1 ? "" : "s"}, up to {maxSize}MB each
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center w-full">
                <span className="text-sm font-medium mb-2">Uploading...</span>
                <Progress value={progress} className="w-full h-2" />
                <span className="text-xs text-muted-foreground mt-1">
                  {progress}% complete
                </span>
              </div>
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-2 flex items-center text-destructive text-xs p-2 bg-destructive/10 rounded-sm">
            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized version for photo uploads
export function PhotoUpload(props: Omit<FileUploadProps, "accept">) {
  return (
    <FileUpload
      {...props}
      accept="image/*"
      buttonText={props.buttonText || "Upload Photos"}
      inputId={props.inputId || "photo-upload"}
    />
  );
}

// Specialized version for video uploads
export function VideoUpload(props: Omit<FileUploadProps, "accept">) {
  return (
    <FileUpload
      {...props}
      accept="video/*"
      buttonText={props.buttonText || "Upload Videos"}
      inputId={props.inputId || "video-upload"}
    />
  );
}

// Specialized version for audio uploads
export function AudioUpload(props: Omit<FileUploadProps, "accept">) {
  return (
    <FileUpload
      {...props}
      accept="audio/*"
      buttonText={props.buttonText || "Upload Audio"}
      inputId={props.inputId || "audio-upload"}
    />
  );
}