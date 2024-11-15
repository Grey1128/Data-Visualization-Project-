document.addEventListener("DOMContentLoaded", function () {
   const margin = { top: 20, right: 80, bottom: 55, left: 65 },
         width = 1000 - margin.left - margin.right,
         height = 850 - margin.top - margin.bottom;

   // Create SVG container
   const svg = d3.select("#treat-chart")
                 .append("svg")
                 .attr("width", width + margin.left + margin.right)
                 .attr("height", height + margin.top + margin.bottom)
                 .append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

   // Create a single tooltip element
   const tooltipTRT = d3.select("body").append("div")
       .attr("class", "tooltip")
       .style("position", "absolute")
       .style("background-color", "white")
       .style("padding", "5px")
       .style("border", "1px solid #ccc")
       .style("border-radius", "4px")
       .style("opacity", 0) // Initially hidden
       .style("pointer-events", "none");

   // Load CSV data
   d3.csv("Treatmentsuccess.csv").then(data => {
       const dataChina = data
           .filter(d => d.Countries === 'China')
           .map(d => ({ Year: +d.Year, SuccessRate: +d['Treatment success rate: new TB cases %'] }));
           
       const dataIndia = data
           .filter(d => d.Countries === 'India')
           .map(d => ({ Year: +d.Year, SuccessRate: +d['Treatment success rate: new TB cases %'] }));

       const years = [...new Set(dataChina.concat(dataIndia).map(d => d.Year))].sort((a, b) => a - b);

       const x = d3.scalePoint()
                   .domain(years)
                   .range([0, width]);

       const y = d3.scaleLinear()
                   .domain([0, 100])
                   .range([height, 0]);

       const lineChina = d3.line()
                           .x(d => x(d.Year))
                           .y(d => y(d.SuccessRate));

       const lineIndia = d3.line()
                           .x(d => x(d.Year))
                           .y(d => y(d.SuccessRate));

       svg.append("path")
          .datum(dataChina)
          .attr("class", "line line-china")
          .attr("d", lineChina)
          .style("stroke", "blue");

       svg.append("path")
          .datum(dataIndia)
          .attr("class", "line line-india")
          .attr("d", lineIndia)
          .style("stroke", "orange");

       svg.append("g")
          .attr("class", "axis")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")));

       svg.append("g")
          .attr("class", "axis")
          .call(d3.axisLeft(y));

       svg.append("text")
          .attr("x", width / 2)
          .attr("y", height + margin.bottom - 10)
          .style("opacity", 0.5)
          .attr("text-anchor", "middle")
          .style("font-size", "24px")
          .text("Year");

       svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -margin.left + 35)
          .attr("x", -height / 2)
          .style("opacity", 0.5)
          .attr("text-anchor", "middle")
          .style("font-size", "24px")
          .text("Success Rate (%)");
        

       // Add dots and tooltips for each data point
       const countriesData = [
           { data: dataChina, color: "blue", country: "China" },
           { data: dataIndia, color: "orange", country: "India" }
       ];

       countriesData.forEach(({ data, color, country }) => {
           svg.selectAll(`.dot-${country}`)
              .data(data)
              .enter()
              .append("circle")
              .attr("class", `dot dot-${country}`)
              .attr("cx", d => x(d.Year))
              .attr("cy", d => y(d.SuccessRate))
              .attr("r", 5)
              .attr("fill", color)
              .on("mouseover", function (event, d) {
                  tooltipTRT.html(`Country: ${country}<br>Year: ${d.Year}<br>Success Rate: ${d.SuccessRate}%`)
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 30) + "px")
                      .transition()
                      .duration(200)
                      .style("opacity", 1); // Fade-in effect
              })
              .on("mousemove", function (event) {
                  tooltipTRT
                      .style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 30) + "px");
              })
              .on("mouseout", function () {
                  tooltipTRT.transition()
                      .duration(200)
                      .style("opacity", 0); // Fade-out effect
              });
       });


       // Add legend
        const legend = svg.append("g")
                            .attr("class", "legend")
                            .attr("transform", `translate(${width - 200}, ${20})`); // Position legend at the top-right corner

        const legendData = [
                { color: "blue", label: "China" },
                { color: "orange", label: "India" }
            ];

        legend.selectAll("rect")
                .data(legendData)
                .enter()
                .append("rect")
                .attr("x", -650)
                .attr("y", (d, i) => i * 20-30) // 20px gap between legend items
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", d => d.color);

        legend.selectAll("text")
                .data(legendData)
                .enter()
                .append("text")
                .attr("x", -630) // Position text to the right of the rectangle
                .attr("y", (d, i) => i * 20 -18) // Align text vertically with rectangles
                .style("font-size", "14px")
                .text(d => d.label);


       console.log("Chart rendering completed.");
   }).catch(error => {
       console.error("Error loading CSV data:", error);
   });
});
