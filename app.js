console.log("JS is connected");

document.getElementById("runBtn").addEventListener("click", runHTC);

function runHTC() {

  const M = parseFloat(document.getElementById("moistureContent").value);
  const T = parseFloat(document.getElementById("temperature").value);
  const t = parseFloat(document.getElementById("residenceTime").value);
  const goal = document.getElementById("optimizationGoal").value;

  if (isNaN(M) || isNaN(T) || isNaN(t)) {
    document.getElementById("results").innerText = "Please enter all inputs.";
    return;
  }

  const feedstocks = {
    Wood: { carbon: 0.50, energy: 18 },
    "Corn Stover": { carbon: 0.45, energy: 16 },
    Algae: { carbon: 0.55, energy: 20 },
    "Food Waste": { carbon: 0.48, energy: 17 }
  };

  let output = `--- HTC Comparison Results ---\n\n`;

  for (let name in feedstocks) {
    const base = feedstocks[name];

    let yieldVal = 0.6 - 0.001 * (T - 180) - 0.0005 * t;
    let carbonContent = base.carbon + 0.002 * (T - 180);
    let energyDensity = base.energy + 0.01 * (T - 180);

    yieldVal *= (1 - M / 100);

    if (goal === "energy") {
      energyDensity *= 1.1;
    } else if (goal === "yield") {
      yieldVal *= 1.1;
    } else if (goal === "carbon") {
      carbonContent *= 1.1;
    }

    output += `
${name}
-------------------------
Yield: ${(yieldVal * 100).toFixed(2)} %
Carbon: ${(carbonContent * 100).toFixed(2)} %
Energy: ${energyDensity.toFixed(2)} MJ/kg

`;
  }

  output += `--- Conditions ---
Temperature: ${T} °C
Time: ${t} min
Moisture: ${M} %
`;

  document.getElementById("results").innerText = output;
}
