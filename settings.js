var accessor = {
    token: "15006408-BtuU3rI0K0FGI8cnIpa5YYZHNpSNWDJScCD9x4Gdn",
    tokenSecret: "9j5hKhm8J5ewdGOkQDyCgxj526mKZWnN0XY7hwDpDk",
    consumerKey: "mjVYJfHrlqzKOXdLKEMXA",
    consumerSecret: "kU0tDiwAZkehi03wHHHp9B7EZI7fnxV0eawLVSmw"
}

var places = [
    {name:"--leer--",     lat:0.0000000, lon:0.000000},
    {name:"Zu Hause",     lat:51.446646, lon:7.646494, place_id:"c2a82d0b6fbcde87"}, // "Letteweg"
    {name:"Papi",         lat:51.520870, lon:8.532433, place_id:"12b809c9f5071d62"}, // "Siddinghausen, Büren, Paderborn"
    {name:"Arbeit",       lat:51.483685, lon:7.411289, place_id:"d423ae4220494dff"}, // "GB5, Uni..."
    {name:"GB5 R.334",    lat:51.483721, lon:7.410863, place_id:"d423ae4220494dff"}, // "GB5, Uni..."
    {name:"OH 14",        lat:51.489777, lon:7.406346, place_id:"ad78499b8383b454"}, // "OH14"
    {name:"UFC",          lat:51.484404, lon:7.416725, place_id:"564a7c397c5583ff"}, // "Pav. 4"
    {name:"sweetSixteen", lat:51.52212,  lon:7.45281,  place_id:"c0ca217810f379fa"}, // "sweetSixteen"
];

var chars = new Array("™", "☹", "☺", "☠", "☐", "☑", "♻", "⚠", "♫", "⋘", "⋙", "⍨", "⊙▂⊙", "⨀_⨀", "┌∩┐");
var tweetSeperator = "<|>";
var tweetSeperatorPrefix = "« ";
var tweetSeperatorSuffix = " »";

var delay = 2;
var mindelay = 2;
var maxPages = 2;
var maxdelay = 160;
