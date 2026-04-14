let lastResults = [];
let chart;

const feedstocks = [
  { name: "Wood", rawHHV: 18.5, yield: 62, hhv: 23, carbon: 70 },
  { name: "Corn Stover", rawHHV: 17, yield: 58, hhv: 21.5, carbon: 64 },
  { name: "Algae", rawHHV: 20, yield: 52, hhv: 24, carbon: 60 },
  { name: "Food Waste", rawHHV: 19, yield: 60, hhv: 22.5, carbon: 66 }
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calculate(feedstock, M, T, t) {
  const dT = T - 220;
  const dt = (t - 60) / 60;
  const dM = M - 20;

  let yieldVal = feedstock.yield - 0.12 * dT - 1.8 * dt - 0.03 * dM;
  let hhvVal = feedstock.hhv + 0.045 * dT + 0.35 * dt - 0.01 * dM;
  let carbonVal = feedstock.carbon - 0.10 * dT - 1.2 * dt - 0.015 * dM;

  yieldVal = clamp(yieldVal, 25, 80);
  hhvVal = clamp(hhvVal, 16, 34);
  carbonVal = clamp(carbonVal, 25, 90);

  const energy = (yieldVal / 100) * (hhvVal / feedstock.rawHHV) * 100;

  return {
    feedstock: feedstock.name,
    hydrocharYield: yieldVal,
    hydrocharHHV: hhvVal,
    carbonRetention: carbonVal,
    energyYield: energy
  };
}

function score(results, goal) {
  const eMax = Math.max(...results.map(r => r.energyYield));
  const cMax = Math.max(...results.map(r => r.carbonRetention));

  return results.map(r => {
    let s;

    if (goal === "energy") {
      s = 0.6 * (r.energyYield / eMax) + 0.4 * (r.carbonRetention / cMax);
    } else if (goal === "carbon") {
      s = 0.6 * (r.carbonRetention / cMax) + 0.4 * (r.energyYield / eMax);
    } else {
      s = 0.5 * (r.energyYield / eMax) + 0.5 * (r.carbonRetention / cMax);
    }

    return { ...r, score: s * 100 };
  });
}

function createChart(results) {
  const ctx = document.getElementById("comparisonChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: results.map(r => r.feedstock),
      datasets: [
        { label: "Energy Yield (%)", data: results.map(r => r.energyYield) },
        { label: "Carbon Retention (%)", data: results.map(r => r.carbonRetention) },
        { label: "Hydrochar Yield (%)", data: results.map(r => r.hydrocharYield) }
      ]
    }
  });
}

function compareFeedstocks() {
  const M = parseFloat(document.getElementById("moistureContent").value);
  const T = parseFloat(document.getElementById("temperature").value);
  const t = parseFloat(document.getElementById("residenceTime").value);
  const goal = document.getElementById("optimizationGoal").value;

  let results = feedstocks.map(f => calculate(f, M, T, t));
  results = score(results, goal);

  results.sort((a, b) => b.score - a.score);

  lastResults = results;
  createChart(results);

  let html = `<h3>Recommended: ${results[0].feedstock}</h3>`;

  results.forEach(r => {
    html += `
      <div class="scenario">
        <strong>${r.feedstock}</strong><br>
        Energy Yield: ${r.energyYield.toFixed(2)}%<br>
        Carbon Retention: ${r.carbonRetention.toFixed(2)}%<br>
        Hydrochar Yield: ${r.hydrocharYield.toFixed(2)}%<br>
        Score: ${r.score.toFixed(2)}%
      </div>
    `;
  });

  document.getElementById("results").innerHTML = html;
}

function downloadChart() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("comparisonChart").toDataURL();
  link.click();
}

function downloadCSV() {
  let csv = "Feedstock,Energy,Carbon,Yield\n";

  lastResults.forEach(r => {
    csv += `${r.feedstock},${r.energyYield},${r.carbonRetention},${r.hydrocharYield}\n`;
  });

  const blob = new Blob([csv]);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "results.csv";
  link.click();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("HTC Report", 10, 10);

  let y = 20;
  lastResults.forEach(r => {
    doc.text(`${r.feedstock}`, 10, y);
    y += 5;
    doc.text(`Energy: ${r.energyYield.toFixed(2)}%`, 10, y);
    y += 5;
    doc.text(`Carbon: ${r.carbonRetention.toFixed(2)}%`, 10, y);
    y += 10;
  });

  doc.save("report.pdf");
}

document.getElementById("runBtn").addEventListener("click", compareFeedstocks);
