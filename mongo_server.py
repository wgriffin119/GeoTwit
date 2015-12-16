from pymongo import MongoClient
from decimal import *
from flask import Flask, request
from json import JSONEncoder
from json import JSONDecoder
from json import dump
import os
import sys

app = Flask(__name__)

#connect on the default host, which is where we are running MongoDB listener
#make sure that Mongo is listening on port 27017
client = MongoClient()
database = client.db

#word count files
words = client.database.words

#tweets
usTweets = client.database.us

#set the precision of Decimal class
getcontext().prec = 5

#encoder to convert Python dictionary to JSON file
encoder = JSONEncoder()
#decoder to convert JSON file to Python dictionary
decoder = JSONDecoder()

#python dictionary to map state name abbreviations to the number associated with that state in the d3 US map
stateFill = {'AL':1,'AK':2, 'a': 3, 'AZ':4,'AR':5,'CA':6, 'b': 7, 'CO':8,'CT':9,'DE':10,'DC':11,'FL':12,'GA':13,
             'c': 14, 'HI':15,'ID':16,'IL':17,'IN':18,'IA':19,'KS':20,'KY':21,'LA':22,'ME':23,'MD':24,
             'MA':25,'MI':26,'MN':27,'MS':28,'MO':29,'MT':30,'NE':31,'NV':32,'NH':33,'NJ':34,
             'NM':35,'NY':36,'NC':37,'ND':38,'OH':39,'OK':40,'OR':41,'PA':42, 'd': 43, 'RI':44,'SC':45,
             'SD':46,'TN':47,'TX':48,'UT':49,'VT':50,'VA':51, 'e': 52, 'WA':53,'WV':54,'WI':55,'WY':56}

class ParseError(Exception):
    """Exception raised for errors in the parsing or interpreting the input

        expr: input expression in which the error occurred
        msg: explanation of the error
    """

    def __init__(self, expr, msg):
        self.expr = expr
        self.msg = msg


def extractTweets(word, collection):
	'''finding all tweets that contain a specified word'''
	for tweet in collection:
		find = " " + word + " "
		if(find in tweet['tweet']):
			data.append(parseTweet(tweet))

def filterTweets(word):
	""" Filter the tweets that we want to include in our file """
	#to-do: implement robust parser (remove hashtags/punctuation)
	data = []
	#first value stores location for all following data, second stores count of tweets containing word, third stores overall
	#count of all tweets, fourth stores average count of followers, fifth stores percentage of tweets containing word
	for i in range(1, 57):
		data.append([i, 0, 0, 0, 0])

	currentOffset = 0
	lowerWord = word.lower()
	for tweet in usTweets.find({}):
		i = stateFill[tweet['location']]-1
		lowerTweet = tweet['tweet'].lower()
		if lowerWord in lowerTweet:
			data[i][1] += 1
			data[i][2] += tweet['followers']
		data[i][3] += 1


	for i in range(0, len(data)):
		if(data[i][1] == 0):
			data[i][2] = 0
		else:
			data[i][2] /= data[i][1]
		if(data[i][3] == 0):
			data[i][4] = str(0)
		else:
			data[i][4] = str(Decimal(data[i][1]) / Decimal(data[i][3]) * Decimal(100))
		
	return data

def structureDict(properties, data, word):
	""" Structure a dictionary to be passed into the database """
	obj = {}
	obj['word'] = word
	obj['locations'] = []
	for location in data:
		currDict = {}
		for i in range(0, len(properties)):
			currDict[properties[i]] = location[i]
		obj['locations'].append(currDict)
	return obj

def convertToDict(json):
	"""Converts a JSON file back into a python dictionary"""
	newDict = {}
	newDict['word'] = str(json['word'])
	newLocations = []
	for location in json['locations']:
		newLocation = {}
		newLocation['tweetCount'] = location['tweetCount']
		newLocation['wordCount'] = location['wordCount']
		newLocation['location'] = location['location']
		newLocation['wordPercentage'] = str(location['wordPercentage'])
		newLocation['avgFollowerCount'] = location['avgFollowerCount']
		newLocations.append(newLocation)
	newDict['locations'] = newLocations
	return newDict

@app.route('/word', methods=['GET'])
def main():
	""" If we find that the file referring to a given word has already been created
		we simply retrieve it from the database. Otherwise, generate the file """
	word = request.args.get('word')
	callback = request.args.get('callback')
	curr = words.find_one({'word': word})
	if(curr == None):
		tweetData = filterTweets(word)
		properties = ["location", "wordCount", "avgFollowerCount", "tweetCount", "wordPercentage"]
		jsonDict = structureDict(properties, tweetData, word)
		words.insert_one(jsonDict)
		jsonDict.pop("_id", None)
		jsonDict['word'] = str(jsonDict['word'])
		return '{0}({1})'.format(callback, jsonDict)
	else:
		curr.pop("_id", None)
		return '{0}({1})'.format(callback, convertToDict(curr))


if __name__ == '__main__':
	app.run()
