let chart;
let lastResults = [];

const feedstocks = [
  { name: "Wood", raw: 18.5, yield: 62, hhv: 23, carbon: 70 },
  { name: "Corn Stover", raw: 17, yield: 58, hhv: 21.5, carbon: 64 },
  { name: "Algae", raw: 20, yield: 52, hhv: 24, carbon: 60 },
  { name: "Food Waste", raw: 19, yield: 60, hhv: 22.5, carbon: 66 }
];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calculate(f, M, T, t) {
  const dT = T - 220;
  const dt = (t - 60) / 60;
  const dM = M - 20;

  let yieldVal = f.yield - 0.12 * dT - 1.8 * dt - 0.03 * dM;
  let hhvVal = f.hhv + 0.045 * dT + 0.35 * dt - 0.01 * dM;
  let carbonVal = f.carbon - 0.10 * dT - 1.2 * dt - 0.015 * dM;

  yieldVal = clamp(yieldVal, 25, 80);
  hhvVal = clamp(hhvVal, 16, 34);
  carbonVal = clamp(carbonVal, 25, 90);

  const energy = (yieldVal / 100) * (hhvVal / f.raw) * 100;

  return {
    name: f.name,
    yield: yieldVal,
    hhv: hhvVal,
    carbon: carbonVal,
    energy: energy
  };
}

function score(results, goal) {
  const eMax = Math.max(...results.map(r => r.energy));
  const cMax = Math.max(...results.map(r => r.carbon));

  return results.map(r => {
    let s;

    if (goal === "energy") {
      s = 0.6 * (r.energy / eMax) + 0.4 * (r.carbon / cMax);
    } else if (goal === "carbon") {
      s = 0.6 * (r.carbon / cMax) + 0.4 * (r.energy / eMax);
    } else {
      s = 0.5 * (r.energy / eMax) + 0.5 * (r.carbon / cMax);
    }

    return { ...r, score: s * 100 };
  });
}

function createChart(data) {
  const ctx = document.getElementById("chartCanvas").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.name),
      datasets: [
        {
          label: "Energy Yield (%)",
          data: data.map(d => d.energy)
        },
        {
          label: "Carbon Retention (%)",
          data: data.map(d => d.carbon)
        },
        {
          label: "Hydrochar Yield (%)",
          data: data.map(d => d.yield)
        }
      ]
    },
    options: {
      responsive: true
    }
  });
}

function compare() {
  const M = parseFloat(document.getElementById("moistureContent").value);
  const T = parseFloat(document.getElementById("temperature").value);
  const t = parseFloat(document.getElementById("residenceTime").value);
  const goal = document.getElementById("optimizationGoal").value;

  let results = feedstocks.map(f => calculate(f, M, T, t));
  results = score(results, goal);

  results.sort((a, b) => b.score - a.score);

  lastResults = results;

  createChart(results);

  let html = `<h3>Recommended: ${results[0].name}</h3>`;

  results.forEach(r => {
    html += `
      <div class="scenario">
        <strong>${r.name}</strong><br>
        Energy: ${r.energy.toFixed(2)}%<br>
        Carbon: ${r.carbon.toFixed(2)}%<br>
        Yield: ${r.yield.toFixed(2)}%<br>
        Score: ${r.score.toFixed(2)}%
      </div>
    `;
  });

  document.getElementById("results").innerHTML = html;
}

function downloadPNG() {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = document.getElementById("chartCanvas").toDataURL();
  link.click();
}

function downloadCSV() {
  let csv = "Feedstock,Energy,Carbon,Yield\n";

  lastResults.forEach(r => {
    csv += `${r.name},${r.energy},${r.carbon},${r.yield}\n`;
  });

  const blob = new Blob([csv]);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "data.csv";
  link.click();
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("HTC Feedstock Report", 10, 10);

  let y = 20;

  lastResults.forEach(r => {
    doc.text(`${r.name}`, 10, y);
    y += 5;
    doc.text(`Energy: ${r.energy.toFixed(2)}%`, 10, y);
    y += 5;
    doc.text(`Carbon: ${r.carbon.toFixed(2)}%`, 10, y);
    y += 10;
  });

  doc.save("report.pdf");
}
