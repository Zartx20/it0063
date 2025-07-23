let rawData = [];
let yearColumns = [];
let charts = {};

const targetProducts = [
    "Carabao for Slaughter", "Cattle for Slaughter", "Goat for Slaughter",
    "Hogs Upgraded for Fattening", "Hog for Slaughter", "Chicken Broiler",
    "Gamefowl", "Chicken Layer", "Chicken Native/Improved", "Duck",
    "Chicken egg, Layer", "Chicken egg, Native", "Duck egg"
];

window.addEventListener("DOMContentLoaded", () => {
    fetch("DATASET-Livestock.xlsx")
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            processExcelData(jsonData);
        });
});

function processExcelData(data) {
    const headers = data[1].map(h => String(h).trim());
    rawData = data.slice(2).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i];
        });
        return obj;
    }).filter(row => row[headers[0]] && row[headers[1]]);

    yearColumns = headers.filter(h => /\b20\d{2}\b/.test(h));
    console.log("✅ Year Columns:", yearColumns);

    rawData.forEach(row => {
        yearColumns.forEach(year => {
            row[year] = parseFloat(row[year]) || 0;
        });
    });

    // Populate filters for each chart section
    document.querySelectorAll(".chart-section").forEach(section => {
        const regionFilter = section.querySelector(".regionFilter");
        const productFilter = section.querySelector(".productFilter");
        const yearFilter = section.querySelector(".yearFilter");

        const uniqueRegions = [...new Set(rawData.map(r => r.Region))].sort();
        populateFilter(regionFilter, uniqueRegions, "All Regions");
        populateFilter(productFilter, targetProducts.sort(), "All Products");
        populateFilter(yearFilter, yearColumns, "All Years");

        // Filter change event
        [regionFilter, productFilter, yearFilter].forEach(filter => {
            filter.addEventListener("change", () => {
                const canvasId = section.querySelector("canvas").id;
                updateChart(canvasId, regionFilter.value, productFilter.value, yearFilter.value);
            });
        });
    });

    // Draw all charts initially
    document.querySelectorAll(".chart-section").forEach(section => {
        const canvasId = section.querySelector("canvas").id;
        updateChart(canvasId, "All Regions", "All Products", "All Years");
    });
}

function populateFilter(selectElement, options, defaultOption) {
    selectElement.innerHTML = `<option value="${defaultOption}">${defaultOption}</option>`;
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        selectElement.appendChild(option);
    });
}

function updateChart(chartId, region, product, year) {
    let filtered = rawData;

    if (region !== "All Regions") {
        filtered = filtered.filter(r => r.Region === region);
    }
    if (product !== "All Products") {
        filtered = filtered.filter(r => r.Product === product);
    }
    if (year !== "All Years") {
        filtered = filtered.map(r => ({
            ...r,
            total: r[year] || 0
        }));
    }

    switch (chartId) {
        case "barChart":
            drawBarChart(filtered, year);
            break;
        case "pieChart":
            drawPieChart(filtered, year);
            break;
        case "lineChart":
            drawLineChart(filtered);
            break;
        case "scatterChart":
            drawScatterPlot(filtered, year);
            break;
        case "bubbleChart":
            drawBubbleChart(filtered, year);
            break;
        case "heatMapChart":
            drawHeatMapChart(filtered);
            break;
        case "forecastChart":
            drawForecastChart(filtered);
            break;
    }
}

function drawBarChart(data, year) {
    const labels = [...new Set(data.map(r => r.Product))];
    const totals = labels.map(product => {
        const rows = data.filter(r => r.Product === product);
        return year === "All Years"
            ? yearColumns.reduce((sum, y) => sum + rows.reduce((s, r) => s + r[y], 0), 0)
            : rows.reduce((sum, r) => sum + (r[year] || 0), 0);
    });

    renderChart("barChart", "bar", labels, totals, "Annual Sales (Bar Chart)");
}

function drawPieChart(data, year) {
    const labels = [...new Set(data.map(r => r.Product))];
    const totals = labels.map(product => {
        const rows = data.filter(r => r.Product === product);
        return year === "All Years"
            ? yearColumns.reduce((sum, y) => sum + rows.reduce((s, r) => s + r[y], 0), 0)
            : rows.reduce((sum, r) => sum + (r[year] || 0), 0);
    });

    renderChart("pieChart", "pie", labels, totals, "Product Distribution (Pie Chart)");
}

function drawLineChart(data) {
    const labels = yearColumns;
    const datasets = [...new Set(data.map(r => r.Product))].map(product => {
        const rows = data.filter(r => r.Product === product);
        return {
            label: product,
            data: labels.map(year => rows.reduce((sum, r) => sum + r[year], 0)),
            fill: false,
            borderColor: randomColor(),
            tension: 0.1
        };
    });

    renderChart("lineChart", "line", labels, datasets, "Sales Trend (Line Chart)", true);
}

// ✅ Fixed Scatter Plot (real scattered dots)
function drawScatterPlot(data, year) {
    let scatterData = [];

    if (year === "All Years") {
        // For all years, scatter by year (X) and value (Y)
        data.forEach(row => {
            yearColumns.forEach(y => {
                scatterData.push({
                    x: parseInt(y),          // X = year
                    y: row[y] || 0,          // Y = sales
                    label: `${row.Product} (${row.Region})`
                });
            });
        });
    } else {
        // For single year, spread points randomly in X
        scatterData = data.map(row => ({
            x: Math.random() * 100,         // Random X-axis for one year
            y: row[year] || 0,              // Y = sales
            label: `${row.Product} (${row.Region})`
        }));
    }

    if (charts["scatterChart"]) charts["scatterChart"].destroy();
    const ctx = document.getElementById("scatterChart").getContext("2d");

    charts["scatterChart"] = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [{
                label: "Scatter Plot",
                data: scatterData,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: "Scatter Plot (Sales)"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.raw.label}: ${context.raw.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: year === "All Years" ? "Year" : "X-Axis (Randomized)"
                    },
                    beginAtZero: false,
                    type: "linear"
                },
                y: {
                    title: {
                        display: true,
                        text: "Sales"
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// ⚠️ Bubble Chart logic UNCHANGED
function drawBubbleChart(data, year) {
    let bubbleData;

    if (year === "All Years") {
        bubbleData = [];
        data.forEach(row => {
            yearColumns.forEach((y, i) => {
                bubbleData.push({
                    x: yearColumns.indexOf(y) + 1 || Math.random() * 10,
                    y: row[y] || 0,
                    r: Math.max(row[y] / 1000, 5), // Bubble size scaled
                    label: `${row.Product} (${row.Region})`
                });
            });
        });
    } else {
        bubbleData = data.map(row => ({
            x: Math.random() * 100,
            y: row[year] || 0,
            r: Math.max((row[year] || 0) / 1000, 5), // Bubble size scaled
            label: `${row.Product} (${row.Region})`
        }));
    }

    renderChart("bubbleChart", "bubble", null, [{
        label: "Bubble Chart",
        data: bubbleData,
        backgroundColor: bubbleData.map(() => randomColor())
    }], "Bubble Chart (Size = Sales)", true);
}

function drawHeatMapChart(data) {
    const labels = yearColumns;
    const datasets = [...new Set(data.map(r => r.Product))].map(product => {
        const rows = data.filter(r => r.Product === product);
        return {
            label: product,
            data: labels.map(year => rows.reduce((sum, r) => sum + r[year], 0)),
            backgroundColor: randomColor()
        };
    });

    renderChart("heatMapChart", "bar", labels, datasets, "Heat Map (Bar Style)", true);
}

function drawForecastChart(data) {
    const totals = yearColumns.map(year =>
        data.reduce((sum, row) => sum + (row[year] || 0), 0)
    );
    const regressionResult = regression.linear(yearColumns.map((y, i) => [parseInt(y), totals[i]]));

    const forecast = yearColumns.map(y => regressionResult.predict(parseInt(y))[1]);
    const upper = forecast.map(y => y * 1.1);
    const lower = forecast.map(y => y * 0.9);

    renderChart("forecastChart", "line", yearColumns, [
        {
            label: "Actual Sales",
            data: totals,
            borderColor: "blue",
            fill: false
        },
        {
            label: "Forecast Trend",
            data: forecast,
            borderColor: "red",
            borderDash: [5, 5],
            fill: false
        },
        {
            label: "Confidence Upper",
            data: upper,
            borderColor: "rgba(255,0,0,0.3)",
            fill: '+1'
        },
        {
            label: "Confidence Lower",
            data: lower,
            borderColor: "rgba(255,0,0,0.3)",
            fill: '-1'
        }
    ], "Sales Forecast with Confidence Interval", true);
}

function renderChart(id, type, labels, datasets, title, multiDataset = false) {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id).getContext("2d");

    charts[id] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: multiDataset ? datasets : [{
                data: datasets,
                backgroundColor: labels ? labels.map(() => randomColor()) : randomColor()
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.raw.label
                                ? `${context.raw.label}: ${context.raw.r || context.raw.y}`
                                : context.raw;
                        }
                    }
                },
                legend: {
                    display: true
                }
            }
        }
    });
}

function randomColor() {
    return `hsl(${Math.random() * 360}, 70%, 60%)`;
}
