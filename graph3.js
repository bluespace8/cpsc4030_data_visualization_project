//Bar chart
var tooltip3 = d3.select("body").select("#tooltip");
if (tooltip3.empty()) {
    tooltip3 = d3.select("body")
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
window.globalTooltip = tooltip3;

if (!window.filterItem) {
    window.filterItem = null;
}

d3.csv("shopping_behavior_updated.csv").then(
    function(dataset){

        console.log(dataset)

        dataset.forEach(function(d){
            d.PurchaseAmount = +d["Purchase Amount (USD)"];
        });

        var agg = d3.rollups(
            dataset,
            function(v){ return d3.sum(v, function(d){ return d.PurchaseAmount }) },
            function(d){ return d["Item Purchased"] }
        );

        var dataAgg = agg.map(function(d){
            return { Item: d[0], Revenue: d[1] };
        });

        dataAgg.sort(function(a,b){
            return d3.descending(a.Revenue, b.Revenue);
        });

        var dimensions = {
            width: 1400,
            height: 550,
            margin:{
                top: 40,
                bottom: 140,
                right: 40,
                left: 120
            }
        }

        var svg = d3.select("#graph3")
                    .style("width", dimensions.width)
                    .style("height", dimensions.height)

        var xScale = d3.scaleBand()
                       .domain(dataAgg.map(function(d){ return d.Item }))
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
                      .attr("x", function(d){ return xScale(d.Item) })
                      .attr("y", function(d){ return yScale(d.Revenue) })
                      .attr("height", function(d){ return yScale(0) - yScale(d.Revenue) })
                      .attr("width", function(d){ return xScale.bandwidth() })
                      .style("fill", "#df7213ff")
                      .on("mousemove", function(event, d){
                          tooltip3
                            .style("opacity", 1)
                            .html(
                                "<strong>Item:</strong> " + d.Item + "<br/>" +
                                "<strong>Total Revenue:</strong> $" + d.Revenue.toFixed(2)
                            )
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY + 10) + "px");
                      })
                      .on("mouseleave", function(){
                          tooltip3.style("opacity", 0);
                      })
                      .on("click", function(event, d){
                          if (window.filterItem === d.Item) {
                              window.filterItem = null;
                          } else {
                              window.filterItem = d.Item;
                          }

                          bars
                            .style("stroke", null)
                            .style("stroke-width", null);

                          if (window.filterItem) {
                              bars
                                .filter(function(b){ return b.Item === window.filterItem })
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
        xAxis.selectAll("text")
             .attr("transform", "rotate(-45)")
             .attr("text-anchor", "end")
             .style("font-size", "18px");

        var yAxisGen = d3.axisLeft().scale(yScale)
        var yAxis = svg.append("g")
                       .call(yAxisGen)
                       .style("transform", "translateX(" + dimensions.margin.left + "px)")
        yAxis.selectAll("text").style("font-size", "18px");

        svg.append("text")
            .attr("x", (dimensions.width / 2))
            .attr("y", dimensions.height - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Item Purchased");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(dimensions.height / 2))
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Total Revenue (USD)");

    }
)