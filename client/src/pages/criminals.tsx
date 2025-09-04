import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { AddCriminalModal } from "@/components/modals/add-criminal-modal";
import { CriminalRecord } from "@shared/schema";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Criminals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ crimeType: "", status: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const user = getCurrentUser();
  const { toast } = useToast();

  const { data: criminals = [], isLoading } = useQuery({
    queryKey: ["/api/criminals", searchQuery, filters.crimeType, filters.status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filters.crimeType) params.set("crimeType", filters.crimeType);
      if (filters.status) params.set("status", filters.status);
      
      const response = await fetch(`/api/criminals?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch criminals");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/criminals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/criminals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "Criminal record deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete criminal record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this criminal record?")) {
      deleteMutation.mutate(id);
    }
  };

  const applyFilters = () => {
    // Trigger refetch with current filters
    queryClient.invalidateQueries({ queryKey: ["/api/criminals"] });
  };

  const getCrimeTypeBadgeColor = (crimeType: string) => {
    const colors = {
      theft: "bg-red-100 text-red-800",
      fraud: "bg-purple-100 text-purple-800",
      assault: "bg-orange-100 text-orange-800",
      robbery: "bg-yellow-100 text-yellow-800",
      murder: "bg-gray-100 text-gray-800",
      drug_trafficking: "bg-indigo-100 text-indigo-800",
    };
    return colors[crimeType as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      open: "bg-blue-100 text-blue-800",
      pending: "bg-orange-100 text-orange-800",
      closed: "bg-green-100 text-green-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Criminal Records</h2>
          <p className="text-muted-foreground">Manage criminal database records</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-criminal">
          <Plus className="w-4 h-4 mr-2" />
          Add Criminal
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, ID..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            <div>
              <Label>Crime Type</Label>
              <Select value={filters.crimeType} onValueChange={(value) => setFilters({ ...filters, crimeType: value })}>
                <SelectTrigger data-testid="select-crime-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
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
              <Label>Case Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} variant="secondary" className="w-full" data-testid="button-filter">
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Crime Type</TableHead>
                <TableHead>FIR Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : criminals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8" data-testid="text-no-criminals">
                    No criminal records found
                  </TableCell>
                </TableRow>
              ) : (
                criminals.map((criminal: CriminalRecord) => (
                  <TableRow key={criminal.id} data-testid={`row-criminal-${criminal.id}`}>
                    <TableCell>
                      {criminal.photo ? (
                        <img
                          src={criminal.photo}
                          alt={`${criminal.name} photo`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">
                            {criminal.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{criminal.name}</div>
                        <div className="text-sm text-muted-foreground">ID: {criminal.id.slice(0, 8)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{criminal.age}</TableCell>
                    <TableCell>
                      <Badge className={getCrimeTypeBadgeColor(criminal.crimeType)}>
                        {criminal.crimeType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{criminal.firNumber || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(criminal.caseStatus)}>
                        {criminal.caseStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-${criminal.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isAdmin(user) && (
                          <>
                            <Button variant="ghost" size="sm" data-testid={`button-edit-${criminal.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(criminal.id)}
                              data-testid={`button-delete-${criminal.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AddCriminalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
