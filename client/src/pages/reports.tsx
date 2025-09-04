import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, FileText, FileDown, Download } from "lucide-react";
import { exportCriminalsToPDF, exportCriminalsToExcel, exportFirsToPDF, exportFirsToExcel } from "@/lib/exports";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();
  const [criminalDateRange, setCriminalDateRange] = useState({ from: "", to: "" });
  const [firFilter, setFirFilter] = useState("all");

  const { data: criminals = [] } = useQuery({
    queryKey: ["/api/criminals"],
  });

  const { data: firs = [] } = useQuery({
    queryKey: ["/api/firs"],
  });

  const handleCriminalPDFExport = () => {
    try {
      exportCriminalsToPDF(criminals);
      toast({
        title: "Success",
        description: "Criminal records exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleCriminalExcelExport = () => {
    try {
      exportCriminalsToExcel(criminals);
      toast({
        title: "Success",
        description: "Criminal records exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Excel",
        variant: "destructive",
      });
    }
  };

  const handleFirPDFExport = () => {
    try {
      exportFirsToPDF(firs);
      toast({
        title: "Success",
        description: "FIR records exported to PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleFirExcelExport = () => {
    try {
      exportFirsToExcel(firs);
      toast({
        title: "Success",
        description: "FIR records exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate and export system reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Criminal Records Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="text-primary" />
              </div>
              <div>
                <CardTitle>Criminal Records Report</CardTitle>
                <p className="text-sm text-muted-foreground">Export complete criminal database</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={criminalDateRange.from}
                  onChange={(e) => setCriminalDateRange({ ...criminalDateRange, from: e.target.value })}
                  data-testid="input-criminal-date-from"
                />
                <Input
                  type="date"
                  value={criminalDateRange.to}
                  onChange={(e) => setCriminalDateRange({ ...criminalDateRange, to: e.target.value })}
                  data-testid="input-criminal-date-to"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCriminalPDFExport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-export-criminals-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleCriminalExcelExport}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-export-criminals-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FIR Records Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <FileText className="text-amber-600" />
              </div>
              <div>
                <CardTitle>FIR Records Report</CardTitle>
                <p className="text-sm text-muted-foreground">Export FIR database records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Filter Options</Label>
              <Select value={firFilter} onValueChange={setFirFilter}>
                <SelectTrigger data-testid="select-fir-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All FIRs</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="closed">Closed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleFirPDFExport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-export-firs-pdf"
              >
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleFirExcelExport}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-export-firs-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{criminals.length}</p>
              <p className="text-sm text-muted-foreground">Total Criminal Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{firs.length}</p>
              <p className="text-sm text-muted-foreground">Total FIR Records</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {criminals.filter(c => c.caseStatus === "closed").length}
              </p>
              <p className="text-sm text-muted-foreground">Closed Cases</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
