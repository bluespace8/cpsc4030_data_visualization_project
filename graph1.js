//Scatter plot
if (!window.filterAgeRange) {
    window.filterAgeRange = null;
}
if (!window.filterItem) {
    window.filterItem = null;
}

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

function ageRangeBucketGraph1(age) {
    if (age >= 18 && age <= 30) return "18-30";
    if (age >= 31 && age <= 43) return "31-43";
    if (age >= 44 && age <= 56) return "44-56";
    if (age >= 57 && age <= 70) return "57-70";
    return;
}

d3.csv("shopping_behavior_updated.csv").then(function(dataset){
    console.log(dataset)
    dataset.forEach(function(d, i){
        d.Age = +d.Age;
        d.PurchaseAmount = +d["Purchase Amount (USD)"];
        d.__id = i;
    });

    var dimensions = {
        width: 1200,
        height: 600,
        margin: {
            top: 40,
            right: 40,
            bottom: 60,
            left: 80
        }
    }

    var xAccessor = function(d){ return d.Age }
    var yAccessor = function(d){ return d.PurchaseAmount }

    var xScale = d3.scaleLinear()
                    .domain(d3.extent(dataset, xAccessor))
                    .range([dimensions.margin.left, dimensions.width - dimensions.margin.right])

    var yScale = d3.scaleLinear()
                    .domain(d3.extent(dataset, yAccessor))
                    .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top])

    var svg = d3.select("#graph1")
                .style("width", dimensions.width)
                .style("height", dimensions.height)

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
        .attr("x", (dimensions.width / 2))
        .attr("y", dimensions.height - 15)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Age");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(dimensions.height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Purchase Amount (USD)");


    var dotsGroup = svg.append("g")

    function getFilteredData(){
        return dataset.filter(function(d){
            var ageOk = !window.filterAgeRange ||
                        ageRangeBucketGraph1(d.Age) === window.filterAgeRange;
            var itemOk = !window.filterItem ||
                        d["Item Purchased"] === window.filterItem;
            return ageOk && itemOk;
        });
    }

    window.updateScatter = function(){

        var filtered = getFilteredData();

        var dots = dotsGroup
                    .selectAll("circle")
                    .data(filtered, function(d){ return d.__id })

        dots.join(
            function(enter){
                return enter
                        .append("circle")
                        .attr("cx", function(d){ return xScale(xAccessor(d)) })
                        .attr("cy", function(d){ return yScale(yAccessor(d)) })
                        .attr("r", 3)
                        .style("fill", function(d){
                            if (d.Gender === "Male") return "#195ae6ff";
                            if (d.Gender === "Female") return "#ff0e0eff";
                            return "gray";
                        })
                        .style("opacity", 0.4)
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
                        .attr("cx", function(d){ return xScale(xAccessor(d)) })
                        .attr("cy", function(d){ return yScale(yAccessor(d)) });
            },
            function(exit){
                return exit.remove();
            }
        );
    }

    window.updateScatter();

})
