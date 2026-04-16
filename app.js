console.log("JS is connected");

// Wait until page fully loads
window.onload = function () {

  document.getElementById("runBtn").addEventListener("click", function () {

    console.log("Button clicked");

    // Get values
    const M = document.getElementById("moisture").value;
    const T = document.getElementById("temperature").value;
    const t = document.getElementById("time").value;

    // Show output
    let result = `
Inputs Received:

Moisture: ${M} %
Temperature: ${T} °C
Time: ${t} min
`;

    document.getElementById("output").innerText = result;

  });

};
