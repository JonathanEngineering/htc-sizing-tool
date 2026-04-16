function runHTC() {
  // Get inputs
  const feedstock = document.getElementById("feedstock").value;
  const M = parseFloat(document.getElementById("moistureContent").value);
  const T = parseFloat(document.getElementById("temperature").value);
  const t = parseFloat(document.getElementById("residenceTime").value);
  const goal = document.getElementById("optimizationGoal").value;

  // Input validation
  if (isNaN(M) || isNaN(T) || isNaN(t)) {
    document.getElementById("results").innerText = "Please enter all inputs.";
    return;
  }

  // Feedstock base properties (simplified engineering estimates)
  const feedstockData = {
    wood: { carbon: 0.50, energy: 18 },
    corn: { carbon: 0.45, energy: 16 },
    algae: { carbon: 0.55, energy: 20 },
    food: { carbon: 0.48, energy: 17 }
  };

  const base = feedstockData[feedstock];

  // --- HTC MODEL (Simplified) ---

  // Hydrochar yield (%)
  let yield = 0.6 - 0.001 * (T - 180) - 0.0005 * t;

  // Carbon content increase
  let carbonContent = base.carbon + 0.002 * (T - 180);

  // Energy density (MJ/kg)
  let energyDensity = base.energy + 0.01 * (T - 180);

  // Adjust for moisture
  yield *= (1 - M / 100);

  // Optimization adjustments
  if (goal === "energy") {
    energyDensity *= 1.1;
  } else if (goal === "yield") {
    yield *= 1.1;
  } else if (goal === "carbon") {
    carbonContent *= 1.1;
  }

  // Format results
  let output = `
--- HTC Simulation Results ---

Feedstock: ${feedstock}

Hydrochar Yield: ${(yield * 100).toFixed(2)} %
Carbon Content: ${(carbonContent * 100).toFixed(2)} %
Energy Density: ${energyDensity.toFixed(2)} MJ/kg

--- Process Conditions ---
Temperature: ${T} °C
Residence Time: ${t} min
Moisture Content: ${M} %

--- Notes ---
Higher temperature → higher carbonization
Longer time → lower yield but better quality
`;

  document.getElementById("results").innerText = output;
}
