# tag-indexer
## About
tag-indexer is a Node.js program that scrapes websites and records each pages tag usage and generates a network diagram description from this.

It has two parts a scrapper and a masher.  
The scrapper takes is the part that goes out and gets the raw data.  
The masher is the part that takes the data and produces the JSON network graph description.

It also includes an html page that can be used to display this graph.

## Usage
setup:  
`npm install`  
1. Collect the data
   1. Put the starting urls in the scraper.js file where the TODO is located.
   2. set the required run time at the bottom of the file.
   3. run `npm run scrap`
2. Mash the data  
   run `npm run mash`  
   
After this there should be a file called `output.json` that contains the data for the graph. You may then use this data for other purposes or put it into  the index.html file to view it as a network diagram

