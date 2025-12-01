//Bar chart
//Tooltips
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

//Global filter
if (!window.filterItem) {
    window.filterItem = null;
}

//Load dataset
d3.csv("shopping_behavior_updated.csv").then(
    function(dataset){

        console.log(dataset);

        //Purchase amounts
        dataset.forEach(function(d){
            d.PurchaseAmount = +d["Purchase Amount (USD)"];
        });

        //Aggregate revenue
        var agg = d3.rollups(
            dataset,
            function(v){ return d3.sum(v, function(d){ return d.PurchaseAmount; }) },
            function(d){ return d["Item Purchased"]; }
        );

        var dataAgg = agg.map(function(d){
            return { Item: d[0], Revenue: d[1] };
        });

        //Sort items
        dataAgg.sort(function(a,b){
            return d3.descending(a.Revenue, b.Revenue);
        });

        //Graph dimensions
        var dimensions = {
            width: 1000,
            height: 280,
            margin:{
                top: 30,
                bottom: 80,
                right: 30,
                left: 80
            }
        };

        //Create SVG
        var svg = d3.select("#graph3")
                    .style("width", dimensions.width)
                    .style("height", dimensions.height);

        //X-scale
        var xScale = d3.scaleBand()
                       .domain(dataAgg.map(function(d){ return d.Item; }))
                       .range([dimensions.margin.left ,dimensions.width - dimensions.margin.right])
                       .padding([0.2]);

        //Y-scale
        var yScale = d3.scaleLinear()
                       .domain([0, d3.max(dataAgg, function(d){ return d.Revenue; })])
                       .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top]);

        //Bars
        var bars = svg.append("g")
                      .selectAll("rect")
                      .data(dataAgg)
                      .enter()
                      .append("rect")
                      .attr("x", function(d){ return xScale(d.Item); })
                      .attr("y", function(d){ return yScale(d.Revenue); })
                      .attr("height", function(d){ return yScale(0) - yScale(d.Revenue); })
                      .attr("width", function(d){ return xScale.bandwidth(); })
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
                          //Toggle filter
                          if (window.filterItem === d.Item) {
                              window.filterItem = null;
                          } else {
                              window.filterItem = d.Item;
                          }

                          //Clear previous outlines
                          bars
                            .style("stroke", null)
                            .style("stroke-width", null);

                          //Outline selected item
                          if (window.filterItem) {
                              bars
                                .filter(function(b){ return b.Item === window.filterItem; })
                                .style("stroke", "black")
                                .style("stroke-width", 2);
                          }

                          //Update scatterplot
                          if (window.updateScatter) {
                              window.updateScatter();
                          }
                      });

        //X-axis
        var xAxisGen = d3.axisBottom().scale(xScale);
        var xAxis = svg.append("g")
                       .call(xAxisGen)
                       .style("transform", "translateY(" + (dimensions.height - dimensions.margin.bottom) + "px)");
        xAxis.selectAll("text")
             .attr("transform", "rotate(-45)")
             .attr("text-anchor", "end")
             .style("font-size", "18px");

        //Y-axis
        var yAxisGen = d3.axisLeft().scale(yScale);
        var yAxis = svg.append("g")
                       .call(yAxisGen)
                       .style("transform", "translateX(" + dimensions.margin.left + "px)");
        yAxis.selectAll("text").style("font-size", "18px");

        //X-axis title
        svg.append("text")
            .attr("x", (dimensions.width / 2))
            .attr("y", dimensions.height - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Item Purchased");

        //Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(dimensions.height / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .text("Total Revenue (USD)");

    }
);