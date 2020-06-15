const fs = require('fs');
const readline = require('readline');
const htmlTags = require('html-tags');

/**
 * Takes a map and a key and increments the value at that key or initializes it to 1
 *
 * @param {Object.<T, number>} map - The map that has the element to be incremented.
 * @param {T} key - The key that will either be initialized to 1 or incremented.
 */
function incrementKey(map, key) {
  map.set(key, (map.get(key) + 1) || 1);
}

/* Class representing the relationship of a tag to other tags. */
class ElementMetaData {
  /**
   * Initialize a tag.
   * @param {string} tagName - the name of the tag.
   */
  constructor(tagName) {
    // Map from tag name to tag count
    this.name = tagName;
    this.count = 0;
    this.tagAssociations = new Map();
  }

  /**
   * Add an occurance of an other tag appearing in the same html document.
   * @param {string} otherTag - The name of the other tag.
   */
  addAssociation(otherTag) {
    incrementKey(this.tagAssociations, otherTag);
  }

  /**
   * increment the number of occurances for this tag.
   * @param {int} increment - How much to add to the occurances counter.
   */
  addToCount(increment) {
    this.count += increment;
  }

  /**
   * Get the tags that are most related to this tag.
   * @param {Object.<string, ElementMetaData>} tagDatas - The data of other 
   *                                           tags, may contain this tag.
   */
  getMostAssociated(tagDatas, count) {
    var tagFrequencyPairs = [];
    
    tagDatas.forEach((data, tagName) => {
      if (tagName != this.name) {
        if (this.tagAssociations.has(data.name)) {
          // Calculate the relational score for a tag by the number of times 
          // they appear together divided by the square root of the total 
          // number of occurances of the other tag.
          let score = this.tagAssociations.get(data.name) / Math.sqrt(data.count);

          // Append the tag with it's score as a pair of values
          tagFrequencyPairs.push([tagName, score]);
        }
      }
    });

    // sort the tags by their score and get the first `count` number of them
    var arr = tagFrequencyPairs.sort((a, b) => b[1] - a[1]).splice(0, count)
    return arr;
  }
}

/**
 * reads a file filled with tag metadata and returns a graph.
 *
 * @param {string} filename - The map that has the tag metadata.
 */
async function processOutput(filename) {
  // open up the file with the data
  var fileStream = fs.createReadStream(filename);

  // open up the file to be read line by line
  var lineByLine = readline.createInterface({
    input: fileStream,
    clrfDelay: Infinity
  });

  // create a map for the tag data and fill it with a elementMetaData for each tag
  tagData = new Map();
  for (tag of htmlTags) {
    tagData.set(tag, new ElementMetaData(tag));
  }

  // Go through each page data entry
  var x = 0;
  for await (const line of lineByLine) {
    // odd lines only to skip the source lines
    if (x % 2 == 1) {
      // split by a comma to get the tag, occurance count values
      keyValuePairs = line.split(",");
      // for pairs that aren't empty get the tag
      tags = keyValuePairs.filter((pair) => pair.trim().length != 0)
                          .map((pair) => pair.split(":")[0].trim()) 
                          .filter((key) => tagData.has(key));

      for (tag of tags) {
        // Add the occurance of each tag once for each page
        tagData.get(tag).addToCount(1);
        // inform each tag about its relation to the other tags
        for (tagAssociated of tags) {
          if (tagAssociated != tag) {
            tagData.get(tag).addAssociation(tagAssociated);
          }
        }
      }
    }
    x++;
  }

  // Get an object to be output as ready
  output = {nodes: [],
            edges: []};

  // Add each tag relation to the output map
  tagData.forEach((data, key) => {
    targets = tagData.get(key).getMostAssociated(tagData, 2);
    // for this tag, make a node for it
    output["nodes"].push({id: key});

    // for this tag's most important connections add the edges and sort the 
    // source, target names so duplicates can be found easily
    for (connection of targets) {
      if (key.localeCompare(connection[0]) > 0) {
        output["edges"].push({source: key, target: connection[0]});
      } else {
        output["edges"].push({source: connection[0], target: key});
      }
    }
  });

  // Sort the edges source and then target if they have the same source
  output.edges.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target) )

  // Filter out the duplicates
  output.edges = output.edges.filter((edge, index, edges) => {
    // If either the source of target is different then it can pass
    return index == 0 || // let the first one pass too
           edges[index - 1].source != edge.source ||
           edges[index - 1].target != edge.target;
  });

  return output;
}

// read the file named output_data and use it to produce the json network. 
processOutput("output_data").then((answer) => console.log(JSON.stringify(answer, " ", " ")));
