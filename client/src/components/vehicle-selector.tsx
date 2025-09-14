import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

// List of common car makes we want to include in the selector
// These IDs correspond to the NHTSA database Make_IDs
const COMMON_MAKES = [
  { Make_ID: "440", Make_Name: "AUDI" },
  { Make_ID: "441", Make_Name: "BMW" },
  { Make_ID: "442", Make_Name: "BUICK" },
  { Make_ID: "443", Make_Name: "CADILLAC" },
  { Make_ID: "444", Make_Name: "CHEVROLET" },
  { Make_ID: "445", Make_Name: "CHRYSLER" },
  { Make_ID: "448", Make_Name: "DODGE" },
  { Make_ID: "449", Make_Name: "FORD" },
  { Make_ID: "452", Make_Name: "GMC" },
  { Make_ID: "454", Make_Name: "HONDA" },
  { Make_ID: "455", Make_Name: "HYUNDAI" },
  { Make_ID: "460", Make_Name: "INFINITI" },
  { Make_ID: "464", Make_Name: "JEEP" },
  { Make_ID: "465", Make_Name: "KIA" },
  { Make_ID: "469", Make_Name: "LEXUS" },
  { Make_ID: "470", Make_Name: "LINCOLN" },
  { Make_ID: "472", Make_Name: "MAZDA" },
  { Make_ID: "473", Make_Name: "MERCEDES-BENZ" },
  { Make_ID: "474", Make_Name: "MERCURY" },
  { Make_ID: "478", Make_Name: "NISSAN" },
  { Make_ID: "482", Make_Name: "PORSCHE" },
  { Make_ID: "483", Make_Name: "RAM" },
  { Make_ID: "489", Make_Name: "SUBARU" },
  { Make_ID: "492", Make_Name: "TOYOTA" },
  { Make_ID: "494", Make_Name: "VOLKSWAGEN" },
  { Make_ID: "496", Make_Name: "VOLVO" },
  { Make_ID: "2036", Make_Name: "TESLA" },
];

interface NHTSAMake {
  Make_ID: string;
  Make_Name: string;
}

interface NHTSAModel {
  Model_ID: string;
  Model_Name: string;
}

interface VehicleSelectorProps {
  onMakeChange?: (makeId: string, makeName: string) => void;
  onModelChange?: (modelId: string, modelName: string) => void;
  defaultMakeId?: string;
  defaultMakeName?: string;
  defaultModelId?: string;
  defaultModelName?: string;
  label?: boolean;
}

export function VehicleSelector({
  onMakeChange,
  onModelChange,
  defaultMakeId,
  defaultMakeName,
  defaultModelId,
  defaultModelName,
  label = true,
}: VehicleSelectorProps) {
  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(defaultMakeId || null);
  const [selectedMakeName, setSelectedMakeName] = useState<string | null>(defaultMakeName || null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(defaultModelId || null);

  // For mock mode or filtering, we can use the common makes directly
  const [useCommonMakesOnly, setUseCommonMakesOnly] = useState<boolean>(true);
  
  // Fetch vehicle makes from API if not using common makes only
  const {
    data: fetchedMakes,
    isLoading: isLoadingMakes,
    error: makesError,
  } = useQuery<NHTSAMake[]>({
    queryKey: ["/api/nhtsa/makes"],
    enabled: !useCommonMakesOnly, // Only fetch if we're not using common makes
  });
  
  // Use either the common makes list or the fetched makes
  const makes = useCommonMakesOnly ? COMMON_MAKES : fetchedMakes;
  
  // Handle default make selection
  useEffect(() => {
    if (makes && defaultMakeId && !selectedMakeName) {
      const make = makes.find((make) => make.Make_ID === defaultMakeId);
      if (make) {
        setSelectedMakeName(make.Make_Name);
      }
    }
  }, [makes, defaultMakeId, selectedMakeName]);

  // Fetch models for the selected make
  const {
    data: models,
    isLoading: isLoadingModels,
    refetch: refetchModels,
  } = useQuery<NHTSAModel[]>({
    queryKey: ["/api/nhtsa/models", selectedMakeId],
    enabled: !!selectedMakeId && !!selectedMakeName,
    queryFn: async () => {
      if (!selectedMakeId || !selectedMakeName) return [];
      const response = await fetch(`/api/nhtsa/models/${selectedMakeId}?makeName=${encodeURIComponent(selectedMakeName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      return response.json();
    }
  });

  useEffect(() => {
    // When make changes, reset model
    if (selectedMakeId && selectedMakeName && onMakeChange) {
      onMakeChange(selectedMakeId, selectedMakeName);
      setSelectedModelId(null);
    }
  }, [selectedMakeId, selectedMakeName, onMakeChange]);

  useEffect(() => {
    // When model changes, notify parent
    if (selectedModelId && models && onModelChange) {
      const selectedModel = models.find(model => model.Model_ID === selectedModelId);
      if (selectedModel) {
        onModelChange(selectedModelId, selectedModel.Model_Name);
      }
    }
  }, [selectedModelId, models, onModelChange]);

  const handleMakeChange = (makeId: string) => {
    const make = makes?.find((make) => make.Make_ID === makeId);
    if (make) {
      setSelectedMakeId(makeId);
      setSelectedMakeName(make.Make_Name);
      setSelectedModelId(null);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {label && <Label htmlFor="make">Make</Label>}
        {isLoadingMakes ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={selectedMakeId || ""} onValueChange={handleMakeChange}>
            <SelectTrigger id="make">
              <SelectValue placeholder="Select a make" />
            </SelectTrigger>
            <SelectContent>
              {makes?.map((make) => (
                <SelectItem key={make.Make_ID} value={make.Make_ID}>
                  {make.Make_Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        {label && <Label htmlFor="model">Model</Label>}
        {!selectedMakeId || isLoadingModels ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select 
            value={selectedModelId || ""} 
            onValueChange={handleModelChange}
            disabled={!selectedMakeId || isLoadingModels || !models?.length}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models?.map((model) => (
                <SelectItem key={model.Model_ID} value={model.Model_ID}>
                  {model.Model_Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}