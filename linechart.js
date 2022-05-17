var canvasWidth = document.getElementById("linechart").clientWidth; //for scaling chart to window size
var canvasHeight = document.getElementById("linechart").clientHeight;

const countriesList = ["US", "RS", "UK", "FR", "CN", "IS", "IN" ,"PK", "NK"]
countryScale = d3.scaleOrdinal().domain(countriesList).range(["USA","Russia","UK","France","China","Israel","India","Pakistan","North Korea"])

function drawLineToolTip(year) { //drawing tooltip for hover
  d3.select(".mouse-line")
    .style("opacity", "1")
    .style("stroke-dasharray", ("3, 3"))
    .attr("d", function() {
      var d = "M" + x(+year) + "," + canvasHeight;
      d += " " + x(+year) + "," + 0;
      return d;
    });
  d3.selectAll(".mouse-per-line circle")
    .style("opacity", "0.8");
  d3.selectAll(".mouse-per-line text")
    .style("opacity", "1");

  d3.selectAll(".mouse-per-line")
  .attr("transform", function(d, i) {
      var lines = document.getElementsByClassName('line');

      var beginning = 0,
          end = lines[i].getTotalLength(),
          target = null;
      
      while (lines[i]){
        target = Math.floor((beginning + end) / 2);
        pos = lines[i].getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== x(+year)) {
            break;
        }
        if (pos.x > x(+year)) end = target;
        else if (pos.x < x(+year)) beginning = target;
        else break; //position found
      }
      return "translate(" + x(+year) + "," + pos.y +")";

    
    
  })
}

var parseTime = d3.timeParse("%d-%b-%y");
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

var svg = d3.select("#linechart").append('svg')
    .attr("width", canvasWidth)
    .attr("height", canvasHeight),
    margin = {top: 20, right: 50, bottom: 5, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width]),
    y = d3.scalePow().exponent(0.25).range([height, 0]), //special y scale because of drastic difference in numbers
    z = d3.scaleOrdinal(d3.schemeTableau10);

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.warheads); });

d3.csv("warheads2.csv", function(d) {
	return d;
}).then(function(data) {

    //formatting data for line chart
	  let columns = data.columns
	  for (d of data) {
		      d.date = d.Date;
  	      for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
	  }

	  var countries = columns.slice(1,10).map(function(id) {  
      return {
        id: id,
        values: data.map(function(d) {
          return {date: d.Date, warheads: d[id]};
        }),
      };
	  });

	  x.domain(d3.extent(data, function(d) { return d.Date; }));

	  y.domain([0, max]);

	  z.domain(countries.map(function(c) { 
      return c.id; 
    }));

	  g.append("g")
	      .attr("class", "axis axis--y")
	      .call(d3.axisLeft(y).tickValues([0, 10, 50, 100, 200, 500, 1000, 5000, 10000, 20000, 30000, 41000])) //custom tick values due to power scale
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "1em")
        .style("font-size", "15px")
	      .attr("fill", "#000")
	      .text("Nuclear Warheads");

    //line chart "box" lines
    g.append("line")
      .attr("x1", width)
      .attr("x2", width)
      .attr("y1", 0)
      .attr("y2", height)
      .style("stroke", "black")
      .style("stroke-width", 3)

    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", height + 1)
      .attr("y2", height + 1)
      .style("stroke", "black")
      .style("stroke-width", 3)

	  var country = g.selectAll(".country")
	    .data(countries)
	    .enter().append("svg")
	      .attr("class", "country")
		  .attr("width", width)
      .attr("height", height)

	  function hover(elem) { //hover interaction
		  var attrs = elem.srcElement.attributes;
		  var id = attrs.id.value.substring(0,2)
      var full = countryScale(id)
      id = full.substring(0, 3).toUpperCase()
		  let path = country.select('#' + id);
      if (path.attr('visibility') == 'hidden') {
        return;
      }
      country.selectAll('.line').style("stroke", "grey") //set all lines to grey
      d3.selectAll('.mouse-per-line circle').style("fill", "grey").style("stroke", "grey").style("opacity", 0.1)
      d3.select('#' + id + "Circle").style("fill", z(full)).style("stroke", z(full)).style("opacity", 1) //set selected line to its color
      path.style("stroke-width", "5px") //make that line more apparent
      path.style("stroke", z(full))
      path.style("opacity", 1)
	  }

    var mouseG = country.append("g")
      .attr("class", "mouse-over-effects");

    mouseG.append("path") // this is the black vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "gray")
      .style("stroke-dasharray", ("3, 3"))
      .style("stroke-width", "3px")
      .style("opacity", "0.3");
         
    var mousePerLine = mouseG.selectAll('mouse-per-line')
      .data(countries)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
      .attr("r", 5)
      .attr("id", function(d) {
        return d.id.substring(0, 3).toUpperCase() + "Circle"
      })
      .style("stroke", function(d) {
        return z(d.id);
      })
      .style("fill", function(d) {
        return z(d.id);
      })
      .style("stroke-width", "2px")
      .style("opacity", "0.8");

    mouseG.append('rect') // append a rect to catch mouse movements on canvas
      .attr('width', canvasWidth) // can't catch mouse events on a g element
      .attr('height', canvasHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0.8");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })
      .on('mousemove', function(event) { // mouse moving over canvas
        var mouse = d3.pointer(event);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + canvasHeight;
            d += " " + mouse[0] + "," + 0;
            return d;
          });

        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
              if(i < 10) {
                sliderTime.value([new Date(x.invert(mouse[0]), 10, 3)]);
            }
      })})
          

	  function exit(elem) { //reset all elements once hover is over
      var attrs = elem.srcElement.attributes;
		  var id = attrs.id.value.substring(0,2)
      var full = countryScale(id)
      id = full.substring(0, 3).toUpperCase()
      let path = country.select('#' + id);
      if (path.attr('visibility') == 'hidden') {
      return;
      }
      country.selectAll('.line').style('stroke', d => {
        return z(d.id)
      });
      d3.selectAll('.mouse-per-line circle').style("fill", d => {
        return z(d.id)
      }).style("stroke", d => {
        return z(d.id)
      }).style("opacity", 0.8)
		  country.selectAll('.line').style('stroke-width', "5px")
      country.selectAll('.line').style('opacity', 0.7)
	  }

	  country.append("path")
	      .attr("class", "line")
	      .attr("d", function(d) { return line(d.values); }) 
        .attr("id", d => d.id.substring(0, 3).toUpperCase())
        .attr("data-id", d => d.id.substring(0, 3).toUpperCase()) //attributes for interaction
        .attr("full-name", d => d.id)
        .attr("visibility", "visible")
	      .style("stroke", function(d) { return z(d.id); })

    d3.selectAll(".counter") //hover action for counters
      .on("mouseover", hover)
      .on("mouseout", exit)

    //scale for legend
    var ordinal = d3.scaleOrdinal()
    .domain(z.domain())
    .range(d3.schemeTableau10);
      
    svg.append("g")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate(" + (width - 70) + ",30)");
    
    //legend
    var legendOrdinal = d3.legendColor()
      .shape("circle").shapeRadius(5)
      .shapePadding(0)
      .scale(ordinal);
    
    svg.select(".legendOrdinal")
      .call(legendOrdinal);

    drawLineToolTip(1945)
})