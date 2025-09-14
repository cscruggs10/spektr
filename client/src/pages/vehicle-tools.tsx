import { useState } from "react";
import { VinDecoder } from "@/components/vin-decoder";
import { VehicleSelector } from "@/components/vehicle-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function VehicleToolsPage() {
  const [selectedMake, setSelectedMake] = useState<{ id: string; name: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string } | null>(null);

  const handleMakeChange = (makeId: string, makeName: string) => {
    setSelectedMake({ id: makeId, name: makeName });
    setSelectedModel(null);
  };

  const handleModelChange = (modelId: string, modelName: string) => {
    setSelectedModel({ id: modelId, name: modelName });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Tools</h1>
        <p className="text-muted-foreground">
          Tools for VIN decoding and vehicle make/model selection using the NHTSA Vehicle API
        </p>
      </div>
      
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>NHTSA Vehicle Data Integration</AlertTitle>
        <AlertDescription>
          These tools provide standardized vehicle data from the NHTSA database, enabling accurate matching of dealer inventory with auction runlist vehicles.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="vin" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="vin">VIN Decoder</TabsTrigger>
          <TabsTrigger value="selector">Make/Model Selector</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vin" className="mt-4">
          <VinDecoder />
        </TabsContent>
        
        <TabsContent value="selector" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Make & Model Selector</CardTitle>
              <CardDescription>
                Select vehicle make and model from standardized NHTSA database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleSelector 
                onMakeChange={handleMakeChange}
                onModelChange={handleModelChange}
              />
              
              {(selectedMake || selectedModel) && (
                <div className="mt-6 p-4 border rounded-md">
                  <h3 className="font-semibold mb-2">Selected Vehicle</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make:</span>
                      <span className="font-medium">{selectedMake?.name || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{selectedModel?.name || 'Not selected'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make ID:</span>
                      <span className="font-medium text-xs">{selectedMake?.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model ID:</span>
                      <span className="font-medium text-xs">{selectedModel?.id || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                Data provided by NHTSA Vehicle API
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}