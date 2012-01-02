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


/** Asynchronously gets the IDs of all followers of the current user. */
function getFollowers(account_id) {
    simple_twitter_request('followers/ids.json', {
        silent: true,
        method: "GET",
        account: account_id,
        success: function(element, data) {
            followers_ids[account_id] = data.ids;
        }
    });
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

/**
 * Requests all tweets for the timeline (non-streaming).
 * If this is the first call since start of the geotweeter, as many tweets as possible are requested.
 * Otherwise it gets called after a disconnect. Then only missed tweets are fetched.
 *
 * Queries the home_timeline and then mentions, since home_timeline doesn't contain mentions from
 * people you don't follow.
 */
function fillList(account_id) {
    log_message("fillList", "Starting");
    setStatus("Filling List...", "orange", account_id);
    
    threadsRunning[account_id] = 5;
    threadsErrored[account_id] = 0;
    temp_responses[account_id] = new Array();
    
    var after_run = function(account_id) {
        if (threadsErrored[account_id]==0) {
            // everything was successfull. Great.
            startRequest(account_id);
        } else {
            // oops... trigger the restart mechanism
            var html = '<div class="status">Retrying in 30 seconds...</div>';
            addHTML(html, account_id);
            window.setTimeout('fillList(' + account_id + ')', 30000);
        }
        update_user_counter(account_id);
        setStatus("", null, account_id);
    }
    
    var success = function(element, data, req, additional_info) {
        temp_responses[additional_info.account_id].push(data);
        threadsRunning[additional_info.account_id]-=1;
        if (threadsRunning[additional_info.account_id]==0) {
            after_run(additional_info.account_id);
        }
    }
    
    var error = function(info_element, data, request, raw_response, exception, additional_info) {
        threadsRunning[additional_info.account_id]-=1;
        threadsErrored[additional_info.account_id]+=1;
        var html = '<div class="status"><b>Fehler in ' + additional_info.name + ":</b><br />";
        if (data && data.error) {
            html += data.error;
        } else {
            html += 'Error ' + request.status + ' (' + exception + ')';
        }
        html += "</div>";
        addHTML(html, account_id);
        if (threadsRunning[additional_info.account_id]==0) {
            after_run(additional_info.account_id);
        }
    }

    var parameters = {include_rts: true, count: 200, include_entities: true, page: 1};
    if (maxknownid[account_id] && maxknownid[account_id]!="0") parameters.since_id = maxknownid[account_id];
    
    log_message("fillList", "since_id: "+parameters.since_id, account_id);

    log_message("fillList", "home_timeline 1...", account_id);
    simple_twitter_request('statuses/home_timeline.json', {
        method: "GET",
        parameters: parameters,
        async: true,
        silent: true,
        dataType: "text",
        account: account_id,
        additional_info: {name: 'home_timeline 1', account_id: account_id},
        success: success,
        error: error
    });
    
    log_message("fillList", "mentions...");
    var returned_mentions = simple_twitter_request('statuses/mentions.json', {
        method: "GET",
        parameters: parameters,
        async: true,
        silent: true,
        dataType: "text",
        account: account_id,
        additional_info: {name: 'mentions', account_id: account_id},
        success: success,
        error: error
    });

    parameters.page = 2;
    log_message("fillList", "home_timeline 2...");
    var returned_2 = simple_twitter_request('statuses/home_timeline.json', {
        method: "GET",
        parameters: parameters,
        async: true,
        silent: true,
        dataType: "text",
        account: account_id,
        additional_info: {name: 'home_timeline 2', account_id: account_id},
        success: success,
        error: error
    });
    
    var parameters = {count: 100};
    if (maxknowndmid[account_id] && maxknowndmid[account_id]!="0") parameters.since_id = maxknowndmid[account_id];
    log_message("fillList", "DMs...");
    var received_dms = simple_twitter_request('direct_messages.json', {
        method: "GET",
        parameters: parameters,
        async: true,
        silent: true,
        dataType: "text",
        account: account_id,
        additional_info: {name: 'received dms', account_id: account_id},
        success: success,
        error: error
    });

    log_message("fillList", "Sent DMs...");
    var sent_dms = simple_twitter_request('direct_messages/sent.json', {
        method: "GET",
        parameters: parameters,
        async: true,
        silent: true,
        dataType: "text",
        account: account_id,
        additional_info: {name: 'sent dms', account_id: account_id},
        success: success,
        error: error
    });
}



/**
 * Takes a single Twitter event and gets it's HTML code.
 * Optionally, the code is returned instead of adding it to the DOM.
 */
function display_event(element, return_html, account_id) {
    var html = "";

    if (element==null)
        return ""; // Fix for NULLs in stream

    if (element.text) {
        html = getStatusHTML(element, account_id);
		new Tweet(element);
    } else if (element.friends) {
        twitter_friends = element.friends;
    } else if ("delete" in element) {
        // Deletion-Request. Do nothing ,-)
    } else if (element.direct_message) {
        html = getStatusHTML(element, account_id);
    } else if (element.event && element.event=="follow") {
        html = getFollowEventHTML(element, account_id);
    } else if (element.event && element.event=="favorite") {
        html = getFavoriteEventHTML(element, account_id);
    } else if (element.event && element.event=="list_member_added") {
        html = getListMemberAddedEventHTML(element, account_id);
    } else if (element.event && element.event=="list_member_removed") {
        html = getListMemberRemovedEventHTML(element, account_id);
    } else if (element.event && element.event=="block") {
        // You blocked someone. Do nothing.
    } else if (element.event && element.event=="user_update") {
        // You changed your profile settings on twitter.com. Do nothing.
    } else if (element.event && element.event=="unfavorite") {
        // You unfavorited a tweet. Do nothing.
    } else {
        html = '<hr />Unbekanntes Element:<br />' + element.toString();
    }

    if (return_html) {
        return html;
    }
    addHTML(html, account_id);
}



/** Adds an event with custom text to the DOM. */
function getEventHTML(event, text) {
    var html = "";
    html += '<div class="status">';
    html += '<span class="avatar">';
    html += '<a href="http://twitter.com/account/profile_image/' + event.source.screen_name + '" target="_blank"><img class="user_avatar" src="' + event.source.profile_image_url + '" /></a>';
    html += '</span>';
    html += text;
    html += '</div>';
    return html;
}

/** Creates html for a new follower-event and adds it to the DOM via addEvent(). */
function getFollowEventHTML(event, account_id) {
    if (event.source.screen_name==this_users_name[account_id]) return "";
    var html = "";
    html += 'Neuer Follower: ';
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '" target="_blank">' + event.source.screen_name + '</a> (' + event.source.name + ')';
    html += '</span>';
    followers_ids[account_id].push(event.source.id);
    return getEventHTML(event, html);
}

/** Creates html for a favorite added-event and adds it to the DOM via addEvent(). */
function getFavoriteEventHTML(event, account_id) {
    if (event.source.screen_name==this_users_name[account_id]) return "";
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '" target="_blank">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' favorisierte:<br />';
    html += linkify(event.text);
    return getEventHTML(event, html);
}

/** Creates html for an added to list-event and adds it to the DOM via addEvent(). */
function getListMemberAddedEventHTML(event, account_id) {
    if (event.source.screen_name==this_users_name[account_id]) return "";
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '" target="_blank">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' fügte dich zu einer Liste hinzu:<br />';
    html += '<a href="http://twitter.com' + event.target_object.uri + '" target="_blank">' + event.target_object.full_name + '</a> ';
    html += '(' + event.target_object.members_count + 'Members, ' + event.target_object.subscriber_count + ' Subscribers)';
    return getEventHTML(event, html);
}

/** Creates html for a removed from list-event and adds it to the DOM via addEvent(). */
function getListMemberRemovedEventHTML(event, account_id) {
    if (event.source.screen_name==this_users_name[account_id]) return "";
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '" target="_blank">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' löschte dich von einer Liste:<br />';
    html += '<a href="http://twitter.com' + event.target_object.uri + '" target="_blank">' + event.target_object.full_name + '</a> ';
    return getEventHTML(event, html);
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

/** Adds a leading null to numbers less than 10. */
function addnull(number) {
    if (number<10)
        return "0" + number;
    return number;
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

function toggle_file(force_hide) {
    show_file_field = !show_file_field;
    if (force_hide) show_file_field=false;
    $('#file_div').toggle(show_file_field);
    if (!show_file_field) {
        $('#file').val('');
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

/**
 * Get called when the user clicks the "Tweet" button. Does not actually send the tweet,
 * but calls _sendTweet(), which does.
 */
function sendTweet(event) {
    if (event) event.preventDefault();
    if(settings.show_error_if_no_place_is_set && settings.places.length>0 && document.tweet_form.place.options[0].selected && !confirm('Kein Ort gesetzt. Wirklich ohne Koordinaten tweeten?'))
        return;

    var text = $('#text').val();

    var parts = splitTweet(text);

    if (parts.length==1) {
        _sendTweet(parts[0], true);
    } else {
        for (var i=0; i<parts.length; i++) {
            if (_sendTweet(parts[i])) {
                /* Tweet wurde erfolgreich gesendet */
                if (i == (parts.length-1)) {
                    /* Es war der letzte oder einzige Teil des Tweets */
                    $('#text').val('');
                    reply_to_user = null;
                    reply_to_id = null;
                    sending_dm_to = null;
                    update_form_display();
                    updateCounter();
                }
            } else {
                /* Tweet konnte nicht abgesendet werden */
                /* Neuen String bauen... */
                text = "";
                for (var j=i; j<parts.length; j++) {
                    text += parts[j] + ' ';
                }
                $('#text').val(text);
                break;
            }
        }
    }
    return false;
}

/** Send a tweet. Depending on the parameter async, this happens asynchronously or synchronously.
 * Asynchronously is used, if there's just one tweet to send.
 * Synchronously, if there are multiple tweets (a long, splitted tweet).
 */
function _sendTweet(text, async) {
    if (async==undefined) async=false;
    var parameters = {
        status: text,
        wrap_links: true
    };
    if (settings.places.length>0) {
        placeIndex = document.tweet_form.place.value;
        if(placeIndex > 0) {
            // Substract placeIndex by one:
            // The first index in the HTML is the "empty" place, which has id 0.
            // The elements in the places-array begin with 0, too, so in the HTML they got their id plus one.
            placeIndex--;
            parameters.lat = settings.places[placeIndex].lat + (((Math.random()*300)-15)*0.000001);
            parameters.lon = settings.places[placeIndex].lon + (((Math.random()*300)-15)*0.000001);
            if (settings.places[placeIndex].place_id)
                parameters.place_id = settings.places[placeIndex].place_id;
            parameters.display_coordinates = "true";
        }
    }
    if (document.tweet_form.reply_to_id.value != "")
        parameters.in_reply_to_status_id = document.tweet_form.reply_to_id.value;

    var message;
    var url;
    var data;
    var content_type = 'application/x-www-form-urlencoded';

    $('#form').fadeTo(500, 0).delay(500);
    
    var keys = {
        consumerKey: settings.twitter.consumerKey,
        consumerSecret: settings.twitter.consumerSecret,
        token: settings.twitter.users[current_account].token,
        tokenSecret: settings.twitter.users[current_account].tokenSecret
    };

    if ($('#file')[0].files[0] && !sending_dm_to) {
        // Es ist ein Bild vorhanden, das hochgeladen werden soll.

        message = {
            action: "https://upload.twitter.com/1/statuses/update_with_media.json",
            method: "POST"
        }
        
        var twitter = {
            
        };

        OAuth.setTimestampAndNonce(message);
        OAuth.completeRequest(message, keys);
        OAuth.SignatureMethod.sign(message, keys);

        url = 'proxy/upload/statuses/update_with_media.json?' + OAuth.formEncode(message.parameters);
        content_type = false;

        data = new FormData();
        data.append("media[]", $('#file')[0].files[0]);

        for (var key in parameters) {
            data.append(key, parameters[key]);
        }

    } else {
        message = {
            action: "https://api.twitter.com/1/statuses/update.json",
            method: "POST",
            parameters: parameters
        }

        url = "proxy/api/statuses/update.json";

        if (sending_dm_to) {
            message.action = "https://api.twitter.com/1/direct_messages/new.json";
            url = "proxy/api/direct_messages/new.json";
            message.parameters.screen_name = sending_dm_to;
            message.parameters.text = message.parameters.status;
        }

        OAuth.setTimestampAndNonce(message);
        OAuth.completeRequest(message, keys);
        OAuth.SignatureMethod.sign(message, keys);

        data = OAuth.formEncode(message.parameters);
    }

    var req = $.ajax({
        url: url,
        data: data,
        processData: false,
        contentType: content_type,
        async: async,
        dataType: "json",
        type: "POST",
        success: function(data, textStatus, req) {
            if (data.text) {
                //$('#counter').html(data + textStatus);
                var html = "";

                if (data.user) { // Normaler Tweet
                    html += 'Tweet-ID: ' + data.id_str + '<br />';
                    html += 'Mein Tweet Nummer: ' + data.user.statuses_count + '<br />';
                    html += 'Follower: ' + data.user.followers_count + '<br />';
                    html += 'Friends:' + data.user.friends_count + '<br />';
                } else if (data.recipient) { // DM
                    html += "DM erfolgreich verschickt."
                }

                if (async) {
                    $('#text').val('');
                    reply_to_user = null;
                    reply_to_id = null;
                    updateCounter();
                    sending_dm_to = null;
                    update_form_display();
                }

                toggle_file(true);
                $('#success_info').html(html);
                $('#success').fadeIn(500).delay(2000).fadeOut(500, function() {
                    $('#form').fadeTo(500, 1);
                });
            } else {
                $('#failure_info').html(data.error);
                $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
                    $('#form').fadeTo(500, 1);
                });
            }
        },
        error: function(req, testStatus, exc) {
            var info = 'Error ' + req.status + ' (' + req.statusText + ')';
            try {
                var additional = $.parseJSON(req.responseText);
                if (additional.error) info += '<br /><strong>' + additional.error + '</strong>';
            } catch(e) {}
            $('#failure_info').html(info);
            $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
                $('#form').fadeTo(500, 1);
            });
        }
   });
   // if we're running asynchronously, we have to return false to prevent the browser from reloading
   // the current page.
   // I don't know why this happens, probably because some weird Javascript-Foo... *sigh*
   if (async) return false;
   return req.status==200;
}

/** Splits a tweet at the tweetSeperator, but maintains mentions for all parts. */
function splitTweet(text) {
    // if we're sending a dm, we don't support splitting tweets
    if (sending_dm_to) return [text];
    
    var mention = text.match(/^(((@[a-z0-9_]+) +)+)/i);
    var words = text.split(' ');
    var word;

    var parts = text.split(settings.tweetSeperator.seperator);
    for (var i=0; i<parts.length; i++) {
        parts[i] = parts[i].trim();
        if (i>0) {
            parts[i] = settings.tweetSeperator.prefix + parts[i];
        }
        if (i<parts.length-1) {
            parts[i] = parts[i] + settings.tweetSeperator.suffix;
        }
        if (mention && i>0) parts[i] = mention[1].trim() + ' ' + parts[i];
    }
    return parts;
}

/** Report user as spamming. */
function report_spam(sender_name) {
    if (!confirm('Wirklich ' + sender_name + ' als Spammer melden?'))
        return false;

    simple_twitter_request('report_spam.json', {
        parameters: {screen_name: sender_name},
        success_string: 'Spam reported',
        success: function() {
            $('.by_' + sender_name).remove();
        }
    });
}

/** Quotes a tweet (using the old "RT" syntax). */
function quote(tweet_id, user, text) {
    text = 'RT @' + user + ': ' + unescape(text);
    reply_to_user = user;
    reply_to_id = tweet_id;
    $('#text').val(text).focus();
    $('#reply_to_id').val(tweet_id);
    updateCounter();
}

/**
 * Prepares the form to reply to a tweet.
 * Prefills the textarea with "@user ", sets in_reply_to_id and sets the focus to the textarea.
 */
function replyToTweet(tweet_id, user, isDM) {
    $('#reply_to_id').val('');
    sending_dm_to = null;
    reply_to_user = null;
    reply_to_id = null;
    $('#text').val('').focus();

    if (isDM===true) {
        sending_dm_to = user;
    } else {
        reply_to_user = user;
        reply_to_id = tweet_id;
        var elm = $('#id_' + tweet_id);
        if (elm.data('mentions').length > 0 && $('#text')[0].selectionStart!=undefined) {
            var all_mentions = elm.data('mentions').split(' ');
            var filtered_mentions = new Array();
            for(var i in all_mentions) {
                if (all_mentions[i] == user) continue;
                if (all_mentions[i] == this_users_name[current_account]) continue;
                filtered_mentions.push('@' + all_mentions[i]);
            }
            var mentions = filtered_mentions.join(' ');
            var text = '@' + user + ' ' + mentions + ' ';
            $('#text').val(text.trim() + ' ');
            $('#text')[0].selectionStart = user.length+2;
            $('#text')[0].selectionEnd = user.length+2+mentions.length+1;
        } else {
            $('#text').val('@' + user + ' ');
        }
        $('#text').focus();
        //$('#text').val('@' + user + ' ').focus();
        $('#reply_to_id').val(tweet_id);
    }

    $('#text').focus();
    updateCounter();
    update_form_display();
}

/** Gets the length of the tweet, remaining chars to twitter's 140 char limit and displays it. */
function updateCounter() {
    var text = $('#text').val();

    var dm_match = text.match(/^d @?(\w+) (.*)$/i);
    if (!sending_dm_to && dm_match) {
        sending_dm_to = dm_match[1];
        reply_to_id = null;
        reply_to_user = null;
        text = dm_match[2];
        $('#text').val(text);
        update_form_display();
    }

    var parts = splitTweet(text);

    var lengths = "";
    var color = "#0b0";
    if (parts.length==0)
        lengths = "140+";
    for (var i=0; i<parts.length; i++) {
        var text = parts[i];
        var len = 140 - text.length;
        if ($('#file')[0].files[0]) len -= characters_reserved_per_media;
        var matches = text.match(regexp_url);
        if (matches) for (var i=0; i<matches.length; i++) {
            var m = matches[i].trim();
            if (m.length < short_url_length) continue;
            len += m.length;
            if (m.slice(0, 5)=="https") len -= short_url_length_https;
            else len -= short_url_length;
        }
        if (len<0) color="#f00";
        lengths += len+'+';
    }
    lengths = lengths.substr(0, lengths.length-1);

    $('#counter').html(lengths);
    $('#counter').css("color", color);

    if (reply_to_id != null) {
        var re = new RegExp("(^| )@" + reply_to_user + "([\.:, ]|$)");
        if (re.test(text)) {
            $('#reply_warning').fadeOut();
        } else {
            $('#reply_warning').fadeIn();
        }
    } else {
        $('#reply_to_id').val('');
        $('#reply_warning').fadeOut();
    }
}

/** Updated the visibility of the different fields in the form area. */
function update_form_display() {
    if (sending_dm_to!=null) {
        toggle_file(true);
        $('#dm_info_text').html('DM @' + sending_dm_to);
    }
    $('#dm_info').toggle(sending_dm_to!=null);
    $('#place').toggle(sending_dm_to==null);
    $('#file_choose').toggle(sending_dm_to==null);
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

/** Check the time between two presses of Enter and send the tweet if the time is lower than settings.timings.max_double_enter_time. */
function checkEnter(event) {
    var d = new Date();
    if (d.getTime() - timeOfLastEnter <= settings.timings.max_double_enter_time) {
        if (event) event.preventDefault();
        $('#text').val(textBeforeEnter);
        sendTweet();
    }
    textBeforeEnter = $('#text').val();
    timeOfLastEnter = d.getTime();
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

/** Adds an entry to the debug log if enabled in settings.js. */
function log_message(place, s, account_id) {
    if (settings.debug && typeof console != "undefined" && console.log) {
        if (account_id==null) account_id=" ";
        var str = "[ " + account_id + " ] ";
        str += "[ " + place;
        for(var i=0; i<(20-place.length); i++) str += " ";
        str += " ] " + s;
        console.log(str);
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