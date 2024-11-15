// Set the margins, width, and height for the chart
const marginMT = { top: 50, right: 100, bottom: 120, left: 100 };
const widthMT = 1000 - marginMT.left - marginMT.right;
const heightMT = 850 - marginMT.top - marginMT.bottom;

// Append the SVG container for the chart
const svgMT = d3.select("#mortality_chart")
    .append("svg")
    .attr("width", widthMT + marginMT.left + marginMT.right)
    .attr("height", heightMT + marginMT.top + marginMT.bottom)
    .append("g")
    .attr("transform", `translate(${marginMT.left},${marginMT.top})`);

// Create a single tooltip element
const tooltipMT = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("padding", "5px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("opacity", 0) // Initially hidden
    .style("pointer-events", "none");

// Load data from CSV
d3.csv("./Mortality_modified.csv").then(csvData => {
    csvData.forEach(d => {
        d.year = +d.Year;
        d.deaths = +d["Number of deaths due to tuberculosis, excluding HIV (median)"];
    });

    const dataByCountry = d3.group(csvData, d => d.Countries);
    const countries = Array.from(dataByCountry.keys());

    const x = d3.scaleLinear().domain([2015, 2021]).range([0, widthMT]);
    const y = d3.scaleLinear()
                .domain([0, d3.max(csvData, d => d.deaths) * 1.25])
                .range([heightMT, 0]);

    const xAxis = d3.axisBottom(x).tickValues([2015, 2016, 2017, 2018, 2019, 2020, 2021]).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y).tickFormat(d3.format(",.0f"));

    svgMT.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${heightMT})`)
        .call(xAxis);

    svgMT.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    svgMT.append("text")
        .attr("class", "x-axis-label")
        .attr("x", widthMT / 2)
        .attr("y", heightMT + marginMT.bottom / 2)
        .style("text-anchor", "middle")
        .text("Year");

    svgMT.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -heightMT / 2)
        .attr("y", -marginMT.left / 1.5)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("Number of Deaths Due to Tuberculosis");

    const color = d3.scaleOrdinal().domain(countries).range(d3.schemeCategory10);

    const stack = d3.stack()
        .keys(countries)
        .value((d, key) => d[key] || 0);

    const stackedData = stack(
        Array.from(d3.group(csvData, d => d.year).values()).map(group => {
            const row = { year: group[0].year };
            group.forEach(d => row[d.Countries] = d.deaths);
            return row;
        })
    );

    const areaGenerator = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    svgMT.selectAll(".area")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", "area")
        .attr("fill", d => color(d.key))
        .attr("d", areaGenerator)
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
            tooltipMT.transition().duration(200).style("opacity", 0.9);
        })
        .on("mousemove", function (event, d) {
            // Calculate the closest year based on the mouse position
            const mouseX = d3.pointer(event, this)[0];
            const closestYear = Math.round(x.invert(mouseX));
            
            // Get the deaths data for this country and year
            const yearData = d.find(yearPoint => yearPoint.data.year === closestYear);
            const deaths = yearData ? yearData.data[d.key] : 0;

            // Update the tooltip content
            tooltipMT.html(`Country: ${d.key}<br>Year: ${closestYear}<br>Deaths: ${deaths.toLocaleString()}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltipMT.transition().duration(500).style("opacity", 0);
        });

    const makeXGridlines = () => {
        return d3.axisBottom(x)
            .tickValues([2015, 2016, 2017, 2018, 2019, 2020, 2021])
            .tickSize(-heightMT)
            .tickFormat("");
    };

    svgMT.append("g")
        .attr("class", "x-grid")
        .attr("transform", `translate(0,${heightMT})`)
        .call(makeXGridlines())
        .selectAll("line")
        .style("stroke", "#666")
        .style("stroke-width", "1.5px")
        .style("stroke-dasharray", "4,2");

    const legend = svgMT.selectAll(".legend")
        .data(countries)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${i * 300}, ${heightMT + 70})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => `Number of deaths due to tuberculosis in ${d}`);
});
