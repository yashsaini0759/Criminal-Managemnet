import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { CriminalRecord, FirRecord } from "@shared/schema";

export function exportCriminalsToPDF(criminals: CriminalRecord[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("Criminal Records Report", 20, 20);
  
  doc.setFontSize(12);
  let yPosition = 40;
  
  criminals.forEach((criminal, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(`${index + 1}. ${criminal.name}`, 20, yPosition);
    doc.text(`   Age: ${criminal.age}, Gender: ${criminal.gender}`, 20, yPosition + 10);
    doc.text(`   Crime: ${criminal.crimeType}, Status: ${criminal.caseStatus}`, 20, yPosition + 20);
    doc.text(`   FIR: ${criminal.firNumber || "N/A"}`, 20, yPosition + 30);
    
    yPosition += 50;
  });
  
  doc.save("criminal-records.pdf");
}

export function exportCriminalsToExcel(criminals: CriminalRecord[]) {
  const data = criminals.map(criminal => ({
    Name: criminal.name,
    Age: criminal.age,
    Gender: criminal.gender,
    "Crime Type": criminal.crimeType,
    "FIR Number": criminal.firNumber || "N/A",
    "Case Status": criminal.caseStatus,
    "Arrest Date": criminal.arrestDate ? new Date(criminal.arrestDate).toLocaleDateString() : "N/A",
    Address: criminal.address || "N/A",
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Criminal Records");
  
  XLSX.writeFile(wb, "criminal-records.xlsx");
}

export function exportFirsToPDF(firs: FirRecord[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("FIR Records Report", 20, 20);
  
  doc.setFontSize(12);
  let yPosition = 40;
  
  firs.forEach((fir, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(`${index + 1}. FIR: ${fir.firNumber}`, 20, yPosition);
    doc.text(`   Date: ${new Date(fir.firDate).toLocaleDateString()}`, 20, yPosition + 10);
    doc.text(`   Description: ${fir.description.substring(0, 100)}...`, 20, yPosition + 20);
    
    yPosition += 40;
  });
  
  doc.save("fir-records.pdf");
}

export function exportFirsToExcel(firs: FirRecord[]) {
  const data = firs.map(fir => ({
    "FIR Number": fir.firNumber,
    "FIR Date": new Date(fir.firDate).toLocaleDateString(),
    Description: fir.description,
    "Criminal ID": fir.criminalId || "N/A",
  }));
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "FIR Records");
  
  XLSX.writeFile(wb, "fir-records.xlsx");
}
