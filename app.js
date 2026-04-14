let lastResults = [];
let chart;
const feedstocks = [
  {
    name: "Wood",
    rawHHV_MJ_per_kg: 18.5,
    baseHydrocharYield_percent: 62,
    baseHydrocharHHV_MJ_per_kg: 23.0,
    baseCarbonRetention_percent: 70,
    note: "Good all-around HTC feedstock with strong solid yield and good carbon retention."
  },
  {
    name: "Corn Stover",
    rawHHV_MJ_per_kg: 17.0,
    baseHydrocharYield_percent: 58,
    baseHydrocharHHV_MJ_per_kg: 21.5,
    baseCarbonRetention_percent: 64,
    note: "Useful agricultural residue comparison with moderate energy and carbon performance."
  },
  {
    name: "Algae",
    rawHHV_MJ_per_kg: 20.0,
    baseHydrocharYield_percent: 52,
    baseHydrocharHHV_MJ_per_kg: 24.0,
    baseCarbonRetention_percent: 60,
    note: "Naturally wet feedstock with strong HTC relevance but often more variable hydrochar behavior."
  },
  {
    name: "Food Waste",
    rawHHV_MJ_per_kg: 19.0,
    baseHydrocharYield_percent: 60,
    baseHydrocharHHV_MJ_per_kg: 22.5,
    baseCarbonRetention_percent: 66,
    note: "Promising waste-management feedstock with strong energy recovery potential."
  }
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function normalize(value, min, max) {
  if (max === min) return 1;
  return (value - min) / (max - min);
}

function calculateFeedstockPerformance(feedstock, moisturePercent, temperatureC, residenceTimeMin, goal) {
  // Reference conditions for the screening model
  const T_ref = 220;
  const t_ref = 60;
  const M_ref = 20;

  const dT = temperatureC - T_ref;
  const dt_hours = (residenceTimeMin - t_ref) / 60;
  const dM = moisturePercent - M_ref;

  // Hydrochar yield model:
  // higher temperature and longer time generally reduce mass yield
  let hydrocharYield =
    feedstock.baseHydrocharYield_percent
    - 0.12 * dT
    - 1.8 * dt_hours
    - 0.03 * dM;

  // Hydrochar HHV model:
  // higher temperature and time tend to increase HHV somewhat
  let hydrocharHHV =
    feedstock.baseHydrocharHHV_MJ_per_kg
    + 0.045 * dT
    + 0.35 * dt_hours
    - 0.01 * dM;

  // Carbon retention model:
  // more severe HTC tends to lower solid carbon retention
  let carbonRetention =
    feedstock.baseCarbonRetention_percent
    - 0.10 * dT
    - 1.2 * dt_hours
    - 0.015 * dM;

  // Clamp outputs to reasonable screening-level ranges
  hydrocharYield = clamp(hydrocharYield, 25, 80);
  hydrocharHHV = clamp(hydrocharHHV, 16, 34);
  carbonRetention = clamp(carbonRetention, 25, 90);

  // Energy yield:
  // how much energy remains in hydrochar relative to original feedstock basis
  const energyYield =
    (hydrocharYield / 100) * (hydrocharHHV / feedstock.rawHHV_MJ_per_kg) * 100;

  // Simple conversion efficiency index for display
  const conversionEfficiency =
    0.65 * energyYield + 0.35 * carbonRetention;

  return {
    feedstock: feedstock.name,
    rawHHV_MJ_per_kg: feedstock.rawHHV_MJ_per_kg,
    hydrocharYield_percent: hydrocharYield,
    hydrocharHHV_MJ_per_kg: hydrocharHHV,
    energyYield_percent: energyYield,
    carbonRetention_percent: carbonRetention,
    conversionEfficiency_percent: conversionEfficiency,
    note: feedstock.note
  };
}

function applyScoring(results, goal) {
  const energyValues = results.map(r => r.energyYield_percent);
  const carbonValues = results.map(r => r.carbonRetention_percent);
  const hhvValues = results.map(r => r.hydrocharHHV_MJ_per_kg);

  const energyMin = Math.min(...energyValues);
  const energyMax = Math.max(...energyValues);
  const carbonMin = Math.min(...carbonValues);
  const carbonMax = Math.max(...carbonValues);
  const hhvMin = Math.min(...hhvValues);
  const hhvMax = Math.max(...hhvValues);

  return results.map(result => {
    const energyScore = normalize(result.energyYield_percent, energyMin, energyMax);
    const carbonScore = normalize(result.carbonRetention_percent, carbonMin, carbonMax);
    const hhvScore = normalize(result.hydrocharHHV_MJ_per_kg, hhvMin, hhvMax);

    let overallScore = 0;

    if (goal === "energy") {
      overallScore = 0.60 * energyScore + 0.25 * hhvScore + 0.15 * carbonScore;
    } else if (goal === "carbon") {
      overallScore = 0.60 * carbonScore + 0.25 * energyScore + 0.15 * hhvScore;
    } else {
      overallScore = 0.40 * energyScore + 0.40 * carbonScore + 0.20 * hhvScore;
    }

    return {
      ...result,
      overallScore_percent: overallScore * 100
    };
  });
}

function getRecommendationExplanation(bestResult, goal) {
  if (goal === "energy") {
    return `${bestResult.feedstock} is recommended because it provides the strongest overall energy-focused performance under the selected HTC conditions, with favorable energy yield and hydrochar heating value.`;
  }

  if (goal === "carbon") {
    return `${bestResult.feedstock} is recommended because it retains carbon in the solid hydrochar more effectively than the alternatives under the selected HTC conditions.`;
  }

  return `${bestResult.feedstock} is recommended because it offers the best balance between usable energy and carbon retention under the selected HTC conditions.`;
}

function buildResultCard(result, rank) {
  return `
    <div class="scenario">
      <h3>Option ${rank}: ${result.feedstock}</h3>
      <div class="grid">
        <div><strong>Raw Biomass HHV:</strong><br>${formatNumber(result.rawHHV_MJ_per_kg)} MJ/kg</div>
        <div><strong>Hydrochar Yield:</strong><br>${formatNumber(result.hydrocharYield_percent)}%</div>
        <div><strong>Hydrochar HHV:</strong><br>${formatNumber(result.hydrocharHHV_MJ_per_kg)} MJ/kg</div>
        <div><strong>Energy Yield:</strong><br>${formatNumber(result.energyYield_percent)}%</div>
        <div><strong>Carbon Retention:</strong><br>${formatNumber(result.carbonRetention_percent)}%</div>
        <div><strong>Conversion Index:</strong><br>${formatNumber(result.conversionEfficiency_percent)}%</div>
        <div><strong>Overall Score:</strong><br>${formatNumber(result.overallScore_percent)}%</div>
      </div>
      <div class="note">${result.note}</div>
    </div>
  `;
}

function compareFeedstocks() {
  const moistureContent = parseFloat(document.getElementById("moistureContent").value);
  const temperature = parseFloat(document.getElementById("temperature").value);
  const residenceTime = parseFloat(document.getElementById("residenceTime").value);
  const optimizationGoal = document.getElementById("optimizationGoal").value;
  const resultsDiv = document.getElementById("results");

  if (isNaN(moistureContent) || moistureContent < 0 || moistureContent > 90) {
    resultsDiv.innerHTML = `<p>Please enter a valid moisture content between 0 and 90%.</p>`;
    return;
  }

  if (isNaN(temperature) || temperature < 180 || temperature > 280) {
    resultsDiv.innerHTML = `<p>Please enter a valid HTC temperature between 180 and 280 °C.</p>`;
    return;
  }

  if (isNaN(residenceTime) || residenceTime < 5 || residenceTime > 240) {
    resultsDiv.innerHTML = `<p>Please enter a valid residence time between 5 and 240 minutes.</p>`;
    return;
  }

  const rawResults = feedstocks.map(feedstock =>
    calculateFeedstockPerformance(feedstock, moistureContent, temperature, residenceTime, optimizationGoal)
  );

  const scoredResults = applyScoring(rawResults, optimizationGoal);

  lastResults = scoredResults;
  createComparisonChart(scoredResults);

  const bestResult = scoredResults[0];
  const explanation = getRecommendationExplanation(bestResult, optimizationGoal);

  let html = `
    <p>
      Under the selected HTC conditions of
      <strong>${formatNumber(temperature, 0)} °C</strong>,
      <strong>${formatNumber(residenceTime, 0)} min</strong>, and
      <strong>${formatNumber(moistureContent, 0)}% moisture</strong>,
      the recommended feedstock is <strong>${bestResult.feedstock}</strong>.
    </p>
    <p>${explanation}</p>
  `;

  scoredResults.forEach((result, index) => {
    html += buildResultCard(result, index + 1);
  });

  resultsDiv.innerHTML = html;
}

document.getElementById("runBtn").addEventListener("click", compareFeedstocks);

function createComparisonChart(results) {
  const ctx = document.getElementById("comparisonChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: results.map(r => r.feedstock),
      datasets: [
        {
          label: "Energy Yield (%)",
          data: results.map(r => r.energyYield_percent)
        },
        {
          label: "Carbon Retention (%)",
          data: results.map(r => r.carbonRetention_percent)
        },
        {
          label: "Hydrochar Yield (%)",
          data: results.map(r => r.hydrocharYield_percent)
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
function downloadChart() {
  const link = document.createElement("a");
  link.download = "htc_chart.png";
  link.href = document.getElementById("comparisonChart").toDataURL();
  link.click();
}
