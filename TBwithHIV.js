// script.js
const margin = {top: 50, right: 100, bottom: 100, left: 100};
const width = 1000 - margin.left - margin.right;
const height = 850 - margin.top - margin.bottom;

const svg = d3.select("#TB_HIV")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltipHIV = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("opacity", 0) // Initially hidden
    .style("pointer-events", "none");

let currentCountry = "China";
const countries = ["India", "China"]; // List of countries
let currentIndex = 0; // Index to track the current country
// Load data from CSV
let data = {};

d3.csv("./TBwithHIV_modified.csv").then(csvData => {
    csvData.forEach(d => {
        d.year = +d.Year;
        d.knownHIVStatus = +d["TB patients with known HIV status (%)"];
        d.hivPositive = +d["Tested TB patients HIV-positive (%)"];
        d.onART = d["HIV-positive TB patients on ART (antiretroviral therapy) (%)"] ? +d["HIV-positive TB patients on ART (antiretroviral therapy) (%)"] : null;

        if (!data[d["Countries, territories and areas"]]) {
            data[d["Countries, territories and areas"]] = [];
        }
        data[d["Countries, territories and areas"]].push(d);
    });

    
    // For Seperating data 
    const dataChina = csvData
    .filter(d => d["Countries, territories and areas"] === "China")
    .map(d => ({
        Year: +d.Year,
        SuccessRate: d["TB patients with known HIV status (%)"] ? +d["TB patients with known HIV status (%)"] : null
    }));

    const dataIndia = csvData
    .filter(d => d["Countries, territories and areas"] === "India")
    .map(d => ({
        Year: +d.Year,
        SuccessRate: d["TB patients with known HIV status (%)"] ? +d["TB patients with known HIV status (%)"] : null
    }));
//So that the year won't overlap
const years = [...new Set(dataChina.concat(dataIndia).map(d => d.Year))].sort((a, b) => a - b);


const x = d3.scalePoint().domain(years).range([0, width]);
const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(y).tickFormat(d => d + "%");

svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

svg.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

const lineGenerator = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.value));

const color = d3.scaleOrdinal().domain(["knownHIVStatus", "hivPositive", "onART"]).range(["steelblue", "green", "red"]);


//Function Declaring for Update
function updateChart(country) {
    const countryData = data[country];
    const metrics = ["knownHIVStatus", "hivPositive", "onART"];
    d3.select("#country-title").text(`${country}`);

    svg.selectAll(".line").remove();
    svg.selectAll(".legend").remove();

    metrics.forEach(metric => {

        let linePath = svg.selectAll(`.line-${metric}`)
            .data([countryData.map(d => ({ year: d.year, value: d[metric] }))]);

        // Enter: Append new line paths if they don't exist
        linePath.enter()
            .append("path")
            .attr("class", `line line-${metric}`)
            .attr("fill", "none")
            .attr("stroke", color(metric))
            .attr("stroke-width", 2)
            .attr("d", lineGenerator)
            .each(function() {
                // This function sets up the initial state for the transition
                const totalLength = this.getTotalLength();
                d3.select(this)
                    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
                    .attr("stroke-dashoffset", totalLength);
            })
            .merge(linePath) // Merge to apply the update to both enter and existing paths
            .transition() // Start transition for drawing the line
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .attr("stroke-dashoffset", 0);

        // Exit: Remove any extra paths that are not needed
        linePath.exit().remove();      
        
        const metricData = countryData.map(d => ({ year: d.year, value: d[metric] }));
    
        // Remove any existing dots to avoid duplication
        svg.selectAll(`.dot-${metric}`).remove();
    
        // Add dots
        svg.selectAll(`.dot-${metric}`)
            .data(metricData)
            .enter()
            .append("circle")
            .attr("class", `dot dot-${metric}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("fill", color(metric))
            .on("mouseover", function (event, d) {
                tooltipHIV.html(`Year: ${d.year}<br>${metric}: ${d.value.toFixed(1)}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px")
                    .transition()
                    .duration(200)
                    .style("opacity", 1); // Fade-in effect
            })
            .on("mousemove", function (event) {
                tooltipHIV
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", function () {
                tooltipHIV.transition()
                    .duration(200)
                    .style("opacity", 0); // Fade-out effect
            });
            

    });
    

    // Add legends at the bottom of the chart
    const legend = svg.selectAll(".legend")
        .data(metrics)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${height + 40 + i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => {
            switch (d) {
                case "knownHIVStatus": return "TB patients with known HIV status (%)";
                case "hivPositive": return "Tested TB patients HIV-positive (%)";
                case "onART": return "HIV-positive TB patients on ART (%)";
            }
        });
}
    // Initial chart update for the default country
    updateChart(currentCountry);

    // // Event listener for the China button
    // d3.select("#China-button").on("click", function() {
    //     currentCountry = "China";
    //     updateChart(currentCountry);
    // });

    // // Event listener for the India button
    // d3.select("#India-button").on("click", function() {
    //     currentCountry = "India";
    //     updateChart(currentCountry);
    // });
// Event listener for the previous country button
d3.select("#prev-country").on("click", function() {
    currentIndex = (currentIndex - 1 + countries.length) % countries.length; // Loop back to the last country
    currentCountry = countries[currentIndex];
    updateChart(currentCountry);
});

// Event listener for the next country button
d3.select("#next-country").on("click", function() {
    currentIndex = (currentIndex + 1) % countries.length; // Loop back to the first country
    currentCountry = countries[currentIndex];
    updateChart(currentCountry);
});    
});



