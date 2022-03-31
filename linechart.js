var canvasWidth = document.getElementById("linechart").clientWidth;
var canvasHeight = document.getElementById("linechart").clientHeight;
var margin = 200;

var svg = d3.select("#linechart").append("svg")
    .attr("width",  canvasWidth)
    .attr("height", canvasHeight)

var width = svg.attr("width") - margin;
var height = svg.attr("height") - margin;

svg.append("text")
    .attr("x", canvasWidth/2)
    .attr("y", 50)
    .style("text-anchor", "middle")
    .attr("font-size", "30px")
    .attr("font-weight", 800)
    .text("Nuclear Warheads by Country")

var container_g = svg.append("g")
    .attr("transform",
        "translate(" + 100 + ", " + 100 + ")");

d3.csv("./warheads.csv").then( function(data) {

    // group the data: I want to draw one line per group
    const sumstat = d3.group(data, d => d.Country); // nest function allows to group the calculation per level of a factor
    
    console.log(sumstat)

    const x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.Year; }))
        .range([ 0, width ])

    container_g.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    // Add Y axis
    const y = d3.scalePow()
        .exponent(0.25)
        .domain([0, d3.max(data, function(d) { return +d.Number; })])
        .range([ height, 0 ]);
        
    console.log(d3.max(data, function(d) { return +d.Number; }))

    container_g.append("g")
        .call(d3.axisLeft(y));

    // color palette
    const color = d3.scaleOrdinal()
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'])

    // Draw the line
    container_g.selectAll(".line")
        .data(sumstat)
        .join("path")
            .attr("fill", "none")
            .attr("stroke", function(d){ return color(d[0]) })
            .attr("stroke-width", 5)
            .attr("stroke-opacity", 0.75)
            .attr("d", function(d){
            return d3.line()
                .x(function(d) { return x(d.Year); })
                .y(function(d) { return y(+d.Number); })
                (d[1])
    })

})
