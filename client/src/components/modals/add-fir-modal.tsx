import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertFirRecordSchema } from "@shared/schema";

interface AddFirModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddFirModal({ isOpen, onClose }: AddFirModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firNumber: "",
    criminalId: "",
    firDate: "",
    description: "",
  });

  const { data: criminals = [] } = useQuery({
    queryKey: ["/api/criminals"],
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/firs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/firs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "FIR record created successfully",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create FIR record",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firNumber: "",
      criminalId: "",
      firDate: "",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = insertFirRecordSchema.parse({
        ...formData,
        firDate: formData.firDate ? new Date(formData.firDate) : new Date(),
        criminalId: formData.criminalId || null,
      });

      createMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="modal-add-fir">
        <DialogHeader>
          <DialogTitle>Add FIR Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firNumber">FIR Number</Label>
            <Input
              id="firNumber"
              placeholder="Auto-generated if empty"
              value={formData.firNumber}
              onChange={(e) => setFormData({ ...formData, firNumber: e.target.value })}
              data-testid="input-fir-number"
            />
          </div>

          <div>
            <Label htmlFor="criminalId">Associated Criminal (Optional)</Label>
            <Select value={formData.criminalId} onValueChange={(value) => setFormData({ ...formData, criminalId: value })}>
              <SelectTrigger data-testid="select-criminal">
                <SelectValue placeholder="Select a criminal (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No association</SelectItem>
                {criminals.map((criminal: any) => (
                  <SelectItem key={criminal.id} value={criminal.id}>
                    {criminal.name} - {criminal.firNumber || criminal.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firDate">FIR Date</Label>
            <Input
              id="firDate"
              type="date"
              value={formData.firDate}
              onChange={(e) => setFormData({ ...formData, firDate: e.target.value })}
              data-testid="input-fir-date"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the incident in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              data-testid="textarea-description"
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-add-fir"
            >
              {createMutation.isPending ? "Adding..." : "Add FIR"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
