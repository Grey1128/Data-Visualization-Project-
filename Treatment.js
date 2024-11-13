document.addEventListener("DOMContentLoaded", function () {
   const margin = { top: 20, right: 80, bottom: 55, left: 65 },
         width = 1000 - margin.left - margin.right,
         height = 850 - margin.top - margin.bottom;

   const svg = d3.select("#treat-chart")
                 .append("svg")
                 .attr("width", width + margin.left + margin.right)
                 .attr("height", height + margin.top + margin.bottom)
                 .append("g")
                 .attr("transform", `translate(${margin.left},${margin.top})`);

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

       // Add legend
       const legend = svg.append("g")
                         .attr("class", "legend")
                         .attr("transform", `translate(${width/2 - 50}, ${margin.top})`);

       // China legend
       legend.append("rect")
             .attr("x", 0)
             .attr("y", 0)
             .attr("width", 18)
             .attr("height", 18)
             .style("fill", "blue");

       legend.append("text")
             .attr("x", 25)
             .attr("y", 14)
             .style("font-size", "18px")
             .text("China");

       // India legend
       legend.append("rect")
             .attr("x", 100) // Offset for second legend item
             .attr("y", 0)
             .attr("width", 18)
             .attr("height", 18)
             .style("fill", "orange");

       legend.append("text")
             .attr("x", 125)
             .attr("y", 14)
             .style("font-size", "18px")
             .text("India");

       console.log("Chart rendering completed.");
   }).catch(error => {
       console.error("Error loading CSV data:", error);
   });
});
