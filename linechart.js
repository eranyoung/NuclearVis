var canvasWidth = document.getElementById("linechart").clientWidth;
var canvasHeight = document.getElementById("linechart").clientHeight;

var parseTime = d3.timeParse("%d-%b-%y");
    bisectDate = d3.bisector(function(d) { return d.date; }).left;

var svg = d3.select("#linechart").append('svg')
    .attr("width", canvasWidth)
    .attr("height", canvasHeight),
    margin = {top: 20, right: 50, bottom: 30, left: 50},
    width = svg.attr("width") - margin.left - margin.right,
    height = svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().range([0, width - margin.right]),
    y = d3.scalePow().exponent(0.25).range([height, 0]),
    z = d3.scaleOrdinal(d3.schemeCategory10);

const makeLine = (xScale) => d3.line()
	.curve(d3.curveBasis)
	.x(function(d) { return xScale(d.date); })
    .y(function(d) { return y(d.warheads); });

var line = d3.line()
    .curve(d3.curveBasis)
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.warheads); });

d3.csv("warheads2.csv", function(d) {
	return d;
}).then(function(data) {

	  let columns = data.columns
	  for (d of data) {
		      d.date = d.Date;
  	      for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
	  }

	  var cities = data.columns.slice(1).map(function(id) {
	    return {
	      id: id,
	      values: data.map(function(d) {
	        return {date: d.Date, warheads: parseInt(d[id], 10)};
	      }),
	    };
	  });

	  x.domain(d3.extent(data, function(d) { return d.Date; }));

	  y.domain([
	    d3.min(cities, function(c) { return d3.min(c.values, function(d) { return +d.warheads; }); }),
	    d3.max(cities, function(c) { return d3.max(c.values, function(d) { return +d.warheads; }); })
	  ]);

	  z.domain(cities.map(function(c) { return c.id; }));

	  const x_axis = g.append("g")
	      .attr("class", "axis axis--x")
	      .attr("id", 'x_axis')
	      .attr("transform", "translate(0," + height + ")")
	      .call(d3.axisBottom(x));

	  g.append("g")
	      .attr("class", "axis axis--y")
	      .call(d3.axisLeft(y))
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", "0.71em")
	      .attr("fill", "#000")
	      .text("Warheads");

	  var city = g.selectAll(".city")
	    .data(cities)
	    .enter().append("svg")
	      .attr("class", "city")
		  .attr("width", width - margin.right);

	  function hover(elem) {
      console.log(elem)
		  var attrs = elem.srcElement.attributes;
		  let id = attrs['data-id'].value;
		  let path = city.select('#' + id);
      if (path.attr('visibility') == 'hidden') {
        return;
      }
      city.selectAll('.line').style("stroke", "grey")
      path.style("stroke-width", "5px")
      path.style("stroke", z(attrs['full-name'].value))
	  }

    var mouseG = city.append("g")
      .attr("class", "mouse-over-effects");

    mouseG.append("path") // this is the black vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("opacity", "0");
      
    var lines = document.getElementsByClassName('line');
    console.log(cities)

    var mousePerLine = mouseG.selectAll('mouse-per-line')
      .data(cities)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
      .attr("r", 7)
      .style("stroke", function(d) {
        return z(d.id);
      })
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mousePerLine.append("text")
      .attr("transform", "translate(10,3)");

    mouseG.append('rect') // append a rect to catch mouse movements on canvas
      .attr('width', canvasWidth) // can't catch mouse events on a g element
      .attr('height', canvasHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
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
              var xDate = x.invert(mouse[0]),
                  bisect = d3.bisector(function(d) { return d.date; }).right;
                  idx = bisect(d.values, xDate);

              var beginning = 0,
                  end = lines[i].getTotalLength(),
                  target = null;

              while (lines[i]){
                target = Math.floor((beginning + end) / 2);
                pos = lines[i].getPointAtLength(target);
                if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                    break;
                }
                if (pos.x > mouse[0]) end = target;
                else if (pos.x < mouse[0]) beginning = target;
                else break; //position found
              }
                
              d3.select(this).select('text')
                .text(y.invert(pos.y).toFixed(2));
                
              return "translate(" + mouse[0] + "," + pos.y +")";
            
          })})
          

	  function exit(elem) {
      var attrs = elem.srcElement.attributes;
      let id = attrs['data-id'].value;
      let path = city.select('#' + id);
      if (path.attr('visibility') == 'hidden') {
      return;
      }
      city.selectAll('.line').style('stroke', d => {
      return z(d.id)
      });
		  city.selectAll('.line').style('stroke-width', "2px")
	  }

	  function click(elem) {
	    var attrs = elem.srcElement.attributes;
		  let id = attrs['data-id'].value;
	  	let path = city.select('#' + id);
      if (path.attr('visibility') == 'hidden') {
        path.attr("visibility", "visible")
      } else { 
        path.attr("visibility", "hidden")
      } 
	  }

	  const xAxis = (g, x) => g
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0).tickFormat(d3.format("d")))

	  function zoomed(event) {
      const xz = event.transform.rescaleX(x);
      city.selectAll('.line').attr('d', function(d) { return makeLine(xz)(d.values); })
      x_axis.call(xAxis, xz);
	  }

	  const zoom = d3.zoom()
	      .scaleExtent([1, 5])
	      .extent([[0, 0], [width, height]])
	      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
	      .on("zoom", zoomed);

	  svg.call(zoom)
	    .transition()
	      .duration(100)
	      .call(zoom.scaleTo, 1, [x(Date.UTC(2012, 1, 1)), 0]);

    const transitionPath = d3.transition().ease(d3.easeSin).duration(2500);

	  city.append("path")
	      .attr("class", "line")
	      .attr("d", function(d) { return line(d.values); })
        .attr("id", d => d.id.substring(0, 3).toUpperCase())
        .attr("data-id", d => d.id.substring(0, 3).toUpperCase())
        .attr("full-name", d => d.id)
        .attr("visibility", "visible")
	      .style("stroke", function(d) { return z(d.id); })
        .on("mouseout", exit)
        .on("mouseover", hover)

	  svg.selectAll(".label")
		  .data(cities)
		  .enter()
          .append("text")
	      .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
		  .attr("class", "label")
	      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.warheads) + ")"; })
	      .attr("x", 55)
		  .attr("y", 15)
	      .attr("dy", "0.35em")
		  .attr("data-id", d => d.id.substring(0, 3).toUpperCase())
	      .style("font", "10px sans-serif")
	      .text(function(d) { return d.id; })
		  .on("mouseout", exit)
		  .on("click", click)
})