import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit } from "lucide-react";
import { AddFirModal } from "@/components/modals/add-fir-modal";
import { FirRecord } from "@shared/schema";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export default function FirRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const user = getCurrentUser();

  const { data: firs = [], isLoading } = useQuery({
    queryKey: ["/api/firs", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      
      const response = await fetch(`/api/firs?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch FIR records");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">FIR Records</h2>
          <p className="text-muted-foreground">First Information Reports management</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-fir">
          <Plus className="w-4 h-4 mr-2" />
          Add FIR
        </Button>
      </div>

      {/* FIR Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search FIR</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="FIR number, description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-fir"
                />
              </div>
            </div>
            <div>
              <Label>Date Range</Label>
              <Input
                type="date"
                data-testid="input-date-range"
              />
            </div>
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" data-testid="button-search-fir">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FIR Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FIR Number</TableHead>
                <TableHead>Criminal Name</TableHead>
                <TableHead>FIR Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : firs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8" data-testid="text-no-firs">
                    No FIR records found
                  </TableCell>
                </TableRow>
              ) : (
                firs.map((fir: FirRecord) => (
                  <TableRow key={fir.id} data-testid={`row-fir-${fir.id}`}>
                    <TableCell className="font-medium">{fir.firNumber}</TableCell>
                    <TableCell>{fir.criminalId ? "Associated Criminal" : "N/A"}</TableCell>
                    <TableCell>{new Date(fir.firDate).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{fir.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" data-testid={`button-view-fir-${fir.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isAdmin(user) && (
                          <Button variant="ghost" size="sm" data-testid={`button-edit-fir-${fir.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
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

      <AddFirModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
