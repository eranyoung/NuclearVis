 // Time
var canvasWidth = document.getElementById("timeline").clientWidth;
var canvasHeight = document.getElementById("timeline").clientHeight;

var dataTime = d3.range(0, 76).map(function(d) {
    return new Date(1945 + d, 10, 3);
});

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(canvasWidth - 100)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1977, 10, 3))
    .on('onchange', val => {
        d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
        var yearIndex = d3.timeFormat('%Y')(val)
        createBubbleChart(yearIndex)
});

var gTime = d3
    .select('#timeline')
    .append('svg')
    .attr('width', canvasWidth)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(50,30)');

gTime.call(sliderTime);

d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));

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

        console.log(data)
        console.log("width: " + width)
        console.log("height: " + height)

        const bubble = data => d3.pack()
            .size([width, height * 1.5])
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

createBubbleChart(1977);