//load functionality for searching when loading the screen
window.addEventListener("load", function(){
	var searchButton = document.getElementById("searchButton");
	var searchInput = document.getElementById("searchInput");  
	var h2 = document.getElementById("h2");
	
	//allow input into search bar  
	searchInput.addEventListener("keyup", function(event){
		var text = searchInput.value;

		//change the title of the page based on search input
		searchButton.addEventListener("click", function(event){
		   h2.innerHTML = "Results for Tweets Containing the Word '" + text + "'";
		});
	});
});
