//sample heatmap visualization, to be used dynamically with tweets we have stored in Mongo

//mapping of state indices in our map JSON file to state names
var stateFill = {1:'Alabama',2:'Alaska',4:'Arizona',5:'Arkansas',6:'California',8:'Colorado',
                 9:'Connecticut',10:'Delaware',11:'District of Columbia',12:'Florida',13:'Georgia',
                 15:'Hawaii',16:'Idaho',17:'Illinois',18:'Indiana',19:'Iowa',20:'Kansas',
                 21:'Kentucky',22:'Louisiana',23:'Maine',24:'Maryland',25:'Massachusetts',
                 26:'Michigan',27:'Minnesota',28:'Mississippi',29:'Missouri',30:'Montana',
                 31:'Nebraska',32:'Nevada',33:'New Hampshire',34:'New Jersey',35:'New Mexico',
                 36:'New York',37:'North Carolina',38:'North Dakota',39:'Ohio',40:'Oklahoma',
                 41:'Oregon',42:'Pennsylvania',44:'Rhode Island',45:'South Carolina',
                 46:'South Dakota',47:'Tennessee',48:'Texas',49:'Utah',50:'Vermont',51:'Virginia',
                 53:'Washington',54:'West Virginia',55:'Wisconsin',56:'Wyoming'};

var width = 960,
    height = 600;

//store the values we will be using from our imported file in two maps
var wordPercentageById = d3.map();
var followerById = d3.map();

//utilize an albers projection of the United States to display our map
var projection = d3.geo.albersUsa()
    .scale(1280)
    .translate([width / 2, height / 2]);
var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//scale to use in coloring our heatmap
var xScale = d3.scale.linear();

//tooltip
var tip = d3.tip();

//load files in parallel with Queue.js library
queue()
    .defer(d3.json, "./map.json")
    .defer(d3.tsv, "sample.tsv", function(d) { 
      wordPercentageById.set(d.id, +d.wordPercentage); 
      followerById.set(d.id, +d.avgFollowerCount);

      //define our tooltip, which will pop up above each state when the state is moused over
      tip.attr({
            'class': 'd3-tip'
          })    
         .offset([0, 75])     
         .html(function(data){
            return "<span style='color:#66ccff'>" + stateFill[data.id] 
              + "</span><br><span>Percentage of Word Occurrence:</span> <span style='color:white' 'text-align: center'>" 
              + wordPercentageById.get(data.id) 
              + "</span>,<br> <span>Average Follower Count:</span> <span style='color:white'>" 
              + followerById.get(data.id) + "</span>";
          
         });
      svg.call(tip);
    })
    .await(ready);


function ready(error, us) {
  if (error) throw error;

  //find the max of all word percentage values
  var max = wordPercentageById.values().reduce(function(p, v) { return p > v ? p : v; });

  //scale based on word percentage values: if the word never shows up, the state will be colored
  //white -- otherwise, it will darken shades of blue, with max as the darkest
  xScale.range([.8, .2])
        .nice()
        .domain([0, max]);

  //draw the paths for the states, and fill them based on the xScale
  svg.append("g")
     .attr("class", "states")
     .selectAll("path")
     .data(topojson.feature(us, us.objects.states).features)
     .enter().append("path")
     .attr("fill", function(d) {return d3.hsl(200, .5, xScale(wordPercentageById.get(d.id))); })
     .attr("d", path)
     .on('mouseover', tip.show)
     .on('mouseout', tip.hide);
}

d3.select(self.frameElement).style("height", height + "px");
