function exportToExcel(results, inputs) {
  // Create a worksheet array (AOA = Array of Arrays)
  const data = [];

  // Title
  data.push(["HTC Feedstock Comparison Results"]);
  data.push([]);

  // Inputs section
  data.push(["Inputs"]);
  data.push(["Moisture (%)", inputs.moisture]);
  data.push(["Temperature (°C)", inputs.temperature]);
  data.push(["Residence Time (min)", inputs.time]);
  data.push(["Optimization Goal", inputs.goal]);
  data.push([]);

  // Header row
  data.push([
    "Feedstock",
    "Raw HHV (MJ/kg)",
    "Hydrochar Yield (%)",
    "Hydrochar HHV (MJ/kg)",
    "Energy Yield (%)",
    "Carbon Retention (%)",
    "Conversion Index (%)",
    "Overall Score (%)"
  ]);

  // Data rows
  results.forEach(r => {
    data.push([
      r.feedstock,
      r.rawHHV_MJ_per_kg,
      r.hydrocharYield_percent,
      r.hydrocharHHV_MJ_per_kg,
      r.energyYield_percent,
      r.carbonRetention_percent,
      r.conversionEfficiency_percent,
      r.overallScore_percent
    ]);
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, "Results");

  // Export file
  XLSX.writeFile(wb, "HTC_Results.xlsx");
}
