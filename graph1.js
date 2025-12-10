//Scatterplot
//Allows global filters
if (!window.filterAgeRange) {
    window.filterAgeRange = null;
}
if (!window.filterItem) {
    window.filterItem = null;
}

//Tooltip creation
var tooltip = d3.select("body").select("#tooltip");
if (tooltip.empty()) {
    tooltip = d3.select("body")
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
window.globalTooltip = tooltip;

//Ages to buckets
function ageRangeBucketGraph1(age) {
    if (age >= 18 && age <= 30) return "18-30";
    if (age >= 31 && age <= 43) return "31-43";
    if (age >= 44 && age <= 56) return "44-56";
    if (age >= 57 && age <= 70) return "57-70";
    return;
}

//Load dataset
d3.csv("shopping_behavior_updated.csv").then(function(dataset){

    dataset.forEach(function(d, i){
        d.Age = +d.Age;
        d.PurchaseAmount = +d["Purchase Amount (USD)"];
        d.__id = i;
    });

    //Graph dimensions
    var dimensions = {
        width: 1400,
        height: 280,
        margin: {
            top: 30,
            right: 20,
            bottom: 60,
            left: 90
        }
    };

    //Accessors for x and y values
    var xAccessor = function(d){ return d.Age; };
    var yAccessor = function(d){ return d.PurchaseAmount; };

    //Min/max values for axes
    var xExtent = d3.extent(dataset, xAccessor);
    var yExtent = d3.extent(dataset, yAccessor);

    //Scales
    var xScale = d3.scaleLinear()
               .domain(xExtent)
               .range([dimensions.margin.left, dimensions.width - dimensions.margin.right]);

    var yScale = d3.scaleLinear()
               .domain(yExtent)
               .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top]);


    //Create SVG
    var svg = d3.select("#graph1")
                .attr("width", dimensions.width)
                .attr("height", dimensions.height);

    //X-axis
    var xAxisGen = d3.axisBottom().scale(xScale);
    var xAxis = svg.append("g")
                   .call(xAxisGen)
                   .style("transform", "translateY(" + (dimensions.height - dimensions.margin.bottom) + "px)");
    xAxis.selectAll("text").style("font-size", "12px");

    //Y-axis
    var yAxisGen = d3.axisLeft().scale(yScale);
    var yAxis = svg.append("g")
                   .call(yAxisGen)
                   .style("transform", "translateX(" + dimensions.margin.left + "px)");
    yAxis.selectAll("text").style("font-size", "12px");

    //X-axis title
    svg.append("text")
        .attr("x", (dimensions.width / 2))
        .attr("y", dimensions.height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Age");

    //Y-axis title
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(dimensions.height / 2))
        .attr("y", 35)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Purchase Amount (USD)");

    //Holds the points
    var dotsGroup = svg.append("g");

    //Applies filters from interaction
    function getFilteredData(){
        return dataset.filter(function(d){
            var ageOk = !window.filterAgeRange ||
                        ageRangeBucketGraph1(d.Age) === window.filterAgeRange;
            var itemOk = !window.filterItem ||
                        d["Item Purchased"] === window.filterItem;
            return ageOk && itemOk;
        });
    }

    //Main update function
    window.updateScatter = function(){

        var filtered = getFilteredData();

        //Clear points for filters
        if (!filtered.length) {
            dotsGroup.selectAll("circle").remove();
            return;
        }

        //Anti-collision
        var simulation = d3.forceSimulation(filtered)
            .force("x", d3.forceX(function(d){ return xScale(xAccessor(d)); }).strength(0.4))
            .force("y", d3.forceY(function(d){ return yScale(yAccessor(d)); }).strength(0.4))
            .force("collide", d3.forceCollide(3.5))
            .stop();

        //Run simulation
        for (var i = 0; i < 100; i++) {
            simulation.tick();
        }

        //D3 data join for the points
        var dots = dotsGroup
                    .selectAll("circle")
                    .data(filtered, function(d){ return d.__id; });

        //Handling for the points
        dots.join(
            function(enter){
                return enter
                        .append("circle")
                        .attr("cx", function(d){ return d.x; })
                        .attr("cy", function(d){ return d.y; })
                        .attr("r", 2.5)
                        .style("fill", function(d){
                            if (d.Gender === "Male") return "#3299e7ff";
                            if (d.Gender === "Female") return "#e84aa9ff";
                            return "gray";
                        })
                        .style("opacity", 0.25)
                        .on("mousemove", function(event, d){
                            tooltip
                                .style("opacity", 1)
                                .html(
                                    "<strong>Age:</strong> " + d.Age + "<br/>" +
                                    "<strong>Gender:</strong> " + d.Gender + "<br/>" +
                                    "<strong>Item:</strong> " + d["Item Purchased"] + "<br/>" +
                                    "<strong>Amount:</strong> $" + d.PurchaseAmount.toFixed(2) + "<br/>" +
                                    "<strong>Season:</strong> " + d.Season + "<br/>" +
                                    "<strong>Freq:</strong> " + d["Frequency of Purchases"]
                                )
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY + 10) + "px");
                        })
                        .on("mouseleave", function(){
                            tooltip.style("opacity", 0);
                        });
            },
            function(update){
                return update
                        .attr("cx", function(d){ return d.x; })
                        .attr("cy", function(d){ return d.y; });
            },
            function(exit){
                return exit.remove();
            }
        );
    };

    //Render
    window.updateScatter();
});
