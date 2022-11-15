var margin = {left: 0, right: 0, top: 0, bottom: 0 }, 
    width = 1920 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// For data storage
var DensityById = new Map();
var StateByID = new Map();
var CountyByID = new Map();

// Color Scales
var colorRd = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeOrRd[9]);
    
var colorPu = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
    .range(d3.schemeBuPu[9]);

// Default color
var color = colorRd;
    
// Geomapping Projects
var projection = d3.geoAlbers()
    .scale(5000)
    .translate([0.9 * width, 1.4 * height]);

var path = d3.geoPath()
    .projection(projection);
    
// Tooltip element
var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
var borderOpacity = 0.3;
    
var promises = [
    // Read in Data
    d3.json("us-10m.json"),
    d3.csv("Population-Density By County.csv", function(d) {
        DensityById.set(+d["GCT_STUB.target-geo-id2"], +d["Density per square mile of land area"]);
        StateByID.set(+d["GCT_STUB.target-geo-id2"], d["GEO.display-label"]);
        CountyByID.set(+d["GCT_STUB.target-geo-id2"], d["GCT_STUB.display-label"]);
    })
];
    
Promise.all(promises).then(ready);

function ready([us]) {
    
    console.log(DensityById);
    console.log(StateByID);
    console.log(CountyByID);
    
    // Draw Counties
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .filter(function(d) {return StateByID.get(d.id) == "Idaho";})
        .attr("fill", function(d) { return color(DensityById.get(d.id)); })
        .attr("d", path)
        // Mouseover Tooltip
        .on("mouseover", function(event,d) {
            div.transition().duration(200).style("opacity", 0.9);
            div.html(`Code: ${d.id} <br/> State: Idaho <br/> County: ${CountyByID.get(d.id)} <br/> Density: ${DensityById.get(d.id)}` )
                .style("left", (event.pageX + 30) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .append("title")
        .text(function(d) { return d.rate + "%"; });

    // Border Lines
    var borderData = topojson.feature(us, us.objects.counties);
    borderData.features = borderData.features.filter(function(d) {return StateByID.get(d.id) == "Idaho";});
    console.log(borderData);

    svg.append("path")
      .datum(borderData)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-opacity", borderOpacity)
      .attr("d", path);

    // Legend
    var x = d3.scaleSqrt()
        .domain([0, 4500])
        .rangeRound([440, 950]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(200,50)");

    g.selectAll("rect")
      .data(color.range().map(function(d) {
          d = color.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); });

    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square mile");

    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickValues(color.domain()))
      .select(".domain")
        .remove();
}

//https://bl.ocks.org/pbogden/7487564
var colorButton = d3.button()
    .on('press', function(d, i) { color = colorPu; Promise.all(promises).then(ready);})
    .on('release', function(d, i) { color = colorRd; Promise.all(promises).then(ready);});

var borderButton = d3.button()
    .on('press', function(d, i) { borderOpacity = 0; Promise.all(promises).then(ready);})
    .on('release', function(d, i) { borderOpacity = 0.3; Promise.all(promises).then(ready);});
    
// Add buttons
button1 = svg.selectAll('.colorbutton')
    .data([{label: "Color",     x: 0.5 * width, y: 0.175 * height }])
    .enter()
    .append('g')
    .attr('class', 'button')
    .call(colorButton);
    
button2 = svg.selectAll('.borderbutton')
    .data([{label: "Toggle County Boundary",     x: 0.5 * width, y: 0.275 * height }])
    .enter()
    .append('g')
    .attr('class', 'button')
    .call(borderButton);
    