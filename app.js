// ---------------------------------------------
// HTC Biomass Sizing Tool - Version 1
// Screening-level engineering estimator
// ---------------------------------------------

const feedstocks = [
  {
    name: "Wood Chips",
    heatingValue_GJ_per_t: 18.0,
    yield_t_per_ha_yr: 12.0,
    baseEfficiency: 0.28,
    basePlantLand_ha_per_MW: 0.22,
    note: "Simple and conservative option with moderate land demand."
  },
  {
    name: "Corn Stover",
    heatingValue_GJ_per_t: 16.0,
    yield_t_per_ha_yr: 8.0,
    baseEfficiency: 0.25,
    basePlantLand_ha_per_MW: 0.20,
    note: "Agricultural residue option with lower energy density."
  },
  {
    name: "Algae",
    heatingValue_GJ_per_t: 20.0,
    yield_t_per_ha_yr: 30.0,
    baseEfficiency: 0.32,
    basePlantLand_ha_per_MW: 0.30,
    note: "High productivity option with more advanced processing assumptions."
  }
];

const optimizationMap = {
  low: {
    efficiencyMultiplier: 0.85,
    yieldMultiplier: 0.80,
    plantMultiplier: 1.20,
    label: "Low"
  },
  medium: {
    efficiencyMultiplier: 1.00,
    yieldMultiplier: 1.00,
    plantMultiplier: 1.00,
    label: "Medium"
  },
  high: {
    efficiencyMultiplier: 1.15,
    yieldMultiplier: 1.15,
    plantMultiplier: 0.90,
    label: "High"
  }
};

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function calculateScenario(powerMW, feedstock, optimization) {
  const annualElectricity_MWh = powerMW * 8760;

  const adjustedEfficiency =
    feedstock.baseEfficiency * optimization.efficiencyMultiplier;

  const adjustedYield =
    feedstock.yield_t_per_ha_yr * optimization.yieldMultiplier;

  const adjustedPlantLand =
    feedstock.basePlantLand_ha_per_MW * optimization.plantMultiplier;

  const annualBiomassEnergy_GJ =
    (annualElectricity_MWh * 3.6) / adjustedEfficiency;

  const annualBiomassRequired_t =
    annualBiomassEnergy_GJ / feedstock.heatingValue_GJ_per_t;

  const dailyBiomassRequired_t =
    annualBiomassRequired_t / 365;

  const biomassLandRequired_ha =
    annualBiomassRequired_t / adjustedYield;

  const plantLandRequired_ha =
    powerMW * adjustedPlantLand;

  return {
    feedstock: feedstock.name,
    optimizationLevel: optimization.label,
    efficiency_percent: adjustedEfficiency * 100,
    annualElectricity_MWh,
    annualBiomassRequired_t,
    dailyBiomassRequired_t,
    biomassLandRequired_ha,
    plantLandRequired_ha,
    note: feedstock.note
  };
}

function buildScenarioHTML(result, rank) {
  return `
    <div class="scenario">
      <h3>Option ${rank}: ${result.feedstock}</h3>
      <div class="grid">
        <div><strong>Optimization Level:</strong><br>${result.optimizationLevel}</div>
        <div><strong>Estimated Efficiency:</strong><br>${formatNumber(result.efficiency_percent)}%</div>
        <div><strong>Biomass Required:</strong><br>${formatNumber(result.dailyBiomassRequired_t)} t/day</div>
        <div><strong>Biomass Required:</strong><br>${formatNumber(result.annualBiomassRequired_t)} t/year</div>
        <div><strong>Land for Biomass:</strong><br>${formatNumber(result.biomassLandRequired_ha)} ha</div>
        <div><strong>Land for HTC Plant:</strong><br>${formatNumber(result.plantLandRequired_ha)} ha</div>
      </div>
      <div class="note">${result.note}</div>
    </div>
  `;
}

function generateRecommendations() {
  const powerInput = document.getElementById("powerOutput").value;
  const optimizationLevel = document.getElementById("optimizationLevel").value;
  const resultsDiv = document.getElementById("results");

  const powerMW = parseFloat(powerInput);

  if (isNaN(powerMW) || powerMW <= 0) {
    resultsDiv.innerHTML = `<p>Please enter a valid power output greater than 0 MW.</p>`;
    return;
  }

  const optimization = optimizationMap[optimizationLevel];

  const results = feedstocks.map(feedstock =>
    calculateScenario(powerMW, feedstock, optimization)
  );

  // Sort from least biomass land required to most
  results.sort((a, b) => a.biomassLandRequired_ha - b.biomassLandRequired_ha);

  let html = `
    <p>
      For a desired output of <strong>${formatNumber(powerMW, 1)} MW</strong>,
      the tool recommends the following screening-level options:
    </p>
  `;

  results.forEach((result, index) => {
    html += buildScenarioHTML(result, index + 1);
  });

  resultsDiv.innerHTML = html;
}

document.getElementById("runBtn").addEventListener("click", generateRecommendations);
