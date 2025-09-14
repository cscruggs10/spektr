import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BuyBoxItem, Dealer } from "@/lib/types";

// Define the form schema
const formSchema = z.object({
  dealerId: z.string().min(1, "Please select a dealer"),
});

type FormValues = z.infer<typeof formSchema>;

interface DuplicateBuyBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyBoxItem: BuyBoxItem | null;
}

const DuplicateBuyBoxModal = ({ isOpen, onClose, buyBoxItem }: DuplicateBuyBoxModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dealerId: "",
    },
  });

  // Reset form when modal opens with new item
  useEffect(() => {
    if (isOpen && buyBoxItem) {
      form.reset({
        dealerId: "",
      });
    }
  }, [isOpen, buyBoxItem, form]);

  // Query for dealers
  const { data: dealers, isLoading: dealersLoading } = useQuery({
    queryKey: ["/api/dealers"],
    queryFn: () => fetch("/api/dealers").then(res => res.json())
  });

  // Mutation to duplicate buy box item
  const duplicateMutation = useMutation({
    mutationFn: async ({ itemId, dealerId }: { itemId: number, dealerId: string }) => {
      const response = await apiRequest("POST", `/api/buy-box/${itemId}/duplicate`, { dealerId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buy-box"] });
      toast({
        title: "Success",
        description: "Buy box item duplicated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate buy box item",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    if (!buyBoxItem) return;
    
    setIsSubmitting(true);
    duplicateMutation.mutate({
      itemId: buyBoxItem.id,
      dealerId: values.dealerId
    });
  };

  // Filter out the current dealer from the dropdown options
  const filteredDealers = dealers?.filter((dealer: Dealer) => 
    buyBoxItem && dealer.id !== buyBoxItem.dealer_id
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Duplicate Buy Box Item</DialogTitle>
          <DialogDescription>
            Create a copy of this buy box item for another dealer.
          </DialogDescription>
        </DialogHeader>

        {buyBoxItem && (
          <div className="py-2">
            <div className="font-medium mb-1">Item Details:</div>
            <div className="grid grid-cols-2 gap-x-4 text-sm">
              <div className="mb-1"><span className="font-medium">Make:</span> {buyBoxItem.make}</div>
              <div className="mb-1"><span className="font-medium">Model:</span> {buyBoxItem.model}</div>
              {buyBoxItem.trim && (
                <div className="mb-1"><span className="font-medium">Trim:</span> {buyBoxItem.trim}</div>
              )}
              {(buyBoxItem.year_min || buyBoxItem.year_max) && (
                <div className="mb-1">
                  <span className="font-medium">Year:</span> {buyBoxItem.year_min || 'Any'} - {buyBoxItem.year_max || 'Any'}
                </div>
              )}
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dealerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Dealer</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={dealersLoading || filteredDealers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dealer" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDealers.map((dealer: Dealer) => (
                          <SelectItem key={dealer.id} value={dealer.id.toString()}>
                            {dealer.name}
                          </SelectItem>
                        ))}
                        {filteredDealers.length === 0 && (
                          <SelectItem value="none" disabled>
                            No other dealers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={onClose} 
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || dealersLoading || filteredDealers.length === 0}
              >
                {isSubmitting ? "Duplicating..." : "Duplicate"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateBuyBoxModal;