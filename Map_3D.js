// Set map size using variables
const widthMap = 1000;
const heightMap = 850;

// Load GeoJSON and CSV data
Promise.all([
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
    d3.csv("./Global_Incident.csv") // CSV path with COVID data
]).then(([world, data]) => {
    // Map your CSV data for easy lookup
    const incidentRates = new Map(data.map(d => [d.Country, +d.IncidentRate]));
  
    // Create the GeoJSON features from TopoJSON
    const countries = topojson.feature(world, world.objects.countries).features;
  
    // Set up the projection
    const projection = d3.geoMercator()
      .scale(180) // Adjusted scale for better view with new dimensions
      .translate([widthMap / 2, heightMap / 2]);
  
    // Set up the path generator
    const path = d3.geoPath().projection(projection);
  
    // Create the SVG container
    const svg = d3.select("#map")
      .append("svg")
      .attr("width", widthMap)
      .attr("height", heightMap);
  
    // Tooltip for showing country information
    const tooltip = d3.select("#tooltip2");
  
    // Draw the map
    svg.selectAll("path")
      .data(countries)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", "country") // Add the class to each country path
      .attr("fill", d => {
        // Get the country name from GeoJSON
        const countryName = d.properties.name;
  
        // Look up the incident rate
        const incidentRate = incidentRates.get(countryName);
  
        // Set a color based on the incident rate
        if (incidentRate != null) {
          return incidentRate > 0 ? "red" : "blue"; // Example colors for positive or negative values
        } else {
          return "gray"; // Default color if no data available
        }
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("mouseover", function (event, d) {
        // Show tooltip on hover
        const countryName = d.properties.name;
        const incidentRate = incidentRates.get(countryName);
        
        // Set opacity of other countries to 50%
        d3.selectAll(".country") // Select all countries by class
          .style("opacity", 0.5);
        
        // Set opacity of hovered country back to 100%
        d3.select(this).style("opacity", 1);
        
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`${countryName}: ${incidentRate != null ? incidentRate : 'No data'}`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        // Reset all countries to full opacity
        d3.selectAll(".country")
          .style("opacity", 1);
        
        // Hide tooltip when not hovering
        tooltip.transition().duration(500).style("opacity", 0);
    });

    // Add legend
const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${widthMap - 150}, ${50})`); // Adjust position as needed

// Legend data
const legendData = [
    { color: "red", label: "Positive Incident Rate" },
    { color: "blue", label: "Negative Incident Rate" },
    { color: "gray", label: "No Data" }
];

// Add colored rectangles for each legend item
legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", -850)
    .attr("y", (d, i) => i * 20-32) // Vertical spacing
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => d.color);

// Add text labels for each legend item
legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", -830) // Position text to the right of the rectangle
    .attr("y", (d, i) => i * 20 -20) // Align text vertically with rectangles
    .style("font-size", "12px")
    .text(d => d.label);

}).catch(error => {
    console.error('Error loading the data:', error);
});
