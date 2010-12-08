var url = "https://userstream.twitter.com/2/user.json";
//var url = "http://stream.twitter.com/1/statuses/sample.json";

var message = {
    action: url,
    method: "GET",
    parameters: {delimited: "length", include_entities: "1", include_rts: "1"}
}

var responseOffset = 0;
var buffer = "";
var isProcessing = false;
var reply_to_user = null;
var reply_to_id = null;
var maxreadid = 0;
var maxknownid = 0;
var minknownid = 0;
var mylasttweetid = 0;
var connectionStartedAt = new Date();
var disconnectBecauseOfTimeout = false;
var lastDataReceivedAt = null;
var goDownTo = null;
var repliesData = new Array();

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

    maxreadid = getMaxReadID();
    startRequest();

    updateCounter();

    $(document).bind('keydown', 'Alt+s', sendTweet);

    window.setInterval("checkForTimeout()", 30000);
}

function checkForTimeout() {
    var jetzt = new Date();
    if (lastDataReceivedAt && jetzt.getTime() - lastDataReceivedAt.getTime() > 45000) {
        disconnectBecauseOfTimeout = true;
        req.abort();
    }
}

function fillList() {
    $('#status').find("*").hide();
    $('#status #filling').show();
    var page = 1;
    while ((minknownid==0 || maxreadid < minknownid) && page <= maxPages) {
        var parameters = {include_rts: "1", count: "500", page: page};
        if (maxknownid > 0)
            parameters.since_id = maxknownid;
        var message = {
            action: "https://api.twitter.com/1/statuses/home_timeline.json",
            method: "GET",
            parameters: parameters
        }
        OAuth.setTimestampAndNonce(message);
        OAuth.completeRequest(message, accessor);
        OAuth.SignatureMethod.sign(message, accessor);
        var url = 'home_timeline_proxy?' + OAuth.formEncode(message.parameters);
        var returned = $.ajax({
            url: url,
            type: "GET",
            async: false,
            dataType: "text"
        }).responseText;
        parseData(returned);
        page += 1;
    }
}
    
function startRequest() {
    fillList();

    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'user_proxy?' + OAuth.formEncode(message.parameters);
    //url = 'https://amazonas.f00bian.de/twitter.stream/sample_proxy?' + OAuth.formEncode(message.parameters);
    //$("#content").html($('#content').html() + url + '<hr />');
    //return;
    
    $('#status').find('*').hide();
    $('#status #connecting').show();

    disconnectBecauseOfTimeout = false;

    req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = parseResponse;
    req.send(null);
}

function parseResponse(event) {
    if (event.target.readyState == 1) {
        connectionStartedAt = new Date();
    } else if (event.target.readyState == 4) {
        $('#status').find('*').hide();
        $('#status #disconnected').show();
        var jetzt = new Date();
        if (jetzt.getTime() - connectionStartedAt.getTime() > 10000)
            delay = mindelay;
        var html = '<div class="status">Disconnect. ';
        if (disconnectBecauseOfTimeout) {
            html += 'Grund: Timeout. ';
        }
        if (event.target.status != 200) {
            html += 'Status: ' + event.target.status + ' (' + event.target.statusText + '). ';
            delay = maxdelay;
        }
        addHTML(html + 'Nächster Versuch in ' + delay + ' Sekunden.</div>');
        window.setTimeout('startRequest()', delay*1000);
        if (delay*2 <= maxdelay)
            delay = delay * 2;
    } else if (event.target.readyState == 3) {
        $('#status').find('*').hide();
        $('#status #connected').show();
        lastDataReceivedAt = new Date();
    }
    buffer += event.target.responseText.substr(responseOffset);
    responseOffset = event.target.responseText.length;
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

function parseData(data) {
    try {
        var message = eval('(' + data + ')');
    } catch (e) {
        addHTML("Exception: " + e + '<br />' + data + '<hr />');
    }
    if (message.constructor.toString().indexOf('Array')!=-1) {
        var html = '';
        for(var i=0; i<message.length; i++) {
            if (message[i]) html += getStatusHTML(message[i]);
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
    } else if (message.delete) {
        // Deletion-Request. Do nothing ,-)
    } else if (message.direct_message) {
        addHTML(getStatusHTML(message));
    } else if (message.event && message.event=="follow") {
        // Social Event.
        addFollowEvent(message);
    } else {
        addHTML('<hr />Unbekannte Daten:<br />' + data);
    }
}

function addHTML(text) {
    var elm = document.createElement("div");
    elm.innerHTML = text;
    document.getElementById('content').insertBefore(elm, document.getElementById('content').firstChild);
}

function addFollowEvent(event) {
    if (event.source.screen_name=="fabianonline") return;
    var html = "";
    html += '<div class="status">';
    html += '<span class="avatar">';
    html += '<a href="http://twitter.com/account/profile_image/' + event.source.screen_name + '"><img class="user_avatar" src="' + event.source.profile_image_url + '" /></a>';
    html += '</span>';
    html += 'Neuer Follower: ';
    html += '<span class="poster">';
    html += '<a href="http://twitter.com/' + event.source.screen_name + '">' + event.source.screen_name + '</a> (' + event.source.name + ')';
    html += '</span>';
    html += '</div>';
    addHTML(html);
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
    if (status.retweeted_status)
        user = status.retweeted_status.user.screen_name;
    else if (isDM)
        user = status.sender.screen_name;
    else
        user = status.user.screen_name;

    if (!isDM && biggerThan(status.id, maxknownid))
        maxknownid = status.id;
    if (!isDM && (minknownid==0 || status.id < minknownid))
        minknownid = status.id;

    if (!isDM && user=="fabianonline" && biggerThan(status.id, mylasttweetid))
        mylasttweetid = status.id;

    var date = new Date(status.created_at);
    var datum = addnull(date.getDate()) + '.' + addnull(date.getMonth()+1) + '.' + (date.getYear()+1900) + ' ' + addnull(date.getHours()) + ':' + addnull(date.getMinutes());
    html += '<div class="';
    if (!isDM)
        html += 'tweet ';
    else
        html += 'dm ';
    html += 'by_' + user;
    if (!isDM && biggerThan(status.id, maxreadid))
        html += ' new';
    var mentions = status.text.match(regexp_user);
    if (mentions) {
        for (var i=0; i<mentions.length; i++) {
            html += ' mentions_' + String(mentions[i]).trim().substr(1) + ' ';
        }
    }
    html += '" id="id_' + status.id + '">';
    html += '<a name="status_' + status.id + '"></a>';
    html += '<span class="avatar">';
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
    html += '<a href="http://twitter.com/' + user + '">' + user + '</a>';
    html += '</span>';
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
        html += '<a href="#" onClick="replyToTweet(' + status.id + ', \'' + user + '\', true); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    else
        html += '<a href="#" onClick="replyToTweet(' + status.id + ', \'' + user + '\'); return false;"><img src="icons/comments.png" title="Reply" /></a>';
    if (!isDM)
        html += '<a href="#" onClick="retweet(' + status.id + '); return false;"><img src="icons/arrow_rotate_clockwise.png" title="Retweet" /></a>';
    if (!isDM)
        html += '<a href="#" onClick="quote(' + status.id + ', \'' + user + '\', \'' + escape(status.text.split('"').join('').split('@').join('')) + '\'); return false;"><img src="icons/tag.png" title="Quote" /></a>';
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
    text = text.replace(regexp_url, '<a href="$1" target="_blank">$1</a>');
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

function sendTweet() {
    if(document.tweet_form.place.options[0].selected && !confirm('Kein Ort gesetzt. Wirklich ohne Koordinaten tweeten?'))
        return;

    var text = $('#text').val();
    
    var parts = splitTweet(text);

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

function _sendTweet(text) {
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
    var url = 'statuses_update_proxy';
    var data = OAuth.formEncode(message.parameters);

    var req = $.ajax({
        url: url,
        data: data,
        async: false,
        dataType: "json",
        type: "POST",
        success: function(data, textStatus, req) {
            if (data.text) {
                //$('#counter').html(data + textStatus);
                var html = 'Tweet-ID: ' + data.id_str + '<br />';
                html += 'Mein Tweet Nummer: ' + data.user.statuses_count + '<br />';
                html += 'Follower: ' + data.user.followers_count + '<br />';
                html += 'Friends:' + data.user.friends_count + '<br />';

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
    var mention = text.match(/^(@[a-z0-9_]+) /i);
    var words = text.split(' ');
    var word;
    var text = "";

    var parts = new Array();
    while ((word = words.shift())!=null) {
        text = text.trim();
        if (text.length + word.length + 1 <= 140-tweetSeperatorSuffix.length && word!=tweetSeperator)
            text += " " + word;
        else if (words.length==0 && text.length+word.length+1<=140 && word!=tweetSeperator)
            text += " " + word;
        else {
            parts.push((text + tweetSeperatorSuffix).trim());
            if (mention)
                text = mention[1] + ' ';
            else
                text = '';
            if (word==tweetSeperator)
                text += tweetSeperatorPrefix;
            else
                text += tweetSeperatorPrefix + word;
        }
    }
    if (text.trim().length>0)
        parts.push(text.trim());
    return parts;
}

function retweet(id) {
    if (!confirm('Wirklich direkt retweeten?'))
        return false;

    var parameters = {id: id};

    var message = {
        action: "https://api.twitter.com/1/statuses/retweet.json",
        method: "POST",
        parameters: parameters
    }

    $('#form').fadeTo(500, 0).delay(500);
    
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, accessor);
    OAuth.SignatureMethod.sign(message, accessor);
    var url = 'statuses_retweet_proxy';
    var data = OAuth.formEncode(message.parameters);

    $.ajax({
        url: url,
        data: data,
        dataType: "json",
        type: "POST",
        success: function(data, textStatus, req) {
            if (data.status) {
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
    if (isDM===true)
        $('#text').val('d ' + user + ' ').focus();
    else
        $('#text').val('@' + user + ' ').focus();
    $('#reply_to_id').val(tweet_id);
    setGoDownTo('status_' + tweet_id);
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

function setGoDownTo(hash) {
    goDownTo = hash;
    $('#godown').show();
}

function goDown() {
    self.location = '#' + goDownTo;
    goDownTo = null;
    $('#godown').hide();
}

function goToMyLastTweet() {
    if (mylasttweetid > 0)
        self.location = '#status_' + mylasttweetid;
}

function biggerThan(a, b) {
    var l1 = a.length;
    var l2 = b.length;
    if (l1>l2) return true;
    if (l1<l2) return false;
    return a>b;
}
