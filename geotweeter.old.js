/****************************************/
/********** Fabians Geotweeter **********/
/****************************************/

/** Keeps track of how much of the server stream has already been processed. */
var responseOffset = new Array();

/** Request object containing the Streams. */
var req = new Array();

/** Contains "new" parts of the stream for processing. */
var buffer = new Array();

/** isProcessing is true while parseData is running. */
var isProcessing = new Array();

/** Keeps track of a user and his tweet's id if we're replying to a tweet. */
var reply_to_user = null;
var reply_to_id = null;

/** ID of last "marked as read" tweet. Any tweet with an ID bigger than this is considered new. */
var maxreadid = new Array();

/** IDs of newest and oldest known tweets. */
var maxknownid = new Array();
var minknownid = new Array();
var maxknowndmid = new Array();

/** ID of the newest tweet belonging to "this" user. */
var mylasttweetid = new Array();

/** delay to use the next time the stream gets disconnected. */
var delay;

/** Time the connection to the streaming API was established / got the last data. */
var connectionStartedAt = new Array();
var lastDataReceivedAt = new Array();

/** true, if the streaming connection was terminated because of a timeout. */
var disconnectBecauseOfTimeout = new Array();

/** Keeps track of all tweets being replied to. */
var repliesData = new Array();

/** Gets filled by verify_credentials with the current user's name. */
var this_users_name = new Array();

/** Gets filled with the IDs of all followers. */
var followers_ids = new Array();

/** Collects all possible autocompletion values. */
var autocompletes = new Array();

/** Expected version of settings.js. Gets compared to settings.version by checkSettings(). */
var expected_settings_version = 12;

/** Time of the last press of Enter. Used for double-Enter-recognition. */
var timeOfLastEnter = 0;

/** Text from the textbox before pressing double-enter. Used to remove unwanted newlines. */
var textBeforeEnter = "";

/** Are we sending a DM? Who's the receiver? */
var sending_dm_to = null;

var current_account = null;

/** Lengths of automatically shorted t.co-links */
var short_url_length = null;
var short_url_length_https = null;
var characters_reserved_per_media = null;
var max_media_per_upload = null;
var photo_size_limit = null;

/** If file-field is visible */
var show_file_field = false;

/** Saves the creation-times of the last received tweets. */
var last_event_times = new Array();

/** Used in fillList. */
var temp_responses = new Array();
var threadsRunning = new Array();
var threadsErrored = new Array();

/** Is the infoarea visible? */
var infoarea_visible = false;

/** Used by addUser() and addUser2() */
var oauth_results;

/** Holds all Tweet and TwitterEvent objects */
var tweets = {};
var events = [];

regexp_url = /((https?:\/\/)(([^ :]+(:[^ ]+)?@)?[a-zäüöß0-9]([a-zäöüß0-9i\-]{0,61}[a-zäöüß0-9])?(\.[a-zäöüß0-9]([a-zäöüß0-9\-]{0,61}[a-zäöüß0-9])?){0,32}\.[a-z]{2,5}(\/[^ \"@\n]*[^" \.,;\)@\n])?))/ig;
regexp_user = /(^|\s)@([a-zA-Z0-9_]+)/g;
regexp_hash = /(^|\s)#([\wäöüÄÖÜß]+)/g;
regexp_cache = /(^|\s)(GC[A-Z0-9]+)/g;

/** Checks the settings object for the right version. */
function checkSettings() {
    if (typeof(settings)=="undefined") return false;
    return (settings.version == expected_settings_version);
}



/** Shows a "fullscreen" element with defined title and content. */
function infoarea_show(title, content) {
    $('#infoarea_title').html(title);
    $('#infoarea_content').html(content);
    $('#infoarea').show();
    infoarea_visible = true;
}

/** Closes the infoarea view displayed by infoarea_show() */
function infoarea_close() {
    $('#infoarea').hide();
    infoarea_visible = false;
}

/** Shows the conversation leading to a given tweet. */
function show_replies(id) {
    var html = "";

    // Quelle als erstes anzeigen
    html += $('#id_' + id).fullhtml();

    while (repliesData[id]) {
        id = repliesData[id];
        if($('#id_' + id).length>0) {
            // Tweet ist bekannt -> anzeigen.
            html += $('#id_' + id).fullhtml();
        } else {
            // Unbekannter Tweet -> Spinner anzeigen und Schleife starten...
            html += '<div id="info_spinner"><img src="icons/spinner_big.gif" /></div>';
            fetch_reply(id);
        }
    }
    infoarea_show("Replies", html);
}

/** Fetches replies while the infoarea is visible */
function fetch_reply(id) {
    simple_twitter_request('statuses/show.json', {
        parameters: {id: id, include_entities: true},
        silent: true,
        method: 'GET',
        success: function(foo, data) {
            add_reply_to_infoarea(data);
        }
    });
}

/** Adds reply to the infoarea and fetches the next one */
function add_reply_to_infoarea(data) {
    $('#info_spinner').before(getStatusHTML(data, current_account));
    if (infoarea_visible && data.in_reply_to_status_id) {
        fetch_reply(data.in_reply_to_status_id_str);
    } else {
        $('#info_spinner').remove();
    }
}

/** Shows some stats */
function show_stats() {
    var html = "";
    html += "<strong>Anzahl Tweets:</strong>        " + $('.tweet').length + "<br />";
    html += "<strong>Verbunden seit:</strong>       " + connectionStartedAt[current_account] + "<br />";
    html += "<strong>Bekannte Follower:</strong>    " + followers_ids[current_account].length + "<br />";
    html += "<strong>Buffer-Größe:</strong>         " + responseOffset[current_account] + "<br />";

    html += "<strong>Aktuelle Zeit zwischen Tweets:</strong> " + get_average_tweet_time(current_account)/1000 + " Sekunden<br />";
    html += "<strong>Neustart nach letztem Tweet nach:</strong> " + get_timeout_difference(current_account)/1000 + " Sekunden<br />";
    html += "<strong>Letzter Tweet vor:</strong> " + get_time_since_last_tweet(current_account)/1000 + " Sekunden";

    infoarea_show("Stats", html);
}

/** Checks for blacklisted words. */
function check_blacklist(text){
    for (var i=0; i<settings.blacklist.length; i++)
    {
        if(text.indexOf(settings.blacklist[i]) != -1)
            return true;
    }
    return false;
}

/** Checks for highlighted words. */
function check_highlight(text){
    for (var i=0; i<settings.highlight.length; i++)
    {
        if(text.indexOf(settings.highlight[i]) != -1)
            return true;
    }
    return false;
}

function check_muted(user)
{

    for (var i=0; i<settings.muted.length; i++)
    {
        if(user == settings.muted[i])
            return true;
    }
    return false;
}

function check_troll(text,user)
{
if (settings.troll.length == settings.trigger.length)
{

	for (var i=0; i<settings.troll.length; i++)
		{
			if(user == settings.troll[i]   && (text.indexOf(settings.trigger[i]) != -1))
					return true;
		}
		return false;
}
}

function update_user_counter(account_id) {
    var count = $('#content_' + account_id + ' .tweet.new').not('.by_this_user').length;
    var str = count>0? '('+count+')' : '';
    $('#user_' + account_id + ' .count').html(str);
}

function addUser() {
    infoarea_show("Add User", '<div id="info_spinner"><img src="icons/spinner_big.gif" /></div>');
    var parameters = {
        oauth_callback: "oob"
    }

    var message = {
        action: "https://api.twitter.com/oauth/request_token",
        method: "POST",
        parameters: parameters
    }

    var keys = {
        consumerKey: settings.twitter.consumerKey,
        consumerSecret: settings.twitter.consumerSecret
    }

    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, keys);
    OAuth.SignatureMethod.sign(message, keys);
    var url = 'proxy/oauth/request_token';
    var data = OAuth.formEncode(message.parameters);

    var request = $.ajax({
        url: url,
        data: data,
        dataType: "text",
        async: false,
        type: "POST"
    });
    if (request.status!=200) throw new Exception("o_O");
    var result = request.responseText;
    oauth_results = {};
    result = result.split("&");
    for (var i=0; i<result.length; i++) {
        var parts = result[i].split("=");
        oauth_results[parts[0]] = parts[1];
    }
    
    var url = "https://api.twitter.com/oauth/authorize?oauth_token="+oauth_results.oauth_token+"&force_login=true";
    var html = "Bitte folgendem Link folgen, den Geotweeter authorisieren und dann die angezeigte PIN hier eingeben:<br />";
    html += '<a href="'+url+'" target="_blank">Geotweeter authorisieren</a><br /><br />';
    html += '<input type="text" name="pin" id="pin" />';
    html += '<input type="button" value="OK" onClick="addUser2(); return false;" />';
    $('#info_spinner').before(html);
    $('#info_spinner').hide();
}

function addUser2() {
    var pin = $('#pin').val();
    infoarea_show("Add User", '<div id="info_spinner"><img src="icons/spinner_big.gif" /></div>');
    var parameters = {
        oauth_token: oauth_results.oauth_token,
        oauth_verifier: pin
    }
    var message = {
        action: "https://api.twitter.com/oauth/access_token",
        method: "POST",
        parameters: parameters
    }

    var keys = {
        consumerKey: settings.twitter.consumerKey,
        consumerSecret: settings.twitter.consumerSecret
    }

    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, keys);
    OAuth.SignatureMethod.sign(message, keys);
    var url = 'proxy/oauth/access_token';
    var data = OAuth.formEncode(message.parameters);

    var request = $.ajax({
        url: url,
        data: data,
        dataType: "text",
        async: false,
        type: "POST"
    });
    if (request.status!=200) throw new Exception("o_O");
    var result = request.responseText;
    oauth_results = {};
    result = result.split("&");
    for (var i=0; i<result.length; i++) {
        var parts = result[i].split("=");
        oauth_results[parts[0]] = parts[1];
    }
    var code = "{ // " + oauth_results.screen_name + "\n";
    code += "    token: \"" + oauth_results.oauth_token + "\",\n";
    code += "    tokenSecret: \"" + oauth_results.oauth_token_secret + "\"\n";
    code += "}";
    var html = "Bitte folgenden Code zur settings.js im Bereich twitter.users hinzufügen:<br />";
    html += '<textarea cols="100" rows="4">'+code+'</textarea><br />';
    html += "Anschließend den Geotweeter neuladen, damit die Änderungen aktiv werden.";
    $('#info_spinner').before(html);
    $('#info_spinner').hide();
}

function reload_current_account() {
    if (settings.twitter.users[current_account].stream) {
        req[current_account].abort();
    } else {
        fillList(current_account);
    }
}