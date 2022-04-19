// Time
var canvasWidth = document.getElementById("timeline").clientWidth;
var canvasHeight = document.getElementById("timeline").clientHeight;

var dataTime = d3.range(0, 76).map(function(d) {
    return new Date(1945 + d, 10, 3);
});

var currentCountry = "US"
var max = 39000

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(canvasWidth - 150)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1983, 10, 3))
    .on('onchange', val => {
        gTime.select('.timeLabel').text(d3.timeFormat('%Y')(val));
        var yearIndex = d3.timeFormat('%Y')(val)
        createBubbleChart(yearIndex)
        updatePictograph(yearIndex, currentCountry)
        drawLineToolTip(yearIndex)
});


var gTime = d3
    .select('#timeline')
    .append('svg')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .append('g')
    .attr('transform', 'translate(50,30)');

gTime.append("text")
    .attr("x", (canvasWidth - 125) /2)
    .attr("y", 80)
    .attr("text-anchor", "middle")
    .attr("font-weight", 800)
    .attr("font-size", "40px")
    .attr("class", "timeLabel")

gTime.call(sliderTime);

d3.select('.timeLabel').text(d3.timeFormat('%Y')(sliderTime.value()));

var z = d3.scaleOrdinal(d3.schemeCategory10);

var svg1 = d3.select('#bubblechart').append("svg")
    .attr("width", document.getElementById("bubblechart").clientWidth)
    .attr("height", document.getElementById("bubblechart").clientHeight),
    margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = svg1.attr("width") - margin.left - margin.right,
    height = svg1.attr("height") - margin.top - margin.bottom

function createBubbleChart(i) {
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 
        console.log(i)
        svg1.selectAll(".node").remove();

        data = data.filter(function(d) { 
            return d.Year == i
        })

        index = i

        console.log(data)
        console.log("width: " + width)
        console.log("height: " + height)

        const bubble = data => d3.pack()
            .size([width / 2, height * 1.5])
            .padding(3)(d3.hierarchy({ children: data }).sum(d => +d.Number));
        
        const root = bubble(data)

        const node = svg1.selectAll(".node")
            .data(root.children)
            .enter().append('g')
            .attr("class", "node")
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    
        const circle = node.append('circle')
            .attr('r', d => d.r)
            .style('fill', d => z(d.data.Country))
            .on("click", function(event, d) {
                currentCountry = d.data.Country;
                updatePictograph(index, currentCountry)
            })
            .on("mouseon", function(event, d) { 
                updatePictograph(index, d.data.Country)
            })
            .on("mouseout", function(d){ 
                updatePictograph(index, currentCountry)
            })

        const label = node.append('text')
            .attr('dy', 2)
            .text(function(d) { 
                if(d.data.Number > 0) { 
                    return d.data.Country
                } else { 
                    return ""
                }
            })
            .style("text-anchor", "middle");
    })
}

function createPictograph(i, c) {
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 

        data = data.filter(function(d) { 
            console.log(c)
            return d.Year == i && d.Country === c
        })

        var twitterFill = "white";
        var twitterFillActive = "#adf7b6";
        
        const width = document.getElementById("pictogram").clientWidth
        const height = document.getElementById("pictogram").clientHeight;

        //create an svg with width and height
        var svg = d3.select('#pictogram')
            .append('svg')
            .attr("width", width)
            .attr("height", height)

        //10 rows and 10 columns 
        var numRows = width / (width / 10);
        var numCols = height/  (height/ 10);

        var percentNumber = (data[0].Number / max) * 100
        console.log("percent number: " + percentNumber)

        //x and y axis scales
        var y = d3.scaleBand()
            .range([0,height - 30])
            .domain(d3.range(numRows));

        var x = d3.scaleBand()
            .range([0, width - 30])
            .domain(d3.range(numCols));

        //the data is just an array of numbers for each cell in the grid
        var data = d3.range(numCols*numRows);
        console.log(data)

        //container to hold the grid
        var container = svg.append("g")
            .attr("transform", "translate(30,30)")
            .attr("class", "container")
            .attr("width", width - 60)
            .attr("height", height - 60)
        

        container.selectAll("circle").remove()
                .data(data)
                .enter().append("circle")
                .attr("id", function(d){return "id"+d;})
                .attr('cx', function(d){return x(d%numCols);})
                .attr('cy', function(d){return y(Math.floor(d/numCols));})
                .attr('r', 12)
                .attr('fill', function(d){return d < percentNumber ? twitterFillActive : twitterFill;})
                .style('stroke', function(d){return d < percentNumber ? "black" : "white";});
    })
}

function updatePictograph(i, c) {
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 

        data = data.filter(function(d) { 
            console.log(c)
            return d.Year == i && d.Country === c
        })

        var twitterFill = "white";
        var twitterFillActive = "#adf7b6";

        var percentNumber = data[0].Number/max * 100

        console.log(percentNumber)

        var svg = d3.select('#pictogram')

        var container = svg.select('.container')

        container.selectAll("circle")
            .attr('fill', function(d){return d < percentNumber ? twitterFillActive : twitterFill;})
    })
}

createPictograph(1977, currentCountry)
createBubbleChart(1977);