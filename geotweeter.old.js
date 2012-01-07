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


$(document).ready(start);

/** Gets run as soon as the page finishes loading. Initializes Variables, sets timers, starts requests. */
function start() {
    // check the credentials and exit if not okay.
    validateCredentials();
    get_twitter_configuration();
    if (!this_users_name) return;

    for (var i=0; i<settings.twitter.users.length; i++){
        getFollowers(i);
    }

    maxreadid = getMaxReadID();
    for(var i=0; i<settings.twitter.users.length; i++){
        if (!maxreadid[i]) maxreadid[i]="0";
        last_event_times[i]=new Array();
        responseOffset[i] = 0;
        buffer[i] = "";
        isProcessing[i] = false;
        fillList(i); // after fillList completed, it will automatically start startRequest to start listening to the stream
        if (settings.twitter.users[i].stream) {
            window.setInterval("checkForTimeout(" + i + ")", 30000);
            if (window.opera) window.setInterval("parseResponse(" + i + ")", 5000);
        } else {
            window.setInterval("fillList(" + i + ")", 300000);
        }
    }

    updateCounter();
    update_form_display();

    $(document).bind('keydown', 'Alt+s', sendTweet);
    $('#text').bind('keydown', 'return', checkEnter);

    $('#text').autocomplete({
        minLength: 1,
        source: function(request, response) {
            var word = extractLast(request.term);
            if (request.term.match(/^d @?[a-z0-9_]+$/i)) word='@'+word;
            if (word[0]!="@" && word[0]!="#") response(new Array());
            else response($.ui.autocomplete.filter(autocompletes, word));
        },
        focus: function() { return false; },
        autoFocus: true,
        delay: 0,
        appendTo: "#autocomplete_area",
        select: function(event, ui) {
            var term = this.value.split(/\s+/).pop();
            this.value = this.value.substring(0, this.value.length-term.length) + ui.item.value + " ";
            return false;
        }
    });

    
}

/** Checks the selected file for compatibility with twitter. That is
 *  *) The size is less or equal to photo_size_limit (determined by get_twitter_configuration at startup)
 *  *) The file type is acceptable (list according to twitter docs)
 */
function check_file() {
    var file = $('#file')[0].files[0];
    var error = false;
    if (file && file.fileSize>photo_size_limit) {
        alert("Die Datei ist zu groß.\n\nDateigröße:\t" + file.fileSize + " Bytes\nMaximum:\t" + photo_size_limit + " Bytes");
        error = true;
    }
    if (file && $.inArray(file.type, ["image/png", "image/gif", "image/jpeg"])==-1) {
        alert("Der Dateityp " + file.type + " wird von Twitter nicht akzeptiert.");
        error = true;
    }
    if (error) $('#file').val('');
}

/** Returns the last word of the given string. Used by autocompletion. */
function extractLast(term) {
    return term.split(/\s+/).pop();
}

/** Checks the settings object for the right version. */
function checkSettings() {
    if (typeof(settings)=="undefined") return false;
    return (settings.version == expected_settings_version);
}

/** Changes the currently used account to the one specified. */
function change_account(to_id) {
    $('.content').hide();
    $('#content_' + to_id).show();
    $('#users .user').removeClass('active');
    $('#user_' + to_id).addClass('active');
    current_account = to_id;
}

/**
 * Checks if a timeout in the stream occured. Gets run via timer every 30 Seconds.
 * The stream should at least send a newline every 30 seconds.
 * If this doesn't happen we assume the connection timed out and force it to be re-established.
 *
 * This code also checks for long pauses within the stream and restarts the geotweeter if necessary.
 */
function checkForTimeout(account_id) {
    var jetzt = new Date();
    if (lastDataReceivedAt[account_id] && jetzt.getTime() - lastDataReceivedAt[account_id].getTime() > 30000) {
        log_message("checkForTimeout", "Timeout: No data received for the last " + (jetzt.getTime() - lastDataReceivedAt[account_id].getTime())/1000 + "seconds");
        disconnectBecauseOfTimeout[account_id] = true;
        req[account_id].abort();
        return;
    }
    if (get_time_since_last_tweet(account_id) > get_timeout_difference(account_id) && $('#text').val()=='') {
        log_message("checkForTimeout", "Timeout: Lack of tweets");
        log_message("checkForTimeout", "Average Time between tweets: " + get_average_tweet_time(account_id)/1000);
        log_message("checkForTimeout", "Timeout after: " + get_timeout_difference(account_id)/1000);
        log_message("checkForTimeout", "Time since last tweet: " + get_time_since_last_tweet(account_id)/1000);
        disconnectBecauseOfTimeout[account_id] = true;
        req[account_id].abort();
    }
}

/**
 * Returns the max allowed time between two tweets in seconds. Used to reconnect if
 * the stream didn't send tweets in the last time.
 */
function get_timeout_difference(account_id) {
    var delay = get_average_tweet_time(account_id)*settings.timeout_detect_factor;
    if (settings.timeout_minimum_delay*1000 > delay) return settings.timeout_minimum_delay*1000;
    if (settings.timeout_maximum_delay*1000 < delay) return settings.timeout_maximum_delay*1000;
    return delay;
}

/**
 * Returns the average time between the last x tweets.
 **/
function get_average_tweet_time(account_id) {
    if (last_event_times[account_id].length<2) return NaN;
    return (last_event_times[account_id][0] - last_event_times[account_id][last_event_times[account_id].length-1]) / (last_event_times[account_id].length-1);
}

/**
 * Returns the time since the last received tweet in milliseconds.
 */
function get_time_since_last_tweet(account_id) {
    return (Date.now() - last_event_times[account_id][0]);
}
/** Creates html for a normal tweet, RT or DM. */
function getStatusHTML(status, account_id) {
    // Check if we are working on a DM. If yes, modify the structure to be more tweet-like.
    isDM = false;
    if (status.direct_message) {
        isDM = true;
        status = status.direct_message;
    }
    if (status.recipient) {
        isDM = true;
    }
    
    // Preparations: Replace the (too large for JS) numeric IDs with the string-based IDs
    if (status.id_str)
        status.id = status.id_str;
    if (status.in_reply_to_status_id_str)
        status.in_reply_to_status_id = status.in_reply_to_status_id_str;
    
    
    if (!isDM && status.in_reply_to_status_id) {
        repliesData[status.id] = status.in_reply_to_status_id;
    }
    
    // Prepares variable with text for several checks
    var temp_text = "";
    if (status.retweeted_status) {
        temp_text += linkify(status.retweeted_status.text, status.retweeted_status.entities);
    } else {
        temp_text += linkify(status.text, status.entities);
    }
    
    var html = "";
    var user;
    var user_object;
    if (status.retweeted_status)
        user_object = status.retweeted_status.user;
    else if (isDM)
        if (status.sender.screen_name == this_users_name[account_id]) {
            user_object = status.recipient;
            user_object.is_receiver = true;
        } else {
            user_object = status.sender;
        }
    else
        user_object = status.user;
	   
    user = user_object.screen_name;
	
	    // Check if tweet user is muted
     if(check_muted(user))
          return ""; 
	
	
    addToAutoCompletion("@" + user);

    if (!isDM && biggerThan(status.id, maxknownid[account_id]))
        maxknownid[account_id] = status.id;
    if (!isDM && (minknownid[account_id]==0 || biggerThan(minknownid[account_id], status.id)))
        minknownid[account_id] = status.id;

    if(isDM && biggerThan(status.id, maxknowndmid[account_id]))
        maxknowndmid[account_id] = status.id;

    if (!isDM && user==this_users_name[account_id] && biggerThan(status.id, mylasttweetid[account_id]))
        mylasttweetid[account_id] = status.id;

    var date = new Date(status.created_at);
    if (typeof last_event_times[account_id] != "object") last_event_times[account_id]=new Array();
    if (last_event_times[account_id].length==0 || date > last_event_times[account_id][0]) {
        last_event_times[account_id].unshift(date);
    } else if (date < last_event_times[account_id][last_event_times[account_id].length-1]) {
        last_event_times[account_id].push(date);
    }
    if (last_event_times[account_id].length > (settings.timeout_detect_tweet_count+1)) last_event_times[account_id].pop();
    var datum = addnull(date.getDate()) + '.' + addnull(date.getMonth()+1) + '.' + (date.getYear()+1900) + ' ' + addnull(date.getHours()) + ':' + addnull(date.getMinutes());
    html += '<div class="...SNIP..." ';
    html += 'id="id_' + status.id + '" ';
    html += 'data-sender="' + user_object.screen_name + '" ';
    var mentions = "";
    if (status.entities) for (var i in status.entities.user_mentions) {
        var mention = status.entities.user_mentions[i].screen_name;
        if (mention == this_users_name[account_id]) continue;
        mentions += mention + " ";
    }
    html += 'data-mentions="' + mentions.trim() + '" ';
    html += 'data-id="' + status.id + '" ';
    html += '>';
    html += '<a name="status_' + status.id + '"></a>';
    
    
    
    if (thumbs.length==1) {
       html += '<a href="'+thumbs[0].link+'" target="_blank"><img src="'+thumbs[0].thumbnail+'" class="media" style="float: right;"/></a>';
    }
    

    
    if (thumbs.length>1) {
        html += '<div class="media">';
       for (var i=0; i<thumbs.length; i++) {
           html += '<a href="'+thumbs[i].link+'" target="_blank"><img src="'+thumbs[i].thumbnail+'" /></a>';
       }
       html += '</div>';
    }
        
        
        
            

    html += '<div class="links">';
    if (isDM) {
        html += '<a href="#" onClick="replyToTweet(\'' + status.id + '\', \'' + user + '\', true); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    } else {
        var recipient = user;
        if (user==this_users_name[account_id] && status.entities.user_mentions && status.entities.user_mentions.length>0) {
            recipient = status.entities.user_mentions[0].screen_name;
        }
        html += '<a href="#" onClick="replyToTweet(\'' + status.id + '\', \'' + recipient + '\'); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    }
    if (!isDM)
        html += '<a href="#" onClick="retweet(\'' + status.id + '\'); return false;"><img src="icons/arrow_rotate_clockwise.png" title="Retweet" /></a>';
    if (!isDM)
        html += '<a href="#" onClick="quote(\'' + status.id + '\', \'' + user + '\', \'' + escape(status.text) + '\'); return false;"><img src="icons/tag.png" title="Quote" /></a>';
    html += '<a href="http://translate.google.de/#auto|de|' + escape(status.text.split('"').join('').split('@').join('')) + '" target="_blank"><img src="icons/transmit.png" title="Translate" /></a>';
    html += '<a href="http://twitter.com/#!/' + user + '/status/' + status.id + '" target="_blank"><img src="icons/link.png" title="Permalink" /></a>';
    if (status.coordinates) {
        html += '<a href="http://maps.google.com/?q=' + status.coordinates.coordinates[1] + ',' + status.coordinates.coordinates[0] + '" target="_blank"><img src="icons/world.png" title="Geotag" /></a>';
        html += '<a href="http://maps.google.com/?q=http%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fuser_timeline%2F' + user + '.atom%3Fcount%3D250" target="_blank"><img src="icons/world_add.png" title="All Geotags" /></a>';
    }
    if ( user==this_users_name[account_id]) {
        html += '<a href="#" onClick="delete_tweet(\'' + status.id + '\'); return false;"><img src="icons/cross.png" title="Delete Tweet" /></a>';
    } else {
        html += '<a href="#" onClick="report_spam(\'' + user + '\'); return false;"><img src="icons/exclamation.png" title="Block and report as spam" /></a>';
    }

    html += '</div>'; // Links
    html += '</div>'; // overlay
    html += '<div style="clear: both;"></div>';
    html += '</div>'; // tweet

    return html;
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
/** "Cancel" sending a DM - Reverts the DM to a normal Tweet */
function cancel_dm() {
    $('#text').val('@' + sending_dm_to + ' ' + $('#text').val());
    sending_dm_to = null;
    updateCounter();
    update_form_display();
}

/**
 * Gets called if the user removed a mention and klicked the link in the appearing warning message.
 * Especially removes the in_reply_to_id value.
 */
function removeReplyWarning() {
    $('#reply_to_id').val('');
    $('#reply_warning').fadeOut();
    reply_to_user = null;
    reply_to_id = null;
}

/** Gets the max read ID from the server. */
function getMaxReadID() {
    value = $.ajax({
        method: 'GET',
        url: settings.get_maxreadid_url || 'maxreadid/get.php',
        async: false,
        dataType: 'text'
    }).responseText;
    log_message("getMaxReadID", "result: " + value);
    
    return $.parseJSON(value);
}

/** Sets the max read ID on the server. */
function setMaxReadID(id, account_id) {
    $.ajax({
        method: 'GET',
        url: settings.set_maxreadid_url || 'maxreadid/set.php',
        async: false,
        dataType: 'text',
        data: {id: id, account_id: account_id},
        error: function(req) {
            var html = '<div class="status"><b>Fehler in setMaxReadID():</b><br />';
            html += 'Error ' + req.status + ' (' + req.responseText + ')';
            html += '</div>';
            addHTML(html);
        }
    });
}

/** Sets the max read ID by using setmaxReadID and marks all tweets as read. */
function markAllRead() {
    // get the id of the first visible tweet
    var elms = $('#content_'+current_account+' .tweet.new');
    var id = null;
    var offset = $(document).scrollTop() + $('#top').height();
    for (var i=0; i<elms.length; i++) {
        if ($(elms[i]).offset().top >= offset) {
            id = $(elms[i]).attr('data-id');
            break;
        }
    }
    log_message('markAllAsRead', 'Gefundene ID: '+id);
    if (id && biggerThan(id,maxreadid[current_account])) {
        log_message('markAllRead', 'Updating.');
        setMaxReadID(id, current_account);
        maxreadid[current_account] = id;
        var elm = $('.new');
        for(var i=0; i<elm.length; i++) {
            if (!biggerThan($(elm[i]).attr('data-id'), id)) {
                $(elm[i]).removeClass('new');
            }
        }
    }
    update_user_counter(current_account);
}

/** Scrolls to the last tweet written by the current user. */
function goToMyLastTweet() {
    if (mylasttweetid[current_account] > 0)
        scroll_to(mylasttweetid[current_account]);
}

/** Scrolls to a tweet specified by it's id. */
function scroll_to(tweet_id) {
    var element_top = $('#id_'+tweet_id).offset().top;
    // Just scrolling to a tweet doesn't show it because it will be hidden behind
    // the form on the top. So we use this as an offset.
    var topheight = parseInt($('#content_template').css("padding-top"));
    $(document).scrollTop(element_top-topheight);
    return;
}

/** Sets a status message. The colors are actually class names. */
function setStatus(message, color, account_id) {
    $('#user_'+account_id).removeClass('red green yellow orange').addClass(color);
    $('#user_'+account_id).data('status', message);
}

/** Scrolls down to the last read tweet. */
function goToLastRead(){
    scroll_to(maxreadid[current_account]);
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

/** Adds a term to the list of usable autocompletions. */
function addToAutoCompletion(term) {
    if ($.inArray(term, autocompletes)==-1) {
        autocompletes.push(term);
        autocompletes.sort();
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