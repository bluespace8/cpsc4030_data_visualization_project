//Grouped Bar Chart
//Tooltips
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

//Global filter for
if (!window.filterAgeRange) {
    window.filterAgeRange = null;
}

//Helper to bucket ages
function ageRangeBucket(age) {
    if (age >= 18 && age <= 30) return "18-30";
    if (age >= 31 && age <= 43) return "31-43";
    if (age >= 44 && age <= 56) return "44-56";
    if (age >= 57 && age <= 70) return "57-70";
    return "Other";
}

//Load dataset
d3.csv("shopping_behavior_updated.csv").then(
    function(dataset){

        dataset.forEach(function(d){
            d.Age = +d.Age;
            d.PurchaseAmount = +d["Purchase Amount (USD)"];
            d.AgeRange = ageRangeBucket(d.Age);
        });

        //Aggregate revenue
        var agg = d3.rollups(
            dataset.filter(function(d){ return d.AgeRange !== "Other"; }),
            function(v){ return d3.sum(v, function(d){ return d.PurchaseAmount; }); },
            function(d){ return d.AgeRange; },
            function(d){ return d.Gender; }
        );

        var dataAgg = [];
        agg.forEach(function(ageGroup){
            var ageRange = ageGroup[0];
            ageGroup[1].forEach(function(genderGroup){
                dataAgg.push({
                    AgeRange: ageRange,
                    Gender: genderGroup[0],
                    Revenue: genderGroup[1]
                });
            });
        });

        //Sort
        var ageOrder = ["18-30","31-43","44-56","57-70"];
        dataAgg.sort(function(a,b){
            var ao = ageOrder.indexOf(a.AgeRange) - ageOrder.indexOf(b.AgeRange);
            if (ao !== 0) return ao;
            if (a.Gender < b.Gender) return -1;
            if (a.Gender > b.Gender) return 1;
            return 0;
        });

        //Ages from leat to greatest
        var ages = ageOrder.filter(function(a){
            return dataAgg.some(function(d){ return d.AgeRange === a; });
        });

        //Distinct genders
        var genders = Array.from(new Set(dataAgg.map(function(d){ return d.Gender; })));

        //Graph dimensions
        var dimensions = {
            width: 480,
            height: 280,
            margin:{
                top: 30,
                bottom: 50,
                right: 20,
                left: 80
            }
        };

        //Create SVG
        var svg = d3.select("#graph2")
                    .attr("width", dimensions.width)
                    .attr("height", dimensions.height);

        //X-scale (age ranges)
        var x0 = d3.scaleBand()
                   .domain(ages)
                   .range([dimensions.margin.left ,dimensions.width - dimensions.margin.right])
                   .padding(0.2);

        //X-scale (gender within each age range)
        var x1 = d3.scaleBand()
                   .domain(genders)
                   .range([0, x0.bandwidth()])
                   .padding(0.1);

        //Y-scale
        var yScale = d3.scaleLinear()
                       .domain([0, d3.max(dataAgg, function(d){ return d.Revenue; })])
                       .nice()
                       .range([dimensions.height - dimensions.margin.bottom, dimensions.margin.top]);

        //Color scale
        var color = d3.scaleOrdinal()
                      .domain(genders)
                      .range(["#e84aa9ff", "#3299e7ff"]);

        //Group container for each age range
        var groups = svg.append("g")
                        .selectAll("g")
                        .data(ages)
                        .enter()
                        .append("g")
                        .attr("transform", function(d){ return "translate(" + x0(d) + ",0)"; });

        //Bars for each gender within its age group
        var bars = groups.selectAll("rect")
                         .data(function(age){
                             return dataAgg.filter(function(d){ return d.AgeRange === age; });
                         })
                         .enter()
                         .append("rect")
                         .attr("x", function(d){ return x1(d.Gender); })
                         .attr("y", function(d){ return yScale(d.Revenue); })
                         .attr("height", function(d){ return yScale(0) - yScale(d.Revenue); })
                         .attr("width", x1.bandwidth())
                         .style("fill", function(d){ return color(d.Gender); })
                         .on("mousemove", function(event, d){
                             tooltip2
                               .style("opacity", 1)
                               .html(
                                   "<strong>Age Range:</strong> " + d.AgeRange + "<br/>" +
                                   "<strong>Gender:</strong> " + d.Gender + "<br/>" +
                                   "<strong>Total Revenue:</strong> $" + d.Revenue.toFixed(2)
                               )
                               .style("left", (event.pageX + 10) + "px")
                               .style("top", (event.pageY + 10) + "px");
                         })
                         .on("mouseleave", function(){
                             tooltip2.style("opacity", 0);
                         })
                         .on("click", function(event, d){
                             //Toggle filter
                             if (window.filterAgeRange === d.AgeRange) {
                                 window.filterAgeRange = null;
                             } else {
                                 window.filterAgeRange = d.AgeRange;
                             }

                             //Clear existing outlines
                             bars
                               .style("stroke", null)
                               .style("stroke-width", null);

                             //Outline selected range
                             if (window.filterAgeRange) {
                                 bars
                                   .filter(function(b){ return b.AgeRange === window.filterAgeRange; })
                                   .style("stroke", "black")
                                   .style("stroke-width", 2);
                             }

                             //Update scatterplot
                             if (window.updateScatter) {
                                 window.updateScatter();
                             }
                         });

        //X-axis
        var xAxisGen = d3.axisBottom().scale(x0);
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
            .attr("x", dimensions.width / 2)
            .attr("y", dimensions.height - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Age Range");

        //Y-axis title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(dimensions.height / 2))
            .attr("y", 18)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Total Revenue (USD)");

        //Legend
        var legend = svg.append("g")
                        .attr("transform", "translate(" + (dimensions.width - dimensions.margin.right - 120) + "," + (dimensions.margin.top - 15) + ")");

        genders.forEach(function(g, i){
            var row = legend.append("g")
                            .attr("transform", "translate(0," + (i * 18) + ")");
            row.append("rect")
               .attr("width", 12)
               .attr("height", 12)
               .attr("fill", color(g));
            row.append("text")
               .attr("x", 18)
               .attr("y", 10)
               .style("font-size", "12px")
               .text(g);
        });

    }
);
