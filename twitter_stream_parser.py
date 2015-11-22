#parser to extract tweets from twitter stream that are sent in the United States
#and then store the information that we desire in MongoDB

from __future__ import absolute_import, print_function
from tweepy.streaming import StreamListener
from tweepy import OAuthHandler
from tweepy import Stream
from pymongo import MongoClient
from json import JSONDecoder

#mapping of state names to abbreviations -- cleaning data
stateAbbreviationMap = {'Alaska':'AK','Alabama':'AL','Arkansas':'AR','Arizona':'AZ','California':'CA','Colorado':'CO',
		'Connecticut':'CT','District of Columbia':'DC','Delaware':'DE','Florida':'FL','Georgia':'GA','Hawaii':'HI',
		'Iowa':'IA','Idaho':'ID','Illinois':'IL','Indiana':'IN','Kansas':'KS','Kentucky':'KY','Louisiana':'LA',
		'Massachusetts':'MA','Maryland':'MD','Maine':'ME','Michigan':'MI','Minnesota':'MN','Missouri':'MO',
		'Mississippi':'MS','Montana':'MT','North Carolina':'NC','North Dakota':'ND','Nebraska':'NE','New Hampshire':'NH',
		'New Jersey':'NJ','New Mexico':'NM','Nevada':'NV','New York':'NY','Ohio':'OH','Oklahoma':'OK','Oregon':'OR',
		'Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX',
		'Utah':'UT','Virginia':'VA','Vermont':'VT','Washington':'WA','Wisconsin':'WI','West Virginia':'WV','Wyoming':'WY'
}

#our consumer key and secret for our application to receive tweets from the public stream
#these will not actually be used for anything except to listen for tweets
consumer_key="ldtUZH7082RW6nZKkTILmC3p7"
consumer_secret="vd0hjyt7BX9fFZQ1ShmNkaS6lk55kTs0RbapV7reEjbGSmnrUf"

access_token="870183469-83KQSCFJF16C6i3dEhRWBW63WKXhahU5SLoOQ7TM"
access_token_secret="Z60oe2vJvUTk30EUApwewW61fB4eV5PGQ05Nllys2GcQT"

#connect on the default host, which is where we are running MongoDB listener
client = MongoClient()
database = client.db
us = client.database.us

#decoder to convert JSON file to Python dictionary
decoder = JSONDecoder()

class StandardOutputListener(StreamListener):
	""" The listener handles tweets are the received from the stream. This listener
    	interprets the data and stores the aspects we want in a MongoDB database """
	
	def on_data(self, data):
		dictData = decoder.decode(data)
		#if the location is not in the US (because of the nature of a bounding box, 
		#occasionally we will get tweets in Canada) or if the user has no location, then return
		if(dictData.get('place', None) is None):
			return True
		if(dictData['place']['country_code'] != 'US'):
			return True
		newDict = recreateDictionary(dictData)
		if(newDict.get('location', None) is not None):
			location = newDict['location']
			print(location)
			data_id = us.insert_one(newDict).inserted_id
			print(data_id)
			return True

def recreateDictionary(oldDict):
	""" Given a dictionary, extract the fields we want to keep for analysis:
			tweet: the text of the tweet
			followers: the number of followers of the user who tweeted
			location: the abbreviation of the name of the state that is the
					  user's location
			coordinates: a bounding box for the actual location at which
						 the tweet was sent -- if user has geo-tracking on"""
	newDict = {}
	newDict['tweet'] = oldDict['text']
	newDict['followers'] = oldDict['user']['followers_count']
	#if the place_type is admin, its structure is "State Name, USA"
	if(oldDict['place']['place_type'] == 'admin'):
		#split out the statename
		stateName = oldDict['place']['full_name'].split(',')[0]
		#there are a few (~1/50000) cases when a state name does not match
		#e.g. "Nueva York, USA"
		if(stateAbbreviationMap.get(stateName, None) is not None):
			#look up the name of the state in our mapping of abbreviations
			newDict['location'] = stateAbbreviationMap[stateName]
	#if the place_type is city, its structure is "City Name, StateAbbreviation"
	elif(oldDict['place']['place_type'] == 'city'):
		#split out the state abbreviation
		newDict['location'] = oldDict['place']['full_name'].split(', ')[1]
	newDict['coordinates'] = oldDict['place']['bounding_box']
	return newDict

def getStream(locationArr):
	""" Get a stream of tweets being tweeted at a given location (by coordinates, represented 
	as a 4-item array) """
	l = StandardOutputListener()
	auth = OAuthHandler(consumer_key, consumer_secret)
	auth.set_access_token(access_token, access_token_secret)

	stream = Stream(auth, l)
	stream.filter(locations=locationArr)

if __name__ == '__main__':
	#first 4 bound continental US, second 4 bound alaska, third 4 bound hawaii
    #usCoords = [-125, 24, -67, 50]
    usCoords = [-125, 24, -67, 50, -173, 51, -130, 71, -160, 18, -154, 22]
    getStream(usCoords)
