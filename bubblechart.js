var canvasWidth = document.getElementById("timeline").clientWidth; //for scaling chart to window size
var canvasHeight = document.getElementById("timeline").clientHeight;

var dataTime = []; //array of times for the timeline
for(let i = 1945; i <= 2020; i +=5) { 
    dataTime.push(new Date(i, 10, 3));
}

var currentCountry = "US"
var max = 41000 
var currentYear = 1945;

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(canvasWidth - 100)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1945, 10, 3))
    .displayValue(false) //don't use inbuilt display, we are using a seperate label
    .handle(
        d3
          .symbol()
          .type(d3.symbolCircle)
          .size(150)()
      )
    .on('onchange', val => { //whenever the timeline value changes, can be set or the slider can be dragged
        var yearIndex = d3.timeFormat('%Y')(val)
        document.getElementById('timelineLabel').innerHTML = yearIndex
        currentYear = yearIndex;
        createBubbleChart(yearIndex) //call all update functions
        updatePictograph(yearIndex, currentCountry)
        updateNukeLabel(yearIndex, currentCountry)
        updateDescription(yearIndex)
        drawLineToolTip(yearIndex)
});


var gTime = d3
    .select('#timeline')
    .append('svg')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    .append('g')
    .attr('transform', 'translate(50,7)');

gTime.call(sliderTime);

const countries = ["US", "RS", "UK",  "FR", "CN", "IS", "IN", "PK", "NK"]
var color = d3.scaleOrdinal(d3.schemeTableau10).domain(countries);

var svg1 = d3.select('#bubblechart').append("svg")
    .attr("width", document.getElementById("bubblechart").clientWidth)
    .attr("height", document.getElementById("bubblechart").clientHeight),
    margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = svg1.attr("width") - margin.left - margin.right,
    height = svg1.attr("height") - margin.top - margin.bottom

svg1.on("wheel", function(event, d) { //allow bubble chart to have scroll interactivity
    event.preventDefault()
    var year = currentYear
    var direction = event.wheelDelta < 0 ? 'down' : 'up';
    if(direction === 'down' && currentYear > 1945) { 
        year--
        sliderTime.value([new Date(year, 10, 3)]); //setting timeline value
    } else if(direction === 'up' && currentYear < 2020) {
        year++
        sliderTime.value([new Date(year, 10, 3)]);
    }
})

//svg1.style("overscroll-behavior-y", "contain")
svg1.append("text")
    .attr("x", 5)
    .attr("y", 20)
    .text('Scroll to change year!')

function createBubbleChart(i) { //function to create and update bubble chart
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 
        svg1.selectAll(".node").remove(); //remove all nodes if they exist

        data = data.filter(function(d) { 
            return d.Year == i
        })

        index = i

        const bubble = data => d3.pack()
            .size([document.getElementById("bubblechart").clientWidth, height*2])
            .padding(9)(d3.hierarchy({ children: data }).sum(d => +d.Number))

        const root = bubble(data)

        const node = svg1.selectAll(".node")
            .data(root.children)
            .enter().append('g')
            .attr("class", "node")
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
    
        const circle = node.append('circle')
            .on("click", function(event, d) {
                currentCountry = d.data.Country; //functions to handle events on bubble chart
                updatePictograph(index, currentCountry) //updates other charts
                updateNukeLabel(index, currentCountry)
                createBubbleChart(currentYear)
            })
            .on("mouseover", function(event, d) { 
                updatePictograph(index, d.data.Country)
                updateNukeLabel(index,  d.data.Country)
            })
            .on("mouseout", function(d){ 
                updatePictograph(index, currentCountry)
                updateNukeLabel(index, currentCountry)
                
            })
            .attr('r', d => d.r)
            .style('fill', function(d) { 
                return color(d.data.Country)
            })
            .style('stroke', function(d) {
                if(d.data.Country === currentCountry){
                    return 'black'
                } else { 
                    return color(d.data.Country)
                }
            })
            .style('stroke-width', 5)
            .style('fill-opacity', 0.5)
            .attr('transform', "translate(0, -100)")
        
            

        const label = node.append('text')
            .text(function(d) { 
                if(d.data.Number > 0) { 
                    return d.data.Country
                } else { 
                    return ""
                }
            })
            .style("font-size", function(d){
                return (d.r/2) + "px"
            })
            .style("fill", function(d) { 
                return color(d.data.Country)
            })
            .style("stroke", "black")
            .style("text-anchor", "middle")
            .style("alignment-baseline", "central")
            .attr('transform', "translate(0, -100)")
    })
}

function createPictograph(i, c) { //initial pictograph creation
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 

        data = data.filter(function(d) { 
            return d.Year == i && d.Country === c
        })

        var fill = "#FFFFFF";
        var fillActive = color(data[0].Country);
        
        const width = document.getElementById("pictogram").clientWidth
        const height = document.getElementById("pictogram").clientHeight;

        //create an svg with width and height
        var svg = d3.select('#pictogram')
            .append('svg')
            .attr("width", width)
            .attr("height", height)

        //10 rows and 10 columns 
        var numRows = 1;
        var numCols = width / (width/20);

        var percentNumber = (data[0].Number / max) * 100

        //x and y axis scales
        var y = d3.scaleBand()
            .range([0,height])
            .domain(d3.range(numRows));

        var x = d3.scaleBand()
            .range([0, width])
            .domain(d3.range(numCols));

        //the data is just an array of numbers for each cell in the grid
        var data = d3.range(numCols*numRows);

        var bomb = svg.append("defs")
            .append("g")
            .attr("id", "bombIcon")

        bomb.append("path")
            .attr("d", "M177.746 465.133a111.134 111.134 0 0 0 24.98 10.73 123.6 123.6 0 0 1-165.845-169.69c2.617 9.252 7.46 19.842 14.427 31.56 13.57 22.786 35.29 49.784 59.59 74.084 23.174 23.175 46.923 42.115 66.85 53.316zM317.31 21.616l-66.85 66.85 173.69 173.69 66.85-66.85zM259.29 162.62l89.473 89.474 44.895 5.958L254.095 118.49zm81.522 107.348c-15.575 34.527-65.865 141.216-108.848 184.222-37.728 37.73-206.412-143.08-174.746-174.746 42.772-42.772 149.977-91.478 185.478-106.866l97.342 97.343zM203.008 355.1a33.014 33.014 0 0 1-31.794-8.55l-24.77 24.77a68.022 68.022 0 0 0 65.56 17.663zm-40.24-40.472a33.014 33.014 0 0 1 23.457-23.34l-8.983-33.893a68.022 68.022 0 0 0-48.284 48.167zm41.86-1.43a14.238 14.238 0 1 0 0 20.136 14.238 14.238 0 0 0 0-20.196zm38.044-38.047l-24.77 24.77a33.014 33.014 0 0 1 8.503 31.96l33.847 9.16a68.022 68.022 0 0 0-17.592-65.947z")
            .attr("transform", "translate(-30,-20) scale(.08)")
        
        //container to hold the grid
        var container = svg.append("g")
            .attr("transform", "translate(40,27)")
            .attr("class", "container")
            .attr("width", width)
            .attr("height", height)
        

        container.selectAll("use").remove()
                .data(data)
                .enter().append("use")
                .attr("xlink:href", "#bombIcon")
                .attr("id", function(d){return "id"+d;})
                .attr('x', function(d){return x(d%numCols);})
                .attr('y', function(d){return y(Math.floor(d/numCols));})
                .attr('fill', function(d){return ((d/20)*100) < percentNumber ? fillActive : fill;})
                .style('stroke', 'white')
                .style('stroke-width', 10)
                .attr('class', 'use')
                .attr('oldPerc', percentNumber)
                .style('opacity', function(d){return ((d/20)*100) < percentNumber ? 1 : 0;})
    })
}

function updatePictograph(i, c) { //function to update pictograph, we need seperate because of animation
    //we don't want to redraw all symbols every time, just add new ones
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 

        data = data.filter(function(d) { 
            return d.Year == i && d.Country === c
        })

        var fill = "#FFFFFF";
        var fillActive = color(data[0].Country);

        var percentNumber = data[0].Number/max * 100

        var svg = d3.select('#pictogram')

        var container = svg.select('.container')

        container.selectAll("use")
            .style('opacity', function(d){return ((d/20)*100) < percentNumber ? 1 : 0;})
            .attr('fill', function(d){
                if(((d/20)*100) > d3.select(this).attr("oldPerc")) {
                    d3.select(this)
                    .attr("transform", "scale(0)")
                    .transition()
                    .delay(50)
                    .ease(d3.easeBounceInOut)
                    .duration(500)
                    .attr("transform", "scale(1)")
                    return fillActive;
                }return ((d/20)*100) < percentNumber ? fillActive : fill;
            })
            .style('stroke', "white")
            .style('stroke-width', 10)
            .attr("oldPerc", percentNumber)
    })
}

function updateNukeLabel(i, c){ //Info next to bubble chart
    d3.csv('warheads.csv', function(d) {
        return d;
    }).then(function(data) { 
        data = data.filter(function(d) { 
            return d.Year == i && d.Country === c
        })
        //this needs to be different from other scale because we want the full country name for description
        countryScale = d3.scaleOrdinal().domain(countries).range(["United States", "Russia","United Kingdom", "France", "China", "Israel", "India", "Pakistan", "North Korea"])

        let desc = "That's equivalent to about " + (+data[0].Number * 30).toLocaleString() + " kilotons of TNT, enough to destroy San Francisco ~" + Math.round(((+data[0].Number * 30 * 1.5) / 121)).toLocaleString() + " times!"

        document.getElementById("yearLabel").innerHTML = "In " + data[0].Year + ","
        if(data[0].Country === "US" || data[0].Country == "UK"){
            document.getElementById("countryLabel3").innerHTML = "the "
            document.getElementById("countryLabel2").innerHTML = countryScale(data[0].Country)
        } else { 
            document.getElementById("countryLabel3").innerHTML = ""
            document.getElementById("countryLabel2").innerHTML = countryScale(data[0].Country)
        }
        document.getElementById("countryLabel2").style = "-webkit-text-stroke: 1px " + color(c) + "; color: black";
        document.getElementById("nukelabel").innerHTML = (+data[0].Number).toLocaleString()
        document.getElementById("nukelabel").style = "color: " + color(c) + "; -webkit-text-stroke: 2px black";
        document.getElementById("desclabel").innerHTML = desc
    })
}

function updateDescription(i) { //Info for description under timeline
    d3.csv('warheads2.csv', function(d) {
        return d;
    }).then(function(data) { 
        data = data.filter(function(d) { 
            return d.Date == i
        })

        function hexToRGB(hex, alpha) { //hex to rgb function for counters css
            var r = parseInt(hex.slice(1, 3), 16),
                g = parseInt(hex.slice(3, 5), 16),
                b = parseInt(hex.slice(5, 7), 16);
        
            if (alpha) {
                return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
            } else {
                return "rgb(" + r + ", " + g + ", " + b + ")";
            }
        }        

        const countries = ["US", "RS", "CN", "FR", "UK", "PK", "IS", "IN" , "NK"]
        countryScale = d3.scaleOrdinal().domain(countries).range(["USA", "Russia", "China", "France", "UK", "Pakistan", "Israel", "India", "North Korea"])
        for(let i = 0; i < countries.length; i++) { //setting each counter's color and info
            const divID = countries[i] + "Counter"
            const accessor = countryScale(countries[i])
            document.getElementById(divID).innerHTML = d3.format(",")(data[0][accessor])
            document.getElementById(divID).style = "background-color: " + hexToRGB(color(countries[i]), 0.7) + ";" + 
            "box-shadow: 0px 0px 0px 4px " + hexToRGB(color(countries[i]), 0.3) + ";"
        }
        
        document.getElementById("description").innerHTML = data[0].Descriptions;
    })
}

createPictograph(1945, currentCountry) //set up screen for initial load
updateNukeLabel(1945, currentCountry)
updateDescription(1945)
createBubbleChart(1945);