import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { insertCriminalRecordSchema } from "@shared/schema";
import { Camera } from "lucide-react";

interface AddCriminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddCriminalModal({ isOpen, onClose }: AddCriminalModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    crimeType: "",
    firNumber: "",
    caseStatus: "open",
    arrestDate: "",
    address: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/criminals", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Failed to create criminal record");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criminals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "Criminal record created successfully",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create criminal record",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      gender: "",
      crimeType: "",
      firNumber: "",
      caseStatus: "open",
      arrestDate: "",
      address: "",
    });
    setPhotoFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields before schema parsing
      if (!formData.name.trim()) {
        throw new Error("Full Name is required");
      }
      if (!formData.age.trim()) {
        throw new Error("Age is required");
      }
      if (!formData.gender) {
        throw new Error("Gender is required");
      }
      if (!formData.crimeType) {
        throw new Error("Crime Type is required");
      }

      const dataToValidate = {
        ...formData,
        age: parseInt(formData.age),
        arrestDate: formData.arrestDate ? new Date(formData.arrestDate) : null,
        address: formData.address.trim() || null,
        firNumber: formData.firNumber.trim() || null,
      };

      const validatedData = insertCriminalRecordSchema.parse(dataToValidate);

      const formDataToSend = new FormData();
      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'arrestDate' && value instanceof Date) {
            formDataToSend.append(key, value.toISOString());
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      if (photoFile) {
        formDataToSend.append("photo", photoFile);
      }

      createMutation.mutate(formDataToSend);
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "Please fill in all required fields correctly",
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Photo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-add-criminal">
        <DialogHeader>
          <DialogTitle>Add Criminal Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">Personal Information</h4>
              
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="150"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    data-testid="input-age"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="textarea-address"
                />
              </div>
            </div>

            {/* Case Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-card-foreground">Case Information</h4>
              
              <div>
                <Label htmlFor="crimeType">Crime Type *</Label>
                <Select value={formData.crimeType} onValueChange={(value) => setFormData({ ...formData, crimeType: value })}>
                  <SelectTrigger data-testid="select-crime-type">
                    <SelectValue placeholder="Select Crime Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theft">Theft</SelectItem>
                    <SelectItem value="assault">Assault</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="robbery">Robbery</SelectItem>
                    <SelectItem value="murder">Murder</SelectItem>
                    <SelectItem value="drug_trafficking">Drug Trafficking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                <Label htmlFor="caseStatus">Case Status *</Label>
                <Select value={formData.caseStatus} onValueChange={(value) => setFormData({ ...formData, caseStatus: value })}>
                  <SelectTrigger data-testid="select-case-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="arrestDate">Arrest Date</Label>
                <Input
                  id="arrestDate"
                  type="date"
                  value={formData.arrestDate}
                  onChange={(e) => setFormData({ ...formData, arrestDate: e.target.value })}
                  data-testid="input-arrest-date"
                />
              </div>
            </div>
          </div>
          
          {/* Photo Upload */}
          <div>
            <Label>Criminal Photo</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Camera className="mx-auto text-4xl text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground mb-3">PNG, JPG up to 5MB</p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
                data-testid="input-photo"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => document.getElementById("photo-upload")?.click()}
                data-testid="button-choose-file"
              >
                {photoFile ? photoFile.name : "Choose File"}
              </Button>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              data-testid="button-add-criminal"
            >
              {createMutation.isPending ? "Adding..." : "Add Criminal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
