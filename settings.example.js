var settings = {
    // Version of this settings-file. Changes every time new options are introduced
    // to settings.js.
    version: 13,

    // Twitter Access Keys
    twitter: {
        consumerKey: "",
        consumerSecret: "",
        users: [
            { // user 1
                token: "",
                tokenSecret: "",
                stream: true
            },
            { // user 2
                token: "",
                tokenSecret: ""
            }
        ]
    },

	fill_list: {
		home_timeline_pages: 2
	},
    
    //Array for blacklisted words (MUST BE LOWER CASE!)
    blacklist: ["test1", "test2"],
    
     //Array for highlighted words (not implemented yet)
    highlight: ["Android"],
	
	 //Array for muted users (MUST BE LOWER CASE!)
    muted: ["troll"],
	
		//Array for muting trolls (not implemented yet)
	troll: ["user1","user2"],
	trigger: ["word_user1_uses","word_user2_uses"],

    // Places. Array of objects containing Name, lat, lon and optionally place_id.
    // Make it an empty array ("places: []") to disable the places feature completely.
    //Values for North and East are positive, values for South and West negative
    places: [
        {name:"sweetSixteen", lat:51.52212,  lon:7.45281,  place_id:"c0ca217810f379fa"}
    ],

    // chars or strings for the automatic insert function
    chars: [
        "™", "☹", "☺", "☠", "☐",
        "☑", "♻", "⚠", "♫", "⋘",
        "⋙", "⍨", "⊙▂⊙", "⨀_⨀", "┌∩┐"
    ],

    tweetSeperator: {
        // this string can be used to automatically split a long text into multiple tweets
        seperator: "<|>",

        // Prefix and Suffix for splitted tweets
        suffix: " »",
        prefix: "« "
    },

    timings: {
        // delays for reconnects (we don't want to hit the server too hard)
        mindelay: 2,
        maxdelay: 160,

        // if there are less than x ms delay between two enter presses, send the tweet
        max_double_enter_time: 150
    },

    // Endpoints to a script used for setting and getting the last read tweet id
    get_maxreadid_url: "maxreadid/get.php",
    set_maxreadid_url: "maxreadid/set.php",

    // show an error if no place is set?
    show_error_if_no_place_is_set: true,

    // unshorten links on mouseover?
    unshorten_links: true,

    // send debug messages to the JS console?
    debug: false,

    // Used to detect "silent" timeouts of the streaming api
    // It calculates the average of the last x tweets and simply reloads the Geotweeter
    // if the last received tweet is more then y times that time ago.
    timeout_detect_tweet_count: 10,
    timeout_detect_factor: 4,
    timeout_minimum_delay: 120,
    timeout_maximum_delay: 600
}

