//Bar Chart
var tooltip2 = d3.select("body").select("#tooltip");
if (tooltip2.empty()) {
    tooltip2 = d3.select("body")
                 .append("div")
                 .attr("id", "tooltip")
                 .style("position", "absolute")
                 .style("background", "white")
                 .style("border", "1px solid #ffffffff")
                 .style("padding", "6px")
                 .style("font-size", "18px")
                 .style("pointer-events", "none")
                 .style("opacity", 0);
}
window.globalTooltip = tooltip2;

if (!window.filterAgeRange) {
    window.filterAgeRange = null;
}

function ageRangeBucket(age) {
    if (age >= 18 && age <= 30) return "18-30";
    if (age >= 31 && age <= 43) return "31-43";
    if (age >= 44 && age <= 56) return "44-56";
    if (age >= 57 && age <= 70) return "57-70";
    return "Other";
}

d3.csv("shopping_behavior_updated.csv").then(
    function(dataset){

        console.log(dataset)

        dataset.forEach(function(d){
            d.Age = +d.Age;
            d.PurchaseAmount = +d["Purchase Amount (USD)"];
            d.AgeRange = ageRangeBucket(d.Age);
        });

        var dimensions = {
            width: 1200,
            height: 500,
            margin:{
                top: 40,
                bottom: 80,
                right: 40,
                left: 120
            }
        }

        var svg = d3.select("#graph2")
                    .style("width", dimensions.width)
                    .style("height", dimensions.height)

        var agg = d3.rollups(
            dataset.filter(function(d){ return d.AgeRange !== "Other" }),
            function(v){ return d3.sum(v, function(d){ return d.PurchaseAmount }) },
            function(d){ return d.AgeRange }
        );

        var dataAgg = agg.map(function(d){
            return { AgeRange: d[0], Revenue: d[1] };
        });

        var ageOrder = ["18-30","31-43","44-56","57-70"];
        dataAgg.sort(function(a,b){
            return ageOrder.indexOf(a.AgeRange) - ageOrder.indexOf(b.AgeRange);
        });

        var xScale = d3.scaleBand()
                       .domain(dataAgg.map(function(d){ return d.AgeRange }))
                       .range([dimensions.margin.left ,dimensions.width - dimensions.margin.right])
                       .padding([0.2])

        var yScale = d3.scaleLinear()
                       .domain([0, d3.max(dataAgg, function(d){ return d.Revenue })])
                       .range([dimensions.height-dimensions.margin.bottom, dimensions.margin.top])

        var bars = svg.append("g")
                      .selectAll("rect")
                      .data(dataAgg)
                      .enter()
                      .append("rect")
                      .attr("x", function(d){ return xScale(d.AgeRange) })
                      .attr("y", function(d){ return yScale(d.Revenue) })
                      .attr("height", function(d){ return yScale(0) - yScale(d.Revenue) })
                      .attr("width", function(d){ return xScale.bandwidth() })
                      .style("fill", "#1c7fc5ff")
                      .on("mousemove", function(event, d){
                          tooltip2
                            .style("opacity", 1)
                            .html(
                                "<strong>Age Range:</strong> " + d.AgeRange + "<br/>" +
                                "<strong>Total Revenue:</strong> $" + d.Revenue.toFixed(2)
                            )
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY + 10) + "px");
                      })
                      .on("mouseleave", function(){
                          tooltip2.style("opacity", 0);
                      })
                      .on("click", function(event, d){
                          if (window.filterAgeRange === d.AgeRange) {
                              window.filterAgeRange = null;
                          } else {
                              window.filterAgeRange = d.AgeRange;
                          }

                          bars
                            .style("stroke", null)
                            .style("stroke-width", null);

                          if (window.filterAgeRange) {
                              bars
                                .filter(function(b){ return b.AgeRange === window.filterAgeRange })
                                .style("stroke", "black")
                                .style("stroke-width", 2);
                          }

                          if (window.updateScatter) {
                              window.updateScatter();
                          }
                      });

        var xAxisGen = d3.axisBottom().scale(xScale)
        var xAxis = svg.append("g")
                       .call(xAxisGen)
                       .style("transform", "translateY(" + (dimensions.height - dimensions.margin.bottom) + "px)")
        xAxis.selectAll("text").style("font-size", "18px");

        var yAxisGen = d3.axisLeft().scale(yScale)
        var yAxis = svg.append("g")
                       .call(yAxisGen)
                       .style("transform", "translateX(" + dimensions.margin.left + "px)")
        yAxis.selectAll("text").style("font-size", "18px");

        svg.append("text")
            .attr("x", dimensions.width / 2)
            .attr("y", dimensions.height - dimensions.margin.bottom + 50)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Age Range");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(dimensions.height / 2))
            .attr("y", dimensions.margin.left - 90)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Total Revenue (USD)");

    }
)