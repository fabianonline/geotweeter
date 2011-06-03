/****************************************/
/********** Fabians Geotweeter **********/
/****************************************/



/** Keeps track of how much of the server stream has already been processed. */
var responseOffset = 0;

/** Contains "new" parts of the stream for processing. */
var buffer = "";

/** isProcessing is true while parseData is running. */
var isProcessing = false;

/** Keeps track of a user and his tweet's id if we're replying to a tweet. */
var reply_to_user = null;
var reply_to_id = null;

/** ID of last "marked as read" tweet. Any tweet with an ID bigger than this is considered new. */
var maxreadid = 0;

/** IDs of newest and oldest knwon tweets. */
var maxknownid = "0";
var minknownid = 0;

/** ID of the newest tweet belonging to "this" user. */
var mylasttweetid = 0;

/** Time the connection to the streaming API was established / got the last data. */
var connectionStartedAt = new Date();
var lastDataReceivedAt = null;

/** true, if the streaming connection was terminated because of a timeout. */
var disconnectBecauseOfTimeout = false;

/** Keeps track of all tweets being replied to. */
var repliesData = new Array();

/** Gets filled by verify_credentials with the current user's name. */
var this_users_name = null;

/** Gets filled with the IDs of all followers. */
var friends_ids = new Array();

regexp_url = /((https?:\/\/)(([^ :]+(:[^ ]+)?@)?[a-zäüöß0-9]([a-zäöüß0-9i\-]{0,61}[a-zäöüß0-9])?(\.[a-zäöüß0-9]([a-zäöüß0-9\-]{0,61}[a-zäöüß0-9])?){0,32}\.[a-z]{2,5}(\/[^ \"@]*[^" \.,;\)@])?))/ig;
regexp_user = /(^|\s)@([a-zA-Z0-9_]+)/g;
regexp_hash = /(^|\s)#([\wäöüÄÖÜß]+)/g;
regexp_cache = /(^|\s)(GC[A-Z0-9]+)/g;


$(document).ready(start);

function start() {
    // Fill Form
    for(var i=0; i<places.length; i++) {
        document.tweet_form.place.options[document.tweet_form.place.length] = new Option(places[i].name, i);
    }
    for(var i=0; i<chars.length; i++) {
        $('#chars').append('<a href="#" onClick="$(\'#text\').val($(\'#text\').val() + \'' + chars[i] + '\');">' + chars[i] + '</a>');
    }

    // check the credentials and exit if not okay.
    validateCredentials();
    if (!this_users_name) return;


    getFollowers();

    maxreadid = getMaxReadID();
    startRequest();

    updateCounter();

    $(document).bind('keydown', 'Alt+s', sendTweet);

    window.setInterval("checkForTimeout()", 30000);
    if (window.opera) window.setInterval("parseResponse()", 5000);
}

function validateCredentials() {
    setStatus("Validating credentials...", "yellow");
    var message = {
        action: "https://api.twitter.com/1/account/verify_credentials.json",
        method: "GET"
    }
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'proxy/api/account/verify_credentials.json?' + OAuth.formEncode(message.parameters);
    return $.ajax({
        url: url,
        type: "GET",
        async: false,
        success: function(data, result, request) {
            if (data.screen_name) {
                this_users_name = data.screen_name;
            } else {
                addHTML("Unknown error in validateCredentials. Exiting. " + data);
            }
        },
        error: function(data, result, request) {
            addHTML("Unknown error in validateCredentials. Exiting. " + data.responseText);
        }
    });
}

function getFollowers() {
    var message = {
        action: "https://api.twitter.com/1/followers/ids.json",
        method: "GET"
    }
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = "proxy/api/followers/ids.json?" + OAuth.formEncode(message.parameters);
    $.ajax({
        url: url,
        type: "GET",
        async: true,
        success: function(data) {
            followers_ids = data;
        }
    });
}

function checkForTimeout() {
    var jetzt = new Date();
    if (lastDataReceivedAt && jetzt.getTime() - lastDataReceivedAt.getTime() > 45000) {
        disconnectBecauseOfTimeout = true;
        req.abort();
    }
}

function fillList() {
    setStatus("Filling List. Request 1/2...", "yellow");

    var parameters = {include_rts: "1", count: 200, include_entities: true};
    if (maxknownid!="0") parameters.since_id = maxknownid;
    var message = {
        action: "https://api.twitter.com/1/statuses/home_timeline.json",
        method: "GET",
        parameters: parameters
    }
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'proxy/api/statuses/home_timeline.json?' + OAuth.formEncode(message.parameters);
    var returned = $.ajax({
        url: url,
        type: "GET",
        async: false,
        dataType: "text"
    }).responseText;


    setStatus("Filling List. Request 2/2...", "yellow");
    message.action = "https://api.twitter.com/1/statuses/mentions.json";
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'proxy/api/statuses/mentions.json?' + OAuth.formEncode(message.parameters);
    var returned_mentions = $.ajax({
        url: url,
        type: "GET",
        async: false,
        dataType: "text"
    }).responseText;

    parseData(returned, returned_mentions);
}
    
function startRequest() {
    fillList();

    var message = {
        action: "https://userstream.twitter.com/2/user.json",
        method: "GET",
        parameters: {delimited: "length", include_entities: "1", include_rts: "1"}
    }

    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'user_proxy?' + OAuth.formEncode(message.parameters);
    
    setStatus("Connecting to stream...", "orange");

    disconnectBecauseOfTimeout = false;

    req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = parseResponse;
    req.send(null);
}

function parseResponse() {
    if (!req) return;

    if (req.readyState == 1) {
        connectionStartedAt = new Date();
    } else if (req.readyState == 4) {
        setStatus("Disconnected.", "red");
        var jetzt = new Date();
        if (jetzt.getTime() - connectionStartedAt.getTime() > 10000)
            delay = mindelay;
        var html = '<div class="status">Disconnect. ';
        if (disconnectBecauseOfTimeout) {
            html += 'Grund: Timeout. ';
        }
        if (req.status != 200) {
            html += 'Status: ' + req.status + ' (' + req.statusText + '). ';
            delay = maxdelay;
        }
        addHTML(html + 'Nächster Versuch in ' + delay + ' Sekunden.</div>');
        window.setTimeout('startRequest()', delay*1000);
        req = null;
        if (delay*2 <= maxdelay)
            delay = delay * 2;
    } else if (req.readyState == 3) {
        setStatus("Connected to stream.", "green");
        lastDataReceivedAt = new Date();
    }
    buffer += req.responseText.substr(responseOffset);
    responseOffset = req.responseText.length;
    if (!isProcessing) processBuffer();
}

function processBuffer() {
    isProcessing = true;
    reg = /^[\r\n]*([0-9]+)\r\n([\s\S]+)$/;
    while(res = buffer.match(reg)) {
        len = parseInt(res[1]);
        if (res[2].length >= len) {
            parseableText = res[2].substr(0, len);
            buffer = res[2].substr(len);
            parseData(parseableText);
        } else {
            break;
        }
    }
    isProcessing = false;
}

function parseData(data, data2) {
    try {
        var message = eval('(' + data + ')');
    } catch (e) {
        addHTML("Exception: " + e + '<br />' + data + '<hr />');
    }

    var message2 = null;
    if (data2 != undefined) try {
        message2 = eval('(' + data2 + ')');
    } catch(e) {}

    if (message.constructor.toString().indexOf('Array')!=-1) {

        var html = '';
        if (message2 == null) {
            for(var i=0; i<message.length; i++) {
                if (message[i]) html += getStatusHTML(message[i]);
            }
        } else {
            var i=0;
            var j=0;
            var last_id = null;
            while (i<message.length || j<message2.length) {
                if(!message2[j] || (message[i] && biggerThan(message[i].id, message2[j].id))) {
                    if (last_id!=message[i].id) html += getStatusHTML(message[i]);
                    last_id = message[i].id;
                    i++;
                } else {
                    if (last_id!=message2[j].id) html += getStatusHTML(message2[j]);
                    last_id = message2[j].id;
                    j++;
                }
            }
        }
        addHTML(html);
        return;
    }

    if (message==null)
        return; // Fix for NULLs in stream

    if (message.text) {
        addHTML(getStatusHTML(message));
    } else if (message.friends) {
        twitter_friends = message.friends;
    } else if ("delete" in message) {
        // Deletion-Request. Do nothing ,-)
    } else if (message.direct_message) {
        addHTML(getStatusHTML(message));
    } else if (message.event && message.event=="follow") {
        // Social Event.
        addFollowEvent(message);
    } else if (message.event && message.event=="favorite") {
        addFavoriteEvent(message);
    } else if (message.event && message.event=="list_member_added") {
        addListMemberAddedEvent(message);
    } else if (message.event && message.event=="list_member_removed") {
        addListMemberRemovedEvent(message);
    } else {
        addHTML('<hr />Unbekannte Daten:<br />' + data);
    }
}

function addHTML(text) {
    var elm = document.createElement("div");
    elm.innerHTML = text;
    $(elm).find('.user_avatar').tooltip({
        bodyHandler: function() {
            var par = $(this).parent().parent();
            var obj = par.find('.tooltip_info');
            var html = obj.html();
            var id = parseInt(par.attr("data-user-id"));
            if (followers_ids.indexOf(id)>=0) {
                html = html.replace(/%s/, 'folgt dir.');
            } else {
                html = html.replace(/%s/, 'folgt dir nicht.');
            }
            return html;
        },
        track: true,
        showURL: false,
        left: 5
    });
    $(elm).find("a.external").tooltip({
        bodyHandler: function() {
            return unshortenLink(this.href).replace(/\//g, "<wbr>/");
        },
        track: true,
        showURL: false,
        delay: 750
    });
    document.getElementById('content').insertBefore(elm, document.getElementById('content').firstChild);
}

function unshortenLink(url) {
    var result = null;
    $.ajax({
        url: "proxy/unshort.me/?r=" + encodeURIComponent(url) + "&t=json",
        type: "GET",
        async: false,
        dataType: "json",
        success: function(data) { result = data; }
    });
    if(result && result.success=="true") return result.resolvedURL;
    return url;
}

function addEvent(event, text) {
    var html = "";
    html += '<div class="status">';
    html += '<span class="avatar">';
    html += '<a href="http://twitter.com/account/profile_image/' + event.source.screen_name + '"><img class="user_avatar" src="' + event.source.profile_image_url + '" /></a>';
    html += '</span>';
    html += text;
    html += '</div>';
    addHTML(html);
}

function addFollowEvent(event) {
    if (event.source.screen_name==this_users_name) return;
    var html = "";
    html += 'Neuer Follower: ';
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '">' + event.source.screen_name + '</a> (' + event.source.name + ')';
    html += '</span>';
    friends_ids.push(event.source.id);
    addEvent(event, html);
}

function addFavoriteEvent(event) {
    if (event.source.screen_name==this_users_name) return;
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' favorisierte:<br />';
    html += linkify(event.text);
    addEvent(event, html);
}

function addListMemberAddedEvent(event) {
    if (event.source.screen_name==this_users_name) return;
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' fügte dich zu einer Liste hinzu:<br />';
    html += '<a href="http://twitter.com' + event.target_object.uri + '">' + event.target_object.full_name + '</a> ';
    html += '(' + event.target_object.members_count + 'Members, ' + event.target_object.subscriber_count + ' Subscribers)';
    addEvent(event, html);
}

function addListMemberRemovedEvent(event) {
    if (event.source.screen_name==this_users_name) return;
    var html = "";
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '">' + event.source.screen_name + '</a>';
    html += '</span>';
    html += ' löschte dich von einer Liste:<br />';
    html += '<a href="http://twitter.com' + event.target_object.uri + '">' + event.target_object.full_name + '</a> ';
    addEvent(event, html);
}


function getStatusHTML(status) {
    if (status.id_str)
        status.id = status.id_str;
    if (status.in_reply_to_status_id_str)
        status.in_reply_to_status_id = status.in_reply_to_status_id_str;
    isDM = false;
    if (status.direct_message) {
        isDM = true;
        status = status.direct_message;
    }
    if (!isDM && status.in_reply_to_status_id) {
        repliesData[status.id] = status.in_reply_to_status_id;
    }
    var html = "";
    var user;
    var user_object;
    if (status.retweeted_status)
        user_object = status.retweeted_status.user;
    else if (isDM)
        user_object = status.sender;
    else
        user_object = status.user;

    user = user_object.screen_name;

    if (!isDM && biggerThan(status.id, maxknownid))
        maxknownid = status.id;
    if (!isDM && (minknownid==0 || status.id < minknownid))
        minknownid = status.id;

    if (!isDM && user==this_users_name && biggerThan(status.id, mylasttweetid))
        mylasttweetid = status.id;

    var date = new Date(status.created_at);
    var datum = addnull(date.getDate()) + '.' + addnull(date.getMonth()+1) + '.' + (date.getYear()+1900) + ' ' + addnull(date.getHours()) + ':' + addnull(date.getMinutes());
    html += '<div class="';
    if (!isDM)
        html += 'tweet ';
    else
        html += 'dm ';
    html += 'by_' + user + ' ';
    if (user == this_users_name) html += "by_this_user ";
    if (!isDM && biggerThan(status.id, maxreadid))
        html += 'new ';
    var mentions = status.text.match(regexp_user);
    if (mentions) {
        for (var i=0; i<mentions.length; i++) {
            mention = String(mentions[i]).trim().substr(1);
            html += 'mentions_' + mention + ' ';
            if (mention == this_users_name) html += "mentions_this_user ";
        }
    }
    html += '" id="id_' + status.id + '">';
    html += '<a name="status_' + status.id + '"></a>';
    html += '<span class="avatar" data-user-id="' + user_object.id + '">';

    // Start Tooltip-Info
    html += '<span class="tooltip_info">';
    html += '<strong>' + user_object.name + '</strong><br /><br />';
    html += user_object.followers_count + ' Follower<br />';
    html += user_object.friends_count + ' Friends<br />';
    html += user_object.statuses_count + ' Tweets<br /><br />';
    html += "@" + user + " %s";
    html += '</span>';
    // Ende Tooltip-Info

    html += '<a href="http://twitter.com/account/profile_image/' + user + '"><img class="user_avatar" src="';
    if (status.retweeted_status)
        html += status.retweeted_status.user.profile_image_url;
    else if (isDM)
        html += status.sender.profile_image_url;
    else
        html += status.user.profile_image_url;
    html += '" /></a>';
    html += '</span>';
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + user + '" target="_blank">' + user + '</a>';
    html += '</span> ';
    html += '<span class="text">';
    if (status.retweeted_status)
        html += linkify(status.retweeted_status.text);
    else
        html += linkify(status.text);
    html += '</span>';
    if (status.retweeted_status)
        html += '<div class="retweet_info">Retweeted by <a href="http://twitter.com/' + status.user.screen_name + '">' + status.user.screen_name + '</a></div>';
    if (status.place)
        html += '<div class="place">from <a href="http://twitter.com/#!/places/' + status.place.id + '">' + status.place.full_name + '</a></div>';
    html += '<div class="overlay">';
    html += '<div class="info">';
    html += '<a href="http://twitter.com/#!/' + user + '/status/' + status.id + '">' + datum + '</a> ';
    if(status.in_reply_to_status_id) {
        html += '<a href="#" onClick="replies_show(\'' + status.id + '\'); return false;">in reply to...</a> ';
    }
    if (status.source)
        html += 'from ' + status.source + ' ';
    html += '</div>';

    html += '<div class="links">';
    if (isDM)
        html += '<a href="#" onClick="replyToTweet(\'' + status.id + '\', \'' + user + '\', true); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    else
        html += '<a href="#" onClick="replyToTweet(\'' + status.id + '\', \'' + user + '\'); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    if (!isDM)
        html += '<a href="#" onClick="retweet(\'' + status.id + '\'); return false;"><img src="icons/arrow_rotate_clockwise.png" title="Retweet" /></a>';
    if (!isDM)
        html += '<a href="#" onClick="quote(\'' + status.id + '\', \'' + user + '\', \'' + escape(status.text.split('"').join('').split('@').join('')) + '\'); return false;"><img src="icons/tag.png" title="Quote" /></a>';
    html += '<a href="http://translate.google.de/#auto|de|' + escape(status.text.split('"').join('').split('@').join('')) + '" target="_blank"><img src="icons/transmit.png" title="Translate" /></a>';
    html += '<a href="http://twitter.com/#!/' + user + '/status/' + status.id + '"><img src="icons/link.png" title="Permalink" /></a>';
    if (status.coordinates) {
        html += '<a href="http://maps.google.com/?q=' + status.coordinates.coordinates[1] + ',' + status.coordinates.coordinates[0] + '" target="_blank"><img src="icons/world.png" title="Geotag" /></a>';
        html += '<a href="http://maps.google.com/?q=http%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fuser_timeline%2F' + user + '.atom%3Fcount%3D250"><img src="icons/world_add.png" title="All Geotags" /></a>';
    }

    html += '</div>'; // Links
    html += '</div>'; // overlay
    html += '</div>'; // tweet
    
    return html;
}

function addnull(number) {
    if (number<10)
        return "0" + number;
    return number;
}

function linkify(text) {
    text = text.replace(regexp_url, '<a href="$1" target="_blank" class="external">$1</a>');
    text = text.replace(regexp_user, '$1@<a href="http://twitter.com/$2" target="_blank">$2</a>');
    text = text.replace(regexp_hash, '$1<a href="http://twitter.com/search?q=#$2" target="_blank">#$2</a>');
    text = text.replace(regexp_cache, '$1<a href="http://coord.info/$2" target="_blank">$2</a>');
    text = text.replace(/\n/g, '<br />\n');
    return text;
}

function replies_show(id) {
    $('#replies').show();
    //$('#form_area, #content, #status, #buttonbar').hide();

    // Quelle als erstes anzeigen
    $('#replies_content').html(
        $('#id_' + id).fullhtml()
    );
    while (repliesData[id]) {
        id = repliesData[id];
        if($('#id_' + id).length>0)
            $('#replies_content').append($('#id_' + id).fullhtml());
        else
            $('#replies_content').append('<a href="http://twitter.com/#!/user/status/' + id + '" target="_blank">Show next status</a>');
    }
}

function replies_close() {
    $('#replies').hide();
    //$('#form_area, #content, #status, #buttonbar').show();
}

function sendTweet(event) {
    if (event) event.preventDefault();

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
}

function _sendTweet(text, async) {
    if (async==undefined) async=false;
    var parameters = {status: text};
    placeIndex = document.tweet_form.place.value;
    if(placeIndex > 0) {
        parameters.lat = places[placeIndex].lat + (((Math.random()*300)-15)*0.000001);
        parameters.lon = places[placeIndex].lon + (((Math.random()*300)-15)*0.000001);
        if (places[placeIndex].place_id)
            parameters.place_id = places[placeIndex].place_id;
        parameters.display_coordinates = "true";
    }
    if (document.tweet_form.reply_to_id.value != "")
        parameters.in_reply_to_status_id = document.tweet_form.reply_to_id.value;

    var message = {
        action: "https://api.twitter.com/1/statuses/update.json",
        method: "POST",
        parameters: parameters
    }

    $('#form').fadeTo(500, 0).delay(500);
    
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'proxy/api/statuses/update.json';
    var data = OAuth.formEncode(message.parameters);

    var req = $.ajax({
        url: url,
        data: data,
        async: async,
        dataType: "json",
        type: "POST",
        success: function(data, textStatus, req) {
            if (data.text) {
                //$('#counter').html(data + textStatus);
                var html = 'Tweet-ID: ' + data.id_str + '<br />';
                html += 'Mein Tweet Nummer: ' + data.user.statuses_count + '<br />';
                html += 'Follower: ' + data.user.followers_count + '<br />';
                html += 'Friends:' + data.user.friends_count + '<br />';

                if (async) {
                    $('#text').val('');
                    reply_to_user = null;
                    reply_to_id = null;
                    updateCounter();
                }

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
            $('#failure_info').html('Error ' + req.status + ' (' + req.statusText + ')');
            $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
                $('#form').fadeTo(500, 1);
            });
        }
   });
   return req.status==200;
}

function splitTweet(text) {
    var mention = text.match(/^(((@[a-z0-9_]+) +)+)/i);
    var words = text.split(' ');
    var word;

    var parts = text.split(tweetSeperator);
    for (var i=0; i<parts.length; i++) {
        parts[i] = parts[i].trim();
        if (mention && i>0) parts[i] = mention[1].trim() + ' ' + parts[i];
    }
    return parts;
}

function retweet(id) {
    if (!confirm('Wirklich direkt retweeten?'))
        return false;

    var message = {
        action: "https://api.twitter.com/1/statuses/retweet/" + id + ".json",
        method: "POST"
    }

    $('#form').fadeTo(500, 0).delay(500);
    
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'proxy/api/statuses/retweet/' + id + '.json';
    var data = OAuth.formEncode(message.parameters);

    $.ajax({
        url: url,
        data: data,
        dataType: "json",
        type: "POST",
        success: function(data, textStatus, req) {
            if (req.status==200) {
                $('#success_info').html("Retweet successful");
                $('#success').fadeIn(500).delay(5000).fadeOut(500, function() {
                    $('#form').fadeTo(500, 1);
                });
            } else {
                $('#failure_info').html(data.error);
                $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
                    $('#form').fadeTo(500, 1);
                });
            }
            updateCounter();
        },
        error: function(req, testStatus, exc) {
            $('#failure_info').html('Error ' + req.status + ' (' + req.statusText + ')');
            $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
                $('#form').fadeTo(500, 1);
            });
        }
   });
}

function quote(tweet_id, user, text) {
    text = 'RT @' + user + ': ' + unescape(text);
    reply_to_user = user;
    reply_to_id = tweet_id;
    $('#text').val(text).focus();
    $('#reply_to_id').val(tweet_id);
    updateCounter();
}

function replyToTweet(tweet_id, user, isDM) {
    reply_to_user = user;
    reply_to_id = tweet_id;
    $('#text').focus();
    $('#text').val('');
    if (isDM===true)
        $('#text').val('d ' + user + ' ').focus();
    else
        $('#text').val('@' + user + ' ').focus();
    $('#reply_to_id').val(tweet_id);
    updateCounter();
}

function updateCounter() {
    var text = $('#text').val();
    var parts = splitTweet(text);

    var lengths = "";
    if (parts.length==0)
        lengths = "140+";
    for (var i=0; i<parts.length; i++) {
        var len = 140 - parts[i].length;
        lengths += len+'+';
    }
    lengths = lengths.substr(0, lengths.length-1);
        
    $('#counter').html(lengths);

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

function removeReplyWarning() {
    $('#reply_to_id').val('');
    $('#reply_warning').fadeOut();
    reply_to_user = null;
    reply_to_id = null;
}

function getMaxReadID() {
    return $.ajax({
        method: 'GET',
        url: 'getmaxreadid.php',
        async: false,
        dataType: 'text'
    }).responseText;
}

function setMaxReadID(id) {
    $.ajax({
        method: 'GET',
        url: 'setmaxreadid.php',
        async: false,
        dataType: 'text',
        data: {id: id}
    });
}

function markAllRead() {
    if (maxknownid > 0)
        setMaxReadID(maxknownid);
    maxreadid = maxknownid;
    $('.new').removeClass('new');
}

function goToMyLastTweet() {
    if (mylasttweetid > 0)
        scrollTo(mylasttweetid);
}

/** Scrolls to a tweet specified by it's id. */
function scrollTo(tweet_id) {
    // Jump to the tweet's anchor
    self.location = '#status_' + tweet_id;

    // The selected tweet is now behind the form-overlay, so we need to scroll back up a little bit.
    // The padding-top of the content-area equals the height of the overlay, so we use that.
    var top = $("html").scrollTop();
    var topheight = parseInt($('#content').css("padding-top"));
    $("html").scrollTop(top - topheight);
}

/** Sets a status message. The colors are actually class names. */
function setStatus(message, color) {
    $("#status").text(message).removeClass().addClass(color);
}

function goToLastRead(){ //springt zum zuletzt gelesenen Tweet
	self.location = '#status_' + maxreadid;
}

function biggerThan(a, b) {
    var l1 = a.length;
    var l2 = b.length;
    if (l1>l2) return true;
    if (l1<l2) return false;
    return a>b;
}
