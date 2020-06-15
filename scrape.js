const supercrawler = require('supercrawler');
const cheerio = require('cheerio')

const urls = [/* TODO, put urls in this array to start from */];


var crawler = new supercrawler.Crawler({
    interval: 1000,
    concurrentRequestsLimit: 5,
    robotsCacheTime: 3600000,
});

// Get "Sitemaps:" directives from robots.txt
crawler.addHandler(supercrawler.handlers.robotsParser());
// Crawl sitemap files and extract their URLs.
crawler.addHandler(supercrawler.handlers.sitemapsParser());
// Pick up <a href> links from HTML documents
crawler.addHandler("text/html", supercrawler.handlers.htmlLinkParser());

// A function that takes in raw html and spits out the frequency of each 
// tag in a parsable string.
function getLineForHTML(htmlData) {
    var $ = cheerio.load(htmlData);
    elementFreqs = $("*").get().map(ele => ele.name)
                               .reduce((eleFreqs, eleName) => 
                                        eleFreqs.set(eleName, (eleFreqs.get(eleName) || 0) + 1), new Map());
    
    // Generate a parseable line for the tag frequency
    line = "";
    elementFreqs.forEach((value, key) => {
      line += `${key}: ${value}, `;
    });
    
    return line;
}

crawler.addHandler("text/html", function (context) {
    // output the url on one line
    console.log(context.url);
    // then the actual data on the next
    console.log(getLineForHTML(context.body));
});

// Add all the seed urls
var currentUrlList = crawler.getUrlList()

for (url of urls) {
    currentUrlList.insertIfNotExists(new supercrawler.Url(url))
    console.error("adding: " + url);
}

// We need milliseconds from hours for timeout
const hoursRunning = 0.0016;
const minutesRunning = hoursRunning * 60;
const secondsRunning = minutesRunning * 60;

// Let the user know how long it is going to run for
console.error("Running for: " + hoursRunning + " hours");
console.error("             " + minutesRunning + " minutes");
console.error("             " + secondsRunning + " seconds");

// Kick the crawler up
crawler.start();

// Stop the crawler after the alloted time
setTimeout(crawler.stop.bind(crawler), 1000 * secondsRunning);


