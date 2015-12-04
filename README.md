# GeoTwit
Geographical visualization of tweets collected using tweepy and pymongo and served using Flask -- utilizing D3.js, TopoJSON, and Queue.js for the graphical aspect.


In order to run, first install MongoDB, and run an instance.

Make sure that MongoDB is listening on the default host (localhost) and port (27017).

Next, run twitter_stream_parser.py to collect tweets. At any point, as long as Mongo is listening, you can open a python shell, from pymongo import MongoClient, and run MongoClient().database.us.count() to see how many tweets are in your database.

Once you are done collecting tweets, you can run mongo_server.py.

Make sure that MongoDB is still listening on the default host and port and that mongo_server is listening on the localhost and port 5000.

Once you have both of these running, you can run the visualization folder as a server (e.g. with python command line tool "python -m SimpleHTTPServer" (2.x) or "python http.server" (3.x) and open up the visualization, at which point you should be able to word frequency in tweets across the United States.
