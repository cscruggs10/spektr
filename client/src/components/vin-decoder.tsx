import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleInfo {
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  bodyType: string | null;
}

export function VinDecoder() {
  const [vin, setVin] = useState("");
  const { toast } = useToast();

  const validateVin = (vin: string) => {
    // Basic VIN validation (17 alphanumeric characters, no I, O, or Q)
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
  };

  const decodeMutation = useMutation({
    mutationFn: async (vin: string) => {
      if (!validateVin(vin)) {
        throw new Error("Invalid VIN format");
      }
      
      const response = await apiRequest("GET", `/api/nhtsa/vehicle-info/${vin}`);
      return response.json() as Promise<VehicleInfo>;
    },
    onError: (error: Error) => {
      toast({
        title: "Error decoding VIN",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDecodeVin = () => {
    if (vin.trim() === "") {
      toast({
        title: "VIN required",
        description: "Please enter a VIN number",
        variant: "destructive",
      });
      return;
    }
    
    decodeMutation.mutate(vin);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>VIN Decoder</CardTitle>
        <CardDescription>
          Decode Vehicle Identification Numbers (VIN) to get vehicle information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Enter VIN number"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="uppercase"
          />
          <Button 
            onClick={handleDecodeVin} 
            disabled={decodeMutation.isPending}
          >
            {decodeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Decoding...
              </>
            ) : (
              "Decode VIN"
            )}
          </Button>
        </div>

        {decodeMutation.isSuccess && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-2">Vehicle Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Make:</span>
                <span className="font-medium">{decodeMutation.data.make || "Not available"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">{decodeMutation.data.model || "Not available"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{decodeMutation.data.year || "Not available"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trim:</span>
                <span className="font-medium">{decodeMutation.data.trim || "Not available"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Body Type:</span>
                <span className="font-medium">{decodeMutation.data.bodyType || "Not available"}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Data provided by NHTSA Vehicle API
        </p>
        {validateVin(vin) ? (
          <div className="flex items-center text-xs text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid VIN format
          </div>
        ) : vin.length > 0 ? (
          <div className="flex items-center text-xs text-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Invalid VIN format
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}