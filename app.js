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

  // 🔥 Moisture + Latent Heat Integration
  const moistureInput = document.getElementById("moistureContent").value;
  const MC = parseFloat(moistureInput) / 100;

  const HV_dry = feedstock.heatingValue_GJ_per_t;

  // Latent heat of vaporization (GJ/t)
  const h_vap = 2.26;

  const effectiveHV = (HV_dry * (1 - MC)) - (MC * h_vap);

  // ❗ Safety check
  if (effectiveHV <= 0) {
    return {
      feedstock: feedstock.name,
      error: "Moisture too high — no usable energy from biomass."
    };
  }

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
    annualBiomassEnergy_GJ / effectiveHV;

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
    annualBiomassRequired_t,
    dailyBiomassRequired_t,
    biomassLandRequired_ha,
    plantLandRequired_ha,
    note: feedstock.note
  };
}

function buildScenarioHTML(result, rank) {

  if (result.error) {
    return `
      <div class="scenario">
        <h3>${result.feedstock}</h3>
        <p style="color:red;">${result.error}</p>
      </div>
    `;
  }

  return `
    <div class="scenario">
      <h3>Option ${rank}: ${result.feedstock}</h3>
      <div class="grid">
        <div><strong>Optimization Level:</strong><br>${result.optimizationLevel}</div>
        <div><strong>Efficiency:</strong><br>${formatNumber(result.efficiency_percent)}%</div>
        <div><strong>Biomass:</strong><br>${formatNumber(result.dailyBiomassRequired_t)} t/day</div>
        <div><strong>Annual Biomass:</strong><br>${formatNumber(result.annualBiomassRequired_t)} t/year</div>
        <div><strong>Land (Biomass):</strong><br>${formatNumber(result.biomassLandRequired_ha)} ha</div>
        <div><strong>Land (Plant):</strong><br>${formatNumber(result.plantLandRequired_ha)} ha</div>
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
    resultsDiv.innerHTML = `<p>Please enter a valid power output.</p>`;
    return;
  }

  const optimization = optimizationMap[optimizationLevel];

  const results = feedstocks.map(feedstock =>
    calculateScenario(powerMW, feedstock, optimization)
  );

  results.sort((a, b) => (a.biomassLandRequired_ha || 0) - (b.biomassLandRequired_ha || 0));

  let html = `
    <p>
      For <strong>${formatNumber(powerMW, 1)} MW</strong>, here are recommended options:
    </p>
  `;

  results.forEach((result, index) => {
    html += buildScenarioHTML(result, index + 1);
  });

  resultsDiv.innerHTML = html;
}

document.getElementById("runBtn").addEventListener("click", generateRecommendations);
