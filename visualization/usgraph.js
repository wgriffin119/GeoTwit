//heatmap visualization, to be used dynamically with tweets we have stored in Mongo.
//Displays the choropleth US map filled in with the frequency of a specified word's occurence
//in tweets for each state on the map. 

//mapping of state indices in our map.JSON file to full state names
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

//store the values we will be using from our imported file into four maps
var wordPercentageById = d3.map();
var followerById = d3.map();
var wordCountById = d3.map();
var tweetCountById = d3.map();

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

//load files in parallel with Queue.js library -- used for
//.json files rather than entries in Mongo
var draw = function() {
  queue()
    .defer(function(url, callback) {
      d3.json(url, function(error, result) {
        console.log("map ready");
        callback(error, result);
      });
    }, "./map.json")
    .defer(function(url, callback) {
      d3.json(url, function(error, d) {
        console.log("data ready");
        d.locations.forEach(function(curr) {
          wordPercentageById.set(curr.location, +curr.wordPercentage); 
          followerById.set(curr.location, +curr.avgFollowerCount);
          wordCountById.set(curr.location, +curr.wordCount);
          tweetCountById.set(curr.location, +curr.tweetCount);
          tip.attr({
                'class': 'd3-tip'
              })    
             .offset(getOffset())     
             .html(function(data){
                return "<span style='color:#66ccff'>" + stateFill[data.id] 
                  + "</span><br><span>Percentage of Word Occurrence:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
                  + wordPercentageById.get(data.id) 
                  + "</span>,<br><span>Total Number of Tweets:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
                  + tweetCountById.get(data.id) 
                  + "</span>,<br><span>Total Number of Tweets Containing Word:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
                  + wordCountById.get(data.id) 
                  + "</span>,<br><span>Average Follower Count:</span> <span style='color:#A9E2F3'>" 
                  + followerById.get(data.id) + "</span>";
             });
          svg.call(tip);
        })
        callback(error, d);
      });
    }, './syria.json')
    .await(ready);
};


var redraw = function() {
  //draws the US map using the map.json file
  queue()
    .defer(function(url, callback) {
      d3.json(url, function(error, result) {
        console.log("map ready");
        callback(error, result);
      });
    }, "./map.json") //the json for the US map
    .await(ready);
};


var fillData = function(json) {
  //fills in the d3 map with the json file generated for the searched word
  json.locations.forEach(function(curr) {
    wordPercentageById.set(curr.location, +curr.wordPercentage); 
    followerById.set(curr.location, +curr.avgFollowerCount);
    wordCountById.set(curr.location, +curr.wordCount);
    tweetCountById.set(curr.location, +curr.tweetCount);
    tip.attr({
      'class': 'd3-tip'
    })  
    //the tip offset can change based on the browser  
    .offset(getOffset())     
    .html(function(data){
      //displaying the info for the pop up when mousing over a state
      return "<span style='color:#66ccff'>" + stateFill[data.id] 
        + "</span><br><span>Percentage of Word Occurrence:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
        + wordPercentageById.get(data.id) 
        + "</span>,<br><span>Total Number of Tweets:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
        + tweetCountById.get(data.id) 
        + "</span>,<br><span>Total Number of Tweets Containing Word:</span> <span style='color:#A9E2F3' 'text-align: center'>" 
        + wordCountById.get(data.id) 
        + "</span>,<br><span>Average Follower Count:</span> <span style='color:#A9E2F3'>" 
        + followerById.get(data.id) + "</span>";
    });
    svg.call(tip);
  })
};


function getOffset() {
  //if chrome or ff, no offset -- otherwise, need offset
  return [0,0];
}


function getJSON(word) {
  //Using a jquery ajax request to fetch data being served by the python web server
  //If it has been fetched correctly, the html on the webpage is updated with the 
  //searched word and the map is drawn using this data. 
  $.ajax({
    dataType: 'jsonp',
    //ensure that python script "mongo_server.py" is running and listening on port 5000
    url: "http://0.0.0.0:5000/word",
    data: {'word': word},
    async: false,
    success: function(obj) {  
  	  var h2 = document.getElementById("h2");
      h2.innerHTML = "Results for Tweets Containing the Word '<b>" + word + "</b>'";
      console.log(obj);
      fillData(obj);
      redraw();
      return obj;
    },
    error: function(err) {
      console.log(err);
    },
    complete: function(xhr, status) {
      console.log('request complete, status: ' + status);
    }
  });
}


function ready(error, us) {   
  //Once we have fetched all of the JSON files, we call the ready function
  //when we are ready to draw the US map.
  console.log("ready");
  if (error) console.log(error);

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
     .attr("fill", function(d) {
        curr = wordPercentageById.get(d.id);
        if(curr == 0) {
          //if wordPercentage = 0, the state should be colored white
          return d3.hsl("#ffffff"); 
        } else {
          return d3.hsl(200, .5, xScale(wordPercentageById.get(d.id))); 
        }
      })
     .attr("d", path)
     //showing the stats for a certain state when mousing over that state
     .on('mouseover', tip.show)
     .on('mouseout', tip.hide);


}

function submit(word) {
	//Changes the webpage HTML to display a waiting message while results 
	//are being fetched for a word not previously searched.
  	document.getElementById("h2").innerHTML = "Fetching results...";
    getJSON(word.toLowerCase());
};

d3.select(self.frameElement).style("height", height + "px");

//load functionality for searching when loading the screen
window.addEventListener("load", function(){
  var searchButton = document.getElementById("searchButton");
  var searchInput = document.getElementById("searchInput");
  var text = "";
  //Event listener to keep track of input into search bar  
  //text is the searched word
  searchInput.addEventListener("input", function(event){
    text = searchInput.value;
  });

  //Event listener load the graph when the search button is clicked
  searchButton.addEventListener("click", function(event){
  	  submit(text);
  });

  //event listener to load the graph when the enter button is pressed
  $("#custom-search-form").submit(function() {
    submit(text);
    return false;
  });
});
