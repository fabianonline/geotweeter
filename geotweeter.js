/*
DO NOT MODIFY THIS FILE

Geotweeter is written in CoffeeScript (http://coffeescript.org/).
All source files are located in src/. This file (geotweeter.js)
is automatically generated from all the files in src/. Any modifications
to this file will be overwritten!

DO NOT MODIFY THIS FILE
*/
var Account, Application, DirectMessage, Event, FavoriteEvent, FollowEvent, HiddenEvent, Hooks, ListMemberAddedEvent, ListMemberRemovedEvent, PullRequest, Request, StreamRequest, Thumbnail, Tweet, TwitterMessage, UnknownEvent, User,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
  __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Date.prototype.format = function(format) {
  format = format.replace(/%d/g, this.getDate().add_null());
  format = format.replace(/%H/g, this.getHours().add_null());
  format = format.replace(/%m/g, (this.getMonth() + 1).add_null());
  format = format.replace(/%M/g, this.getMinutes().add_null());
  format = format.replace(/%S/g, this.getSeconds().add_null());
  format = format.replace(/%y/g, ((this.getYear() + 1900) % 100).add_null());
  format = format.replace(/%Y/g, this.getYear() + 1900);
  return format;
};

Number.prototype.add_null = function() {
  if (this >= 10) return this.toString();
  return "0" + this.toString();
};

String.prototype.pad = function(length, pad_char) {
  if (pad_char == null) pad_char = " ";
  if (length > this.length) {
    return this + pad_char.repeat(length - this.length);
  } else {
    return this;
  }
};

String.prototype.repeat = function(times) {
  return (new Array(times + 1)).join(this);
};

String.prototype.is_bigger_than = function(id) {
  var l1, l2;
  l1 = this.length;
  l2 = id.length;
  if (l1 === l2) return this > id;
  return l1 > l2;
};

Account = (function() {

  Account.first = null;

  Account.prototype.screen_name = "unknown";

  Account.prototype.max_read_id = "0";

  Account.prototype.max_known_tweet_id = "0";

  Account.prototype.max_known_dm_id = "0";

  Account.prototype.my_last_tweet_id = "0";

  Account.prototype.tweets = {};

  Account.prototype.id = null;

  Account.prototype.user = null;

  Account.prototype.request = null;

  Account.prototype.keys = {};

  Account.prototype.followers_ids = [];

  Account.prototype.status_text = "";

  function Account(settings_id) {
    this.fill_list = __bind(this.fill_list, this);
    var new_area,
      _this = this;
    this.id = settings_id;
    if (settings_id === 0) Account.first = this;
    this.keys = {
      consumerKey: settings.twitter.consumerKey,
      consumerSecret: settings.twitter.consumerSecret,
      token: settings.twitter.users[settings_id].token,
      tokenSecret: settings.twitter.users[settings_id].tokenSecret
    };
    new_area = $('#content_template').clone();
    new_area.attr('id', this.get_content_div_id());
    $('body').append(new_area);
    $('#users').append("			<div class='user' id='user_" + this.id + "' data-account-id='" + this.id + "'>				<a href='#' onClick='return Account.hooks.change_current_account(this);'>					<img src='icons/spinner.gif' />					<span class='count'></span>				</a>			</div>		");
    $("#user_" + this.id).tooltip({
      bodyHandler: function() {
        return "<strong>@" + _this.screen_name + "</strong><br />" + _this.status_text;
      },
      track: true,
      showURL: false,
      left: 5
    });
    this.request = settings.twitter.users[settings_id].stream != null ? new StreamRequest(this) : new PullRequest(this);
    this.validate_credentials();
  }

  Account.prototype.get_my_element = function() {
    return $("#content_" + this.id);
  };

  Account.prototype.set_max_read_id = function(id) {
    var header,
      _this = this;
    if (id == null) {
      Application.log(this, "set_max_read_id", "Falscher Wert: " + id);
      return;
    }
    this.max_read_id = id;
    header = {
      "X-Auth-Service-Provider": "https://api.twitter.com/1/account/verify_credentials.json",
      "X-Verify-Credentials-Authorization": this.sign_request("https://api.twitter.com/1/account/verify_credentials.json", "GET", {}, {
        return_type: "header"
      })
    };
    $.ajax({
      type: 'POST',
      url: "proxy/tweetmarker/lastread?collection=timeline,mentions&username=" + this.user.screen_name + "&api_key=GT-F181AC70B051",
      headers: header,
      contentType: "text/plain",
      dataType: 'text',
      data: "" + id + "," + id,
      processData: false,
      error: function(req) {
        var html;
        html = "					<div class='status'>						<b>Fehler in setMaxReadID():</b><br />						Error " + req.status + " (" + req.responseText + ")					</div>";
        return _this.add_html(html);
      }
    });
    return this.update_read_tweet_status();
  };

  Account.prototype.update_read_tweet_status = function() {
    var element, elements, elm, _i, _len;
    elements = $("#content_" + this.id + " .new");
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
      elm = elements[_i];
      element = $(elm);
      if (!this.is_unread_tweet(element.attr('data-tweet-id'))) {
        element.removeClass('new');
      }
    }
    return this.update_user_counter();
  };

  Account.prototype.get_max_read_id = function() {
    var header,
      _this = this;
    $("#user_" + this.id + " .count").html('(?)');
    header = {
      "X-Auth-Service-Provider": "https://api.twitter.com/1/account/verify_credentials.json",
      "X-Verify-Credentials-Authorization": this.sign_request("https://api.twitter.com/1/account/verify_credentials.json", "GET", {}, {
        return_type: "header"
      })
    };
    $.ajax({
      method: 'GET',
      async: true,
      url: "proxy/tweetmarker/lastread?collection=timeline&username=" + this.user.screen_name + "&api_key=GT-F181AC70B051",
      headers: header,
      dataType: 'text',
      success: function(data, textStatus, req) {
        if (req.status === 200 && (data != null)) {
          _this.max_read_id = data;
          Application.log(_this, "get_max_read_id", "result: " + data);
          return _this.update_read_tweet_status();
        }
      }
    });
  };

  Account.prototype.toString = function() {
    return "Account " + this.user.screen_name;
  };

  Account.prototype.get_content_div_id = function() {
    return "content_" + this.id;
  };

  Account.prototype.validate_credentials = function() {
    var _this = this;
    this.set_status("Validating Credentials...", "orange");
    return this.twitter_request('account/verify_credentials.json', {
      method: "GET",
      silent: true,
      async: true,
      success: function(element, data, req) {
        if (!data.screen_name) {
          _this.add_status_html("Unknown error in validate_credentials. Exiting. " + req.responseText);
          $("#user_" + _this.id + " img").attr('src', "icons/exclamation.png");
          return;
        }
        _this.user = new User(data);
        _this.screen_name = _this.user.screen_name;
        $("#user_" + _this.id + " img").attr('src', data.profile_image_url);
        _this.get_max_read_id();
        _this.get_followers();
        return _this.fill_list();
      },
      error: function(req) {
        _this.add_status_html("Unknown error in validate_credentials. Exiting. " + req.responseText);
        $("#user_" + _this.id + " img").attr('src', "icons/exclamation.png");
        return _this.set_status("Error!", "red");
      }
    });
  };

  Account.prototype.get_followers = function() {
    var _this = this;
    return this.twitter_request('followers/ids.json', {
      silent: true,
      method: "GET",
      success: function(element, data) {
        return _this.followers_ids = data.ids;
      }
    });
  };

  Account.prototype.get_tweet = function(id) {
    return this.tweets[id];
  };

  Account.prototype.add_html = function(html) {
    var element;
    element = document.createElement("div");
    element.innerHTML = html;
    return this.get_my_element().prepend(element);
  };

  Account.prototype.add_status_html = function(message) {
    var html;
    html = "			<div class='status'>				" + message + "			</div>";
    this.add_html(html);
    return "";
  };

  Account.prototype.update_user_counter = function() {
    var count, str;
    count = $("#content_" + this.id + " .tweet.new").not('.by_this_user').length;
    str = count > 0 ? "(" + count + ")" : "";
    return $("#user_" + this.id + " .count").html(str);
  };

  Account.prototype.is_unread_tweet = function(tweet_id) {
    return tweet_id.is_bigger_than(this.max_read_id);
  };

  Account.prototype.get_twitter_configuration = function() {
    return this.twitter_request('help/configuration.json', {
      silent: true,
      async: true,
      method: "GET",
      success: function(element, data) {
        return Application.twitter_config = data;
      }
    });
  };

  Account.prototype.sign_request = function(url, method, parameters, options) {
    var key, message, value;
    if (options == null) options = {};
    message = {
      action: url,
      method: method,
      parameters: parameters
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, this.keys);
    OAuth.SignatureMethod.sign(message, this.keys);
    switch (options.return_type) {
      case "header":
        return ((function() {
          var _ref, _results;
          _ref = message.parameters;
          _results = [];
          for (key in _ref) {
            value = _ref[key];
            if (key.slice(0, 5) === "oauth") {
              _results.push("" + key + "=\"" + value + "\"");
            }
          }
          return _results;
        })()).join(", ");
      case "parameters":
        return message.parameters;
    }
    return OAuth.formEncode(message.parameters);
  };

  Account.prototype.twitter_request = function(url, options) {
    var data, method, result, verbose, _ref, _ref2, _ref3;
    method = (_ref = options.method) != null ? _ref : "POST";
    verbose = !(!!options.silent && true);
    if (verbose) $('#form').fadeTo(500, 0).delay(500);
    data = this.sign_request("https://api.twitter.com/1/" + url, method, options.parameters);
    url = "proxy/api/" + url;
    result = $.ajax({
      url: url,
      data: data,
      dataType: (_ref2 = options.dataType) != null ? _ref2 : "json",
      async: (_ref3 = options.async) != null ? _ref3 : true,
      type: method,
      success: function(data, textStatus, req) {
        if (req.status === "200" || req.status === 200) {
          if (options.success_string != null) {
            $('#success_info').html(options.success_string);
          }
          if (options.success != null) {
            options.success($('#success_info'), data, req, options.additional_info);
          }
          if (verbose) {
            return $('#success').fadeIn(500).delay(5000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          }
        } else {
          if (options.error != null) {
            options.error($('#failure_info'), data, req, "", null, options.additional_info);
          } else {
            $('#failure_info').html(data.error);
          }
          if (verbose) {
            return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          }
        }
      },
      error: function(req, textStatus, exc) {
        if (options.error != null) {
          options.error($('#failure_info'), null, req, textStatus, exc, options.additional_info);
        } else {
          $('#failure_info').html("Error " + req.status + " (" + req.statusText + ")");
        }
        if (verbose) {
          return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
            return $('#form').fadeTo(500, 1);
          });
        }
      }
    });
    if (options.return_response) return result.responseText;
  };

  Account.prototype.fill_list = function() {
    var after_run, default_parameters, error, key, parameters, request, requests, responses, success, threads_errored, threads_running, value, _i, _len, _ref, _results,
      _this = this;
    this.set_status("Filling List...", "orange");
    threads_running = 5;
    threads_errored = 0;
    responses = [];
    after_run = function() {
      if (threads_errored === 0) {
        _this.set_status("", "");
        _this.parse_data(responses);
        return _this.request.start_request();
      } else {
        setTimeout(_this.fill_list, 30000);
        return _this.add_status_html("Fehler in fill_list.<br />Nächster Versuch in 30 Sekunden.");
      }
    };
    success = function(element, data) {
      responses.push(data);
      threads_running -= 1;
      if (threads_running === 0) return after_run();
    };
    error = function(req, textStatus, exc, additional_info) {
      threads_running -= 1;
      threads_errored += 1;
      this.add_status_html("Fehler in " + additional_info.name + ":<br />" + textStatus);
      if (threads_running === 0) return after_run();
    };
    default_parameters = {
      include_rts: true,
      count: 200,
      include_entities: true,
      page: 1,
      since_id: this.max_known_tweet_id !== "0" ? this.max_known_tweet_id : void 0
    };
    requests = [
      {
        url: "statuses/home_timeline.json",
        name: "home_timeline 1"
      }, {
        url: "statuses/home_timeline.json",
        name: "home_timeline 2",
        extra_parameters: {
          page: 2
        }
      }, {
        url: "statuses/mentions.json",
        name: "mentions"
      }, {
        url: "direct_messages.json",
        name: "Received DMs",
        extra_parameters: {
          count: 100,
          since_id: this.max_known_dm_id != null ? this.max_known_dm_id : void 0
        }
      }, {
        url: "direct_messages/sent.json",
        name: "Sent DMs",
        extra_parameters: {
          count: 100,
          since_id: this.max_known_dm_id != null ? this.max_known_dm_id : void 0
        }
      }
    ];
    _results = [];
    for (_i = 0, _len = requests.length; _i < _len; _i++) {
      request = requests[_i];
      parameters = {};
      for (key in default_parameters) {
        value = default_parameters[key];
        if (value) parameters[key] = value;
      }
      _ref = request.extra_parameters;
      for (key in _ref) {
        value = _ref[key];
        if (value) parameters[key] = value;
      }
      _results.push(this.twitter_request(request.url, {
        method: "GET",
        parameters: parameters,
        dataType: "text",
        silent: true,
        additional_info: {
          name: request.name
        },
        success: success,
        error: error
      }));
    }
    return _results;
  };

  Account.prototype.parse_data = function(json) {
    var array, data, html, index, json_data, last_id, object, old_id, oldest_date, oldest_index, responses, temp, temp_elements, this_id, _i, _j, _len, _len2;
    if (json.constructor !== Array) json = [json];
    responses = [];
    for (_i = 0, _len = json.length; _i < _len; _i++) {
      json_data = json[_i];
      try {
        temp = $.parseJSON(json_data);
      } catch (_error) {}
      if (temp == null) continue;
      if (temp.constructor === Array) {
        temp = temp.reverse();
        if (temp.length > 0) {
          temp_elements = [];
          for (_j = 0, _len2 = temp.length; _j < _len2; _j++) {
            data = temp[_j];
            temp_elements.push(TwitterMessage.get_object(data, this));
          }
          responses.push(temp_elements);
        }
      } else {
        responses.push([TwitterMessage.get_object(temp, this)]);
      }
    }
    if (responses.length === 0) return;
    html = "";
    last_id = "";
    while (responses.length > 0) {
      oldest_date = null;
      oldest_index = null;
      for (index in responses) {
        array = responses[index];
        object = array[0];
        if (oldest_date === null || object.get_date() < oldest_date) {
          oldest_date = object.get_date();
          oldest_index = index;
        }
      }
      array = responses[oldest_index];
      object = array.shift();
      if (array.length === 0) responses.splice(oldest_index, 1);
      this_id = object.id;
      if (this_id !== old_id) html = object.get_html() + html;
      if (object.constructor === Tweet) {
        if (object.id.is_bigger_than(this.max_known_tweet_id)) {
          this.max_known_tweet_id = object.id;
        }
        if (object.sender.id === this.user.id && object.id.is_bigger_than(this.my_last_tweet_id)) {
          this.my_last_tweet_id = object.id;
        }
      }
      if (object.constructor === DirectMessage) {
        if (object.id.is_bigger_than(this.max_known_dm_id)) {
          this.max_known_dm_id = object.id;
        }
      }
      old_id = this_id;
    }
    this.add_html(html);
    return this.update_user_counter();
  };

  Account.prototype.scroll_to = function(tweet_id) {
    var element_top, topheight;
    element_top = $("#" + tweet_id).offset().top;
    topheight = parseInt($('#content_template').css("padding-top"));
    $(document).scrollTop(element_top - topheight);
    return false;
  };

  Account.prototype.activate = function() {
    $('.content').hide();
    $("#content_" + this.id).show();
    $('#users .user').removeClass('active');
    $("#user_" + this.id).addClass('active');
    return Application.current_account = this;
  };

  Account.prototype.set_status = function(message, color) {
    $("#user_" + this.id).removeClass('red green yellow orange').addClass(color);
    return this.status_text = message;
  };

  Account.hooks = {
    change_current_account: function(elm) {
      var account_id, acct;
      account_id = $(elm).parents('.user').data('account-id');
      acct = Application.accounts[account_id];
      acct.activate();
      return false;
    },
    mark_as_read: function(elm) {
      var element, elements, id, offset, _i, _len;
      elements = $("#content_" + Application.current_account.id + " .tweet.new");
      id = null;
      offset = $(document).scrollTop() + $('#top').height();
      for (_i = 0, _len = elements.length; _i < _len; _i++) {
        element = elements[_i];
        if ($(element).offset().top >= offset) {
          id = $(element).attr('data-tweet-id');
          break;
        }
      }
      Application.current_account.set_max_read_id(id);
      return false;
    },
    goto_my_last_tweet: function() {
      Application.current_account.scroll_to(Application.current_account.my_last_tweet_id);
      return false;
    },
    goto_unread_tweet: function() {
      Application.current_account.scroll_to(Application.current_account.max_read_id);
      return false;
    },
    reload: function() {
      Application.current_account.get_max_read_id();
      Application.current_account.request.restart();
      return false;
    }
  };

  return Account;

})();

Hooks = (function() {

  function Hooks() {}

  Hooks.display_file = false;

  Hooks.time_of_last_enter = new Date();

  Hooks.update_counter = function() {
    var color, length, now, parts, text, url, urls, _i, _len, _ref;
    if ((typeof event !== "undefined" && event !== null) && (event.type != null) && event.type === "keyup" && event.which === 13) {
      now = new Date();
      if (now - this.time_of_last_enter <= settings.timings.max_double_enter_time) {
        event.preventDefault();
        $('#text').val(this.text_before_enter);
        Hooks.send();
        return;
      }
      this.text_before_enter = $('#text').val();
      this.time_of_last_enter = now;
    }
    text = $('#text').val();
    if (!(Application.get_dm_recipient_name() != null) && (parts = text.match(/^d @?(\w+) (.*)$/i))) {
      Application.set_dm_recipient_name(parts[1]);
      text = parts[2];
      $('#text').val(text);
    }
    color = '#0b0';
    text = text.trim();
    length = text.length;
    if ($('#file')[0].files[0]) length += characters_reserved_per_media + 1;
    urls = text.match(/((https?:\/\/)(([^ :]+(:[^ ]+)?@)?[a-zäüöß0-9]([a-zäöüß0-9i\-]{0,61}[a-zäöüß0-9])?(\.[a-zäöüß0-9]([a-zäöüß0-9\-]{0,61}[a-zäöüß0-9])?){0,32}\.[a-z]{2,5}(\/[^ \"@\n]*[^" \.,;\)@\n])?))/ig);
    _ref = urls != null ? urls : [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      url = _ref[_i];
      length -= url.length;
      length += url.slice(0, 5) === "https" ? Application.twitter_config.short_url_length_https : Application.twitter_config.short_url_length;
    }
    if (length > 140) color = '#f00';
    $('#counter').html(140 - length);
    return $('#counter').css('color', color);
  };

  Hooks.send = function() {
    if (Application.get_dm_recipient_name() != null) {
      return DirectMessage.hooks.send();
    } else {
      return Tweet.hooks.send();
    }
  };

  Hooks.cancel_dm = function() {
    var receiver;
    receiver = Application.get_dm_recipient_name();
    Application.set_dm_recipient_name(null);
    return $('#text').val("@" + receiver + " " + ($('#text').val()));
  };

  Hooks.toggle_file = function(new_value) {
    if (new_value != null) {
      this.display_file = new_value;
    } else {
      this.display_file = !this.display_file;
    }
    $('#file_div').toggle(this.display_file);
    if (!this.display_file) $('#file').val('');
    return false;
  };

  Hooks.check_file = function() {
    var error, file;
    file = $('#file')[0].files[0];
    error = false;
    if (file == null) return;
    if (file.fileSize > Application.twitter_config.photo_size_limit) {
      alert("Die Datei ist zu groß.\n\nDateigröße:\t" + file.fileSize + " Bytes\nMaximum:\t" + Application.twitter_config.photo_size_limit + " Bytes");
      error = true;
    } else if ($.inArray(file.type, ["image/png", "image/gif", "image/jpeg"]) === -1) {
      alert("Der Dateityp " + file.type + " wird von Twitter nicht akzeptiert.");
      error = true;
    }
    if (error) return $('#file').val('');
  };

  return Hooks;

})();

Thumbnail = (function() {

  function Thumbnail(thumbnail, link) {
    this.thumbnail = thumbnail;
    this.link = link;
  }

  Thumbnail.prototype.get_single_thumb_html = function() {
    return "<a href='" + this.link + "' target='_blank'>			<img src='" + this.thumbnail + "' class='media' style='float: right;' />		</a>";
  };

  Thumbnail.prototype.get_multi_thumb_html = function() {
    return "<a href='" + this.link + "' target='_blank'>			<img src='" + this.thumbnail + "' />		</a>";
  };

  return Thumbnail;

})();

TwitterMessage = (function() {

  function TwitterMessage(data) {
    this.data = data;
    this.sender = new User(this.get_user_data);
  }

  TwitterMessage.prototype.get_user_data = function() {
    throw "Fehler!";
  };

  TwitterMessage.prototype.get_date = function() {
    return this.date;
  };

  TwitterMessage.get_object = function(data, account) {
    if (data == null) return;
    if ((data.text != null) && (data.recipient != null)) {
      return new DirectMessage(data, account);
    }
    if (data.direct_message != null) {
      return new DirectMessage(data.direct_message, account);
    }
    if (data.text != null) return new Tweet(data, account);
    if (data.event != null) return Event.get_object(data, account);
  };

  return TwitterMessage;

})();

Tweet = (function(_super) {

  __extends(Tweet, _super);

  Tweet.last = null;

  Tweet.prototype.mentions = [];

  Tweet.prototype.replies = [];

  Tweet.prototype.account = null;

  Tweet.prototype.thumbs = [];

  Tweet.prototype.id = null;

  Tweet.prototype.permalink = "";

  Tweet.prototype.data = {};

  Tweet.prototype.text = "";

  Tweet.prototype.entities = {};

  Tweet.prototype.date = null;

  Tweet.prototype.retweeted_by = null;

  Tweet.prototype.in_reply_to = null;

  function Tweet(data, account) {
    this.account = account;
    this.mentions = [];
    this.replies = [];
    this.thumbs = [];
    this.data = data;
    this.id = data.id_str;
    this.fill_user_variables();
    this.save_as_last_message();
    this.permalink = "https://twitter.com/" + this.sender.screen_name + "/status/" + this.id;
    this.account.tweets[this.id] = this;
    this.text = data.retweeted_status != null ? data.retweeted_status.text : data.text;
    this.entities = data.retweeted_status != null ? data.retweeted_status.entities : data.entities;
    this.linkify_text();
    this.get_thumbnails();
    this.date = new Date(this.data.created_at);
    this.add_to_collections();
  }

  Tweet.prototype.add_to_collections = function() {
    var tweet;
    Application.all_tweets[this.id] = this;
    if (this.data.in_reply_to_status_id_str) {
      tweet = Application.all_tweets[this.data.in_reply_to_status_id_str];
      this.in_reply_to = tweet;
      if (tweet != null) return tweet.replies.push(this);
    }
  };

  Tweet.prototype.fill_user_variables = function() {
    if (this.data.retweeted_status != null) {
      this.sender = new User(this.data.retweeted_status.user);
      return this.retweeted_by = new User(this.data.user);
    } else {
      return this.sender = new User(this.data.user);
    }
  };

  Tweet.prototype.save_as_last_message = function() {
    return Tweet.last = this;
  };

  Tweet.prototype.get_date = function() {
    return this.date;
  };

  Tweet.prototype.div_id = function() {
    return "#tweet_" + this.id;
  };

  Tweet.prototype.get_html = function() {
    return ("<div id='" + this.id + "' class='" + (this.get_classes().join(" ")) + "' data-tweet-id='" + this.id + "' data-account-id='" + this.account.id + "'>") + this.get_single_thumb_html() + this.get_sender_html() + ("<span class='text'>" + this.text + "</span>") + this.get_multi_thumb_html() + this.get_permanent_info_html() + this.get_overlay_html() + "<div style='clear: both;'></div>" + "</div>";
  };

  Tweet.prototype.get_sender_html = function() {
    return this.sender.get_avatar_html() + this.sender.get_link_html();
  };

  Tweet.prototype.get_permanent_info_html = function() {
    return this.get_retweet_html() + this.get_place_html();
  };

  Tweet.prototype.get_overlay_html = function() {
    return "<div class='overlay'>" + this.get_temporary_info_html() + this.get_buttons_html() + "</div>";
  };

  Tweet.prototype.get_temporary_info_html = function() {
    return "<div class='info'>" + ("<a href='" + this.permalink + "' target='_blank'>" + (this.date.format("%d.%m.%Y %H:%M")) + "</a> " + (this.get_reply_to_info_html()) + " " + (this.get_source_html())) + "</div>";
  };

  Tweet.prototype.get_buttons_html = function() {
    return "<a href='#' onClick='return Tweet.hooks.reply(this);'><img src='icons/comments.png' title='Reply' /></a>" + "<a href='#' onClick='return Tweet.hooks.retweet(this);'><img src='icons/arrow_rotate_clockwise.png' title='Retweet' /></a>" + "<a href='#' onClick='return Tweet.hooks.quote(this);'><img src='icons/tag.png' title='Quote' /></a>" + ("<a href='" + this.permalink + "' target='_blank'><img src='icons/link.png' title='Permalink' /></a>") + (this.data.coordinates != null ? "<a href='http://maps.google.com/?q=" + this.data.coordinates.coordinates[1] + "," + this.data.coordinates.coordinates[0] + "' target='_blank'><img src='icons/world.png' title='Geotag' /></a>" : "") + (this.data.coordinates != null ? "<a href='http://maps.google.com/?q=http%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fuser_timeline%2F" + this.sender.screen_name + ".atom%3Fcount%3D250' target='_blank'><img src='icons/world_add.png' title='All Geotags' /></a>" : "") + (this.account.screen_name === this.sender.screen_name ? "<a href='#' onClick='return Tweet.hooks.delete(this);'><img src='icons/cross.png' title='Delete' /></a>" : "") + (this.account.screen_name !== this.sender.screen_name ? "<a href='#' onClick='return Tweet.hooks.report_as_spam(this);'><img src='icons/exclamation.png' title='Block and report as spam' /></a>" : "");
  };

  Tweet.prototype.get_single_thumb_html = function() {
    if (this.thumbs.length !== 1) return "";
    return this.thumbs[0].get_single_thumb_html();
  };

  Tweet.prototype.get_multi_thumb_html = function() {
    var html, thumb, _i, _len, _ref;
    if (!(this.thumbs.length > 1)) return "";
    html = "<div class='media'>";
    _ref = this.thumbs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      thumb = _ref[_i];
      html += thumb.get_multi_thumb_html();
    }
    html += "</div>";
    return html;
  };

  Tweet.prototype.get_source_html = function() {
    var obj;
    if (this.data.source == null) return "";
    obj = $(this.data.source);
    if (obj.attr('href')) {
      return "from <a href='" + (obj.attr('href')) + "' target='_blank'>" + (obj.html()) + "</a>";
    }
    return "from " + this.data.source;
  };

  Tweet.prototype.get_retweet_html = function() {
    if (this.retweeted_by == null) return "";
    return "<div class='retweet_info'>Retweeted by <a href='" + this.retweeted_by.permalink + "' target='_blank'>" + this.retweeted_by.screen_name + "</a></div>";
  };

  Tweet.prototype.get_place_html = function() {
    if (this.data.place == null) return "";
    return "<div class='place'>from <a href='http://twitter.com/#!/places/" + this.data.place.id + "' target='_blank'>" + this.data.place.full_name + "</a></div>";
  };

  Tweet.prototype.get_reply_to_info_html = function() {
    if (this.data.in_reply_to_status_id == null) return "";
    return "<a href='#' onClick='return Tweet.hooks.show_replies(this);'>in reply to...</a> ";
  };

  Tweet.prototype.linkify_text = function() {
    var all_entities, entities, entity, entity_type, _i, _j, _len, _len2, _ref;
    if (this.entities != null) {
      all_entities = [];
      _ref = this.entities;
      for (entity_type in _ref) {
        entities = _ref[entity_type];
        for (_i = 0, _len = entities.length; _i < _len; _i++) {
          entity = entities[_i];
          entity.type = entity_type;
          all_entities.push(entity);
        }
      }
      all_entities = all_entities.sort(function(a, b) {
        return a.indices[0] - b.indices[0];
      }).reverse();
      for (_j = 0, _len2 = all_entities.length; _j < _len2; _j++) {
        entity = all_entities[_j];
        switch (entity.type) {
          case "user_mentions":
            this.mentions.push(entity.screen_name);
            this.replace_entity(entity, "<a href='https://twitter.com/" + entity.screen_name + "' target='_blank'>@" + entity.screen_name + "</a>");
            break;
          case "urls":
          case "media":
            if (entity.expanded_url != null) {
              this.replace_entity(entity, "<a href='" + entity.expanded_url + "' class='external' target='_blank'>" + entity.display_url + "</a>");
            } else {
              this.replace_entity(entity, "<a href='" + entity.url + "' class='external' target='_blank'>" + entity.url + "</a>");
            }
            break;
          case "hashtags":
            this.replace_entity(entity, "<a href='https://twitter.com/search?q=#" + entity.text + "' target='_blank'>#" + entity.text + "</a>");
            Application.add_to_autocomplete("#" + entity.text);
        }
      }
    }
    return this.text = this.text.trim().replace(/\n/g, "<br />");
  };

  Tweet.prototype.replace_entity = function(entity_object, text) {
    return this.text = this.text.slice(0, entity_object.indices[0]) + text + this.text.slice(entity_object.indices[1]);
  };

  Tweet.prototype.get_classes = function() {
    var classes, mention, _i, _len, _ref, _ref2;
    classes = ["tweet", "by_" + this.data.user.screen_name, this.account.is_unread_tweet(this.id) ? "new" : void 0, (_ref = this.account.screen_name, __indexOf.call(this.mentions, _ref) >= 0) ? "mentions_this_user" : void 0, this.account.screen_name === this.sender.screen_name ? "by_this_user" : void 0];
    _ref2 = this.mentions;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      mention = _ref2[_i];
      classes.push("mentions_" + mention);
    }
    return classes;
  };

  Tweet.prototype.retweet = function() {
    if (!confirm("Wirklich retweeten?")) return;
    return this.account.twitter_request("statuses/retweet/" + this.id + ".json", {
      success_string: "Retweet erfolgreich"
    });
  };

  Tweet.prototype.quote = function() {
    $('#text').val("RT @" + this.sender.screen_name + ": " + this.text).focus();
    return Application.reply_to(this);
  };

  Tweet.prototype["delete"] = function() {
    if (!confirm("Wirklich diesen Tweet löschen?")) return;
    return this.account.twitter_request("statuses/destroy/" + this.id + ".json", {
      success_string: "Tweet gelöscht",
      success: function() {
        return $(this.div_id()).remove();
      }
    });
  };

  Tweet.prototype.report_as_spam = function() {
    return this.sender.report_as_spam(this.account);
  };

  Tweet.prototype.reply = function() {
    var mention, mentions, sender;
    Application.set_dm_recipient_name(null);
    $('#text').val('').focus();
    Application.reply_to(this);
    sender = this.sender.screen_name !== this.account.screen_name ? "@" + this.sender.screen_name + " " : "";
    mentions = ((function() {
      var _i, _len, _ref, _results;
      _ref = this.mentions.reverse();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mention = _ref[_i];
        if (mention !== this.sender.screen_name && mention !== this.account.screen_name) {
          _results.push("@" + mention + " ");
        }
      }
      return _results;
    }).call(this)).join("");
    $('#text').val("" + sender + mentions);
    $('#text')[0].selectionStart = sender.length;
    $('#text')[0].selectionEnd = sender.length + mentions.length;
    return $('#text').focus();
  };

  Tweet.prototype.get_thumbnails = function() {
    var entity, media, res, url, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
    if (this.data.entities == null) return;
    if (this.data.entities.media != null) {
      _ref = this.data.entities.media;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        media = _ref[_i];
        this.thumbs.push(new Thumbnail("" + media.media_url_https + ":thumb", media.expanded_url));
      }
    }
    if (this.data.entities.urls != null) {
      _ref2 = this.data.entities.urls;
      _results = [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        entity = _ref2[_j];
        url = (_ref3 = entity.expanded_url) != null ? _ref3 : entity.url;
        if ((res = url.match(/(?:http:\/\/(?:www\.)youtube.com\/.*v=|http:\/\/youtu.be\/)([0-9a-zA-Z_]+)/))) {
          this.thumbs.push(new Thumbnail("http://img.youtube.com/" + res[1] + "/1.jpg", url));
        }
        if ((res = url.match(/twitpic.com\/([0-9a-zA-Z]+)/))) {
          this.thumbs.push(new Thumbnail("http://twitpic.com/show/mini/" + res[1], url));
        }
        if ((res = url.match(/yfrog.com\/([a-zA-Z0-9]+)/))) {
          this.thumbs.push(new Thumbnail("http://yfrog.com/" + res[1] + ".th.jpg", url));
        }
        if ((res = url.match(/lockerz.com\/s\/[0-9]+/))) {
          this.thumbs.push(new Thumbnail("http://api.plixi.com/api/tpapi.svc/imagefromurl?url=" + url + "&size=thumbnail", url));
        }
        if ((res = url.match(/moby\.to\/([a-zA-Z0-9]+)/))) {
          this.thumbs.push(new Thumbnail("http://moby.to/" + res[1] + ":square", url));
        }
        if ((res = url.match(/ragefac\.es\/(?:mobile\/)?([0-9]+)/))) {
          this.thumbs.push(new Thumbnail("http://ragefac.es/" + res[1] + "/i", url));
        }
        if ((res = url.match(/lauerfac\.es\/([0-9]+)/))) {
          this.thumbs.push(new Thumbnail("http://lauerfac.es/" + res[1] + "/thumb", url));
        }
        if ((res = url.match(/ponyfac\.es\/([0-9]+)/))) {
          _results.push(this.thumbs.push(new Thumbnail("http://ponyfac.es/" + res[1] + "/thumb", url)));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  };

  Tweet.prototype.show_replies = function() {
    var html, new_id, tweet;
    html = "";
    tweet = this;
    while (true) {
      html += tweet.get_html();
      if (tweet.data.in_reply_to_status_id_str == null) break;
      new_id = tweet.data.in_reply_to_status_id_str;
      tweet = this.account.tweets[new_id];
      if (tweet == null) {
        html += '<div id="info_spinner"><img src="icons/spinner_big.gif" /></div>';
        this.fetch_reply(new_id);
        break;
      }
    }
    return Application.infoarea.show("Replies", html);
  };

  Tweet.prototype.fetch_reply = function(id) {
    var _this = this;
    return this.account.twitter_request('statuses/show.json', {
      parameters: {
        id: id,
        include_entities: true
      },
      silent: true,
      method: "GET",
      success: function(foo, data) {
        var tweet;
        tweet = new Tweet(data, _this.account);
        $('#info_spinner').before(tweet.get_html());
        if (Application.infoarea.visible && tweet.data.in_reply_to_status_id_str) {
          return _this.fetch_reply(tweet.data.in_reply_to_status_id_str);
        } else {
          return $('#info_spinner').remove();
        }
      }
    });
  };

  Tweet.hooks = {
    get_tweet: function(element) {
      var tweet_div;
      tweet_div = $(element).parents('.tweet');
      return Application.accounts[tweet_div.attr('data-account-id')].get_tweet(tweet_div.attr('data-tweet-id'));
    },
    reply: function(elm) {
      this.get_tweet(elm).reply();
      return false;
    },
    retweet: function(elm) {
      this.get_tweet(elm).retweet();
      return false;
    },
    quote: function(elm) {
      this.get_tweet(elm).quote();
      return false;
    },
    "delete": function(elm) {
      this.get_tweet(elm)["delete"]();
      return false;
    },
    report_as_spam: function(elm) {
      this.get_tweet(elm).report_as_spam();
      return false;
    },
    show_replies: function(elm) {
      this.get_tweet(elm).show_replies();
      return false;
    },
    send: function() {
      var content_type, data, key, parameters, place, placeindex, url, value;
      if (typeof event !== "undefined" && event !== null) event.preventDefault();
      parameters = {
        status: $('#text').val().trim(),
        wrap_links: true
      };
      if (settings.places.length > 0 && (placeindex = document.tweet_form.place.value - 1) >= 0) {
        place = settings.places[placeindex];
        parameters.lat = place.lat + (((Math.random() * 300) - 15) * 0.000001);
        parameters.lon = place.lon + (((Math.random() * 300) - 15) * 0.000001);
        if (place.place_id != null) parameters.place_id = place.place_id;
        parameters.display_coordinates = true;
      }
      if (Application.reply_to() != null) {
        parameters.in_reply_to_status_id = Application.reply_to().id;
      }
      if ($('#file')[0].files[0]) {
        data = Application.current_account.sign_request("https://upload.twitter.com/1/statuses/update_with_media.json", "POST", null);
        url = "proxy/upload/statuses/update_with_media.json?" + data;
        content_type = false;
        data = new FormData();
        data.append("media[]", $('#file')[0].files[0]);
        for (key in parameters) {
          value = parameters[key];
          data.append(key, value);
        }
      } else {
        data = Application.current_account.sign_request("https://api.twitter.com/1/statuses/update.json", "POST", parameters);
        url = "proxy/api/statuses/update.json";
        content_type = "application/x-www-form-urlencoded";
      }
      $('#form').fadeTo(500, 0);
      $.ajax({
        url: url,
        data: data,
        processData: false,
        contentType: content_type,
        async: true,
        dataType: "json",
        type: "POST",
        success: function(data) {
          var html;
          if (data.text) {
            html = "							Tweet-ID: " + data.id_str + "<br />							Mein Tweet Nummer: " + data.user.statuses_count + "<br />							Follower: " + data.user.followers_count + "<br />							Friends: " + data.user.friends_count + "<br />";
            $('#text').val('');
            Application.reply_to(null);
            Hooks.toggle_file(false);
            $('#success_info').html(html);
            return $('#success').fadeIn(500).delay(2000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          } else {
            $('#failure_info').html(data.error);
            return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          }
        },
        error: function(req) {
          var additional, info;
          info = "Error " + req.status + " (" + req.statusText + ")";
          try {
            additional = $.parseJSON(req.responseText);
          } catch (_error) {}
          if ((additional != null ? additional.error : void 0) != null) {
            info += "<br /><strong>" + additional.error + "</strong>";
          }
          $('#failure_info').html(info);
          return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
            return $('#form').fadeTo(500, 1);
          });
        }
      });
      return false;
    }
  };

  return Tweet;

})(TwitterMessage);

DirectMessage = (function(_super) {

  __extends(DirectMessage, _super);

  function DirectMessage() {
    DirectMessage.__super__.constructor.apply(this, arguments);
  }

  DirectMessage.prototype.recipient = null;

  DirectMessage.prototype.add_to_collections = function() {
    return Application.all_dms[this.id] = this;
  };

  DirectMessage.prototype.fill_user_variables = function() {
    this.sender = new User(this.data.sender);
    return this.recipient = new User(this.data.recipient);
  };

  DirectMessage.prototype.save_as_last_message = function() {
    return DirectMessage.last = this;
  };

  DirectMessage.prototype.get_classes = function() {
    return ["dm", "by_" + (this.sender.get_screen_name())];
  };

  DirectMessage.prototype.reply = function() {
    $('#text').val('').focus();
    return Application.set_dm_recipient_name(this.sender.screen_name !== this.account.screen_name ? this.sender.screen_name : this.recipient.screen_name);
  };

  DirectMessage.prototype.get_buttons_html = function() {
    return "<a href='#' onClick='return DirectMessage.hooks.reply(this);'><img src='icons/comments.png' title='Reply' /></a>" + (this.account.screen_name !== this.sender.screen_name ? "<a href='#' onClick='return Tweet.hooks.report_as_spam(this);'><img src='icons/exclamation.png' title='Block and report as spam' /></a>" : "");
  };

  DirectMessage.prototype.get_sender_html = function() {
    if (this.account.screen_name === this.sender.screen_name) {
      return this.sender.get_avatar_html() + "to " + this.recipient.get_link_html();
    } else {
      return this.sender.get_avatar_html() + this.sender.get_link_html();
    }
  };

  DirectMessage.hooks = {
    get_tweet: function(element) {
      var tweet_div;
      tweet_div = $(element).parents('.dm');
      return Application.accounts[tweet_div.attr('data-account-id')].get_tweet(tweet_div.attr('data-tweet-id'));
    },
    send: function() {
      var data, parameters, url;
      if (typeof event !== "undefined" && event !== null) event.preventDefault();
      parameters = {
        text: $('#text').val().trim(),
        wrap_links: true,
        screen_name: Application.get_dm_recipient_name()
      };
      data = Application.current_account.sign_request("https://api.twitter.com/1/direct_messages/new.json", "POST", parameters);
      url = "proxy/api/direct_messages/new.json";
      $('#form').fadeTo(500, 0);
      return $.ajax({
        url: url,
        data: data,
        async: true,
        dataType: "json",
        type: "POST",
        success: function(data) {
          if (data.recipient) {
            $('#text').val('');
            Application.reply_to(null);
            Application.set_dm_recipient_name(null);
            Hooks.toggle_file(false);
            $('#success_info').html("DM erfolgreich verschickt.");
            return $('#success').fadeIn(500).delay(2000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          } else {
            $('#failure_info').html(data.error);
            return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
              return $('#form').fadeTo(500, 1);
            });
          }
        },
        error: function(req) {
          var additional, info;
          info = "Error " + req.status + " (" + req.statusText + ")";
          try {
            additional = $.parseJSON(req.responseText);
          } catch (_error) {}
          if ((additional != null ? additional.error : void 0) != null) {
            info += "<br /><strong>" + additional.error + "</strong>";
          }
          $('#failure_info').html(info);
          return $('#failure').fadeIn(500).delay(2000).fadeOut(500, function() {
            return $('#form').fadeTo(500, 1);
          });
        }
      });
    },
    reply: function(elm) {
      this.get_tweet(elm).reply();
      return false;
    }
  };

  return DirectMessage;

})(Tweet);

User = (function() {

  User.id = "0";

  User.permalink = "";

  User.screen_name = "";

  function User(data) {
    this.data = data;
    this.id = this.data.id_str;
    Application.users[this.id] = this;
    this.screen_name = this.data.screen_name;
    Application.add_to_autocomplete("@" + this.screen_name);
    this.permalink = "https://twitter.com/" + this.screen_name;
  }

  User.prototype.id = function() {
    return this.data.id_str;
  };

  User.prototype.get_avatar_html = function() {
    return "<span class='avatar'>			<span class='tooltip_info'>				<strong>" + this.data.name + "</strong><br /><br />				" + this.data.followers_count + " Follower<br />				" + this.data.friends_count + " Friends<br />				" + this.data.statuses_count + " Tweets			</span>			<a href='https://twitter.com/account/profile_image/" + this.data.screen_name + "' target='_blank'>				<img class='user_avatar' src='" + this.data.profile_image_url + "' />			</a>		</span>";
  };

  User.prototype.get_link_html = function(show_full_name) {
    if (show_full_name == null) show_full_name = false;
    return "		<span class='poster'>			<a href='https://twitter.com/" + this.data.screen_name + "' target='_blank'>				" + this.data.screen_name + "			</a>			" + (show_full_name ? " (" + this.data.name + ")" : "") + "			</span>";
  };

  User.prototype.get_screen_name = function() {
    return this.data.screen_name;
  };

  User.prototype.report_as_spam = function(account) {
    if (!confirm("Wirklich " + this.screen_name + " als Spammer melden?")) return;
    return account.twitter_request("report_spam.json", {
      parameters: {
        screen_name: this.screen_name
      },
      success_string: "Als Spammer gemeldet.",
      success: function() {
        return $(".by_" + this.screen_name).remove();
      }
    });
  };

  return User;

})();

Request = (function() {

  Request.prototype.account = null;

  Request.prototype.last_data_received_at = null;

  function Request(account) {
    this.account = account;
  }

  return Request;

})();

StreamRequest = (function(_super) {

  __extends(StreamRequest, _super);

  StreamRequest.prototype.connected = false;

  StreamRequest.prototype.buffer = "";

  StreamRequest.prototype.response_offset = 0;

  StreamRequest.prototype.request = null;

  StreamRequest.prototype.processing = false;

  StreamRequest.prototype.connection_started_at = null;

  StreamRequest.prototype.last_data_received_at = null;

  StreamRequest.prototype.timeout_timer = null;

  StreamRequest.prototype.timeout_at = null;

  StreamRequest.prototype.last_event_times = [];

  StreamRequest.prototype.opera_interval = null;

  StreamRequest.prototype.delay = 300;

  StreamRequest.prototype.stopped = false;

  function StreamRequest(account) {
    this.timeout = __bind(this.timeout, this);    StreamRequest.__super__.constructor.call(this, account);
    this.delay = settings.timings.mindelay;
  }

  StreamRequest.prototype.toString = function() {
    return "StreamReq " + this.account.user.screen_name;
  };

  StreamRequest.prototype.clear_timeout = function() {
    if (this.timeout_timer != null) {
      window.clearTimeout(this.timeout_timer);
      return this.timeout_timer = null;
    }
  };

  StreamRequest.prototype.set_timeout = function(delay) {
    this.clear_timeout();
    this.timeout_timer = window.setTimeout(this.timeout, delay);
    this.timeout_at = new Date(new Date().getTime() + delay);
    return Application.log(this, "set_timeout", "Delay: " + delay + ", target: " + (this.timeout_at.format("%H:%M:%S")));
  };

  StreamRequest.prototype.stop_request = function() {
    this.stopped = true;
    if (this.request != null) return this.request.abort();
  };

  StreamRequest.prototype.restart = function() {
    if (this.request != null) return this.request.abort();
  };

  StreamRequest.prototype.start_request = function() {
    var data, url,
      _this = this;
    this.stop_request();
    this.stopped = false;
    this.account.set_status("Connecting to stream...", "orange");
    Application.log(this, "start_request", "Delay: " + this.delay);
    this.last_event_times = [];
    this.set_timeout(settings.timeout_maximum_delay * 1000);
    this.processing = false;
    this.buffer = "";
    this.response_offset = 0;
    this.connected = false;
    this.connection_started_at = new Date();
    data = this.account.sign_request("https://userstream.twitter.com/2/user.json", "GET", {
      delimited: "length",
      include_entities: "1",
      include_rts: "1"
    });
    url = "user_proxy?" + data;
    this.request = new XMLHttpRequest();
    this.request.open("GET", url, true);
    this.request.onreadystatechange = function() {
      _this.last_data_received_at = new Date();
      switch (_this.request.readyState) {
        case 3:
          if (!_this.connected) _this.account.set_status("Connected.", "green");
          _this.connected = true;
          break;
        case 4:
          _this.account.set_status("Disconnected", "red");
          _this.connected = false;
          if ((new Date()).getTime() - _this.connection_started_at.getTime() > 60000) {
            _this.delay = settings.timings.mindelay;
          }
          if (!_this.stopped) {
            _this.account.add_status_html("Disconnect.<br>Grund: " + _this.request.statusText + "<br>Delay: " + _this.delay + " Sekunden");
          }
          Application.log(_this, "onreadystatechange", "Disconnect. Delay jetzt: " + _this.delay);
          if (!_this.stopped) {
            window.setTimeout(_this.account.fill_list, _this.delay * 1000);
          }
          _this.delay = _this.delay * 2;
          _this.stopped = false;
      }
      _this.buffer += _this.request.responseText.substr(_this.response_offset);
      if (_this.buffer.charAt(_this.buffer.length - 1) === "\r") {
        _this.buffer += "\n";
      }
      _this.response_offset = _this.request.responseText.length;
      return _this.process_buffer();
    };
    this.request.send(null);
    if (this.opera_interval != null) window.clearInterval(this.opera_interval);
    if (window.opera) {
      return this.opera_interval = window.setInterval(this.request.onreadystatechange, 5000);
    }
  };

  StreamRequest.prototype.timeout = function() {
    Application.log(this, "Timeout", "Timeout reached.");
    this.account.add_status_html("Timeout vermutet.");
    this.stop_request();
    return this.account.fill_list();
  };

  StreamRequest.prototype.process_buffer = function() {
    var average_tweet_delay, len, parseable_text, regex, res, targeted_delay;
    if (this.processing) return;
    this.processing = true;
    regex = /^[\r\n]*([0-9]+)\r\n([\s\S]+)$/;
    while (res = this.buffer.match(regex)) {
      len = parseInt(res[1]);
      if (res[2].length < len) break;
      parseable_text = res[2].substr(0, len);
      this.buffer = res[2].substr(len);
      try {
        this.account.parse_data(parseable_text);
      } catch (_error) {}
      this.last_event_times.unshift(new Date());
      if (this.last_event_times.length > (settings.timeout_detect_tweet_count + 1)) {
        this.last_event_times.pop();
      }
      if (this.last_event_times.length >= 2) {
        average_tweet_delay = (this.last_event_times[0] - this.last_event_times[this.last_event_times.length - 1]) / (this.last_event_times.length - 1);
        targeted_delay = average_tweet_delay * settings.timeout_detect_factor;
        if (settings.timeout_minimum_delay * 1000 > targeted_delay) {
          targeted_delay = settings.timeout_minimum_delay * 1000;
        }
        if (settings.timeout_maximum_delay * 1000 < targeted_delay) {
          targeted_delay = settings.timeout_maximum_delay * 1000;
        }
        this.set_timeout(this.last_event_times[0].getTime() + targeted_delay - (new Date()).getTime());
      } else {
        this.set_timeout(settings.timeout_maximum_delay * 1000);
      }
    }
    return this.processing = false;
  };

  return StreamRequest;

})(Request);

PullRequest = (function(_super) {

  __extends(PullRequest, _super);

  function PullRequest() {
    PullRequest.__super__.constructor.apply(this, arguments);
  }

  PullRequest.prototype.start_request = function() {
    return window.setTimeout(this.account.fill_list, 300000);
  };

  PullRequest.prototype.stop_request = function() {
    return this.account.fill_list();
  };

  PullRequest.prototype.restart = function() {
    return this.stop_request();
  };

  return PullRequest;

})(Request);

Event = (function(_super) {

  __extends(Event, _super);

  Event.prototype.get_user_data = function() {
    return this.source;
  };

  Event.prototype.get_html = function() {
    return "		<div class='status'>			" + (this.source.get_avatar_html()) + "			" + (this.get_inner_html()) + "		</div>	";
  };

  Event.prototype.get_inner_html = function() {
    return alert("get_inner_html should be overwritten!");
  };

  Event.prototype.id = null;

  function Event(data, account) {
    this.data = data;
    this.account = account;
    this.target = new User(this.data.target);
    this.source = new User(this.data.source);
    this.date = new Date(this.data.created_at);
  }

  Event.get_object = function(data, account) {
    switch (data.event) {
      case "follow":
        return new FollowEvent(data, account);
      case "favorite":
        return new FavoriteEvent(data, account);
      case "list_member_added":
        return new ListMemberAddedEvent(data, account);
      case "list_member_removed":
        return new ListMemberRemovedEvent(data, account);
      case "block":
      case "user_update":
      case "unfavorite":
        return new HiddenEvent(data, account);
      default:
        return new UnknownElement(data, account);
    }
  };

  return Event;

})(TwitterMessage);

FollowEvent = (function(_super) {

  __extends(FollowEvent, _super);

  function FollowEvent() {
    FollowEvent.__super__.constructor.apply(this, arguments);
  }

  FollowEvent.prototype.get_inner_html = function() {
    if (this.source.id === this.account.user.id) return "";
    return "Neuer Follower: " + (this.source.get_link_html(true));
  };

  return FollowEvent;

})(Event);

FavoriteEvent = (function(_super) {

  __extends(FavoriteEvent, _super);

  function FavoriteEvent() {
    FavoriteEvent.__super__.constructor.apply(this, arguments);
  }

  FavoriteEvent.prototype.get_inner_html = function() {
    return "" + (this.source.get_link_html(true)) + " favorisierte:<br />" + this.data.text;
  };

  return FavoriteEvent;

})(Event);

ListMemberAddedEvent = (function(_super) {

  __extends(ListMemberAddedEvent, _super);

  function ListMemberAddedEvent() {
    ListMemberAddedEvent.__super__.constructor.apply(this, arguments);
  }

  ListMemberAddedEvent.prototype.get_inner_html = function() {
    return "		" + (this.source.get_link_html(true)) + " fügte dich zu einer Liste hinzu:<br />		<a href='https://twitter.com" + this.data.target_object.uri + "' target='_blank'>" + this.data.target_object.full_name + "</a><br />		(" + target_object.members_count + " Members, " + event.target_object.subscriber_count + " Subscribers)";
  };

  return ListMemberAddedEvent;

})(Event);

ListMemberRemovedEvent = (function(_super) {

  __extends(ListMemberRemovedEvent, _super);

  function ListMemberRemovedEvent() {
    ListMemberRemovedEvent.__super__.constructor.apply(this, arguments);
  }

  ListMemberRemovedEvent.prototype.get_inner_html = function() {
    return "		" + (this.source.get_link_html(true)) + " entfernte dich von einer Liste:<br />		<a href='https://twitter.com" + this.data.target_object.uri + "' target='_blank'>" + this.data.target_object.full_name + "</a><br />		(" + target_object.members_count + " Members, " + event.target_object.subscriber_count + " Subscribers)";
  };

  return ListMemberRemovedEvent;

})(Event);

HiddenEvent = (function(_super) {

  __extends(HiddenEvent, _super);

  function HiddenEvent() {
    HiddenEvent.__super__.constructor.apply(this, arguments);
  }

  HiddenEvent.prototype.get_html = function() {
    return "";
  };

  return HiddenEvent;

})(Event);

UnknownEvent = (function(_super) {

  __extends(UnknownEvent, _super);

  function UnknownEvent() {
    UnknownEvent.__super__.constructor.apply(this, arguments);
  }

  UnknownEvent.prototype.get_inner_html = function() {
    return "		" + (this.source.get_link_html(true)) + " löste folgendes, unbekanntes Event namens " + this.data.event + " aus:<br />		" + (this.data.toString());
  };

  return UnknownEvent;

})(Event);

Application = (function() {

  function Application() {}

  Application.users = {};

  Application.all_tweets = {};

  Application.all_dms = {};

  Application.accounts = [];

  Application.expected_settings_version = 12;

  Application.current_account = null;

  Application.twitter_config = {};

  Application.autocompletes = [];

  Application.start = function() {
    Application.log(this, "", "Starting...");
    if (!this.is_settings_version_okay()) return;
    this.fill_places();
    this.attach_hooks();
    this.initialize_accounts();
    this.get_twitter_configuration();
    return this.accounts[0].activate();
  };

  Application.is_settings_version_okay = function() {
    if (settings.version !== this.expected_settings_version) {
      alert("settings.js veraltet.\nErwartet: " + expected_settings_version + "\nGegeben: " + settings.version);
      return false;
    }
    return true;
  };

  Application.fill_places = function() {
    var id, p, place, _len, _ref;
    if (settings.places.length === 0) {
      return $('#place').remove();
    } else {
      p = $('#place')[0];
      p.options[0] = new Option("-- leer --", 0);
      _ref = settings.places;
      for (id = 0, _len = _ref.length; id < _len; id++) {
        place = _ref[id];
        p.options[p.options.length] = new Option(place.name, id + 1);
      }
      if ($.cookie('last_place')) {
        return $("#place option[value='" + ($.cookie('last_place')) + "']").attr('selected', true);
      }
    }
  };

  Application.attach_hooks = function() {
    var _this = this;
    $('#place').change(function() {
      return $.cookie('last_place', $('#place option:selected').val(), {
        expires: 365
      });
    });
    $('#file').change(Hooks.check_file);
    return $('#text').autocomplete({
      minLength: 1,
      source: function(request, response) {
        var word;
        word = request.term.split(/\s+/).pop();
        if (request.term.match(/^d @?[a-z0-9_]+$/i)) word = '@' + word;
        if (word[0] !== "@" && word[0] !== "#") {
          return response(new Array());
        } else {
          return response($.ui.autocomplete.filter(_this.autocompletes, word));
        }
      },
      focus: function() {
        return false;
      },
      autoFocus: true,
      delay: 0,
      appendTo: "#autocomplete_area",
      select: function(event, ui) {
        var term;
        term = this.value.split(/\s+/).pop();
        this.value = this.value.substring(0, this.value.length - term.length) + ui.item.value + " ";
        return false;
      }
    });
  };

  Application.initialize_accounts = function() {
    var acct, data, id, _len, _ref, _results;
    _ref = settings.twitter.users;
    _results = [];
    for (id = 0, _len = _ref.length; id < _len; id++) {
      data = _ref[id];
      acct = new Account(id);
      _results.push(this.accounts[id] = acct);
    }
    return _results;
  };

  Application.get_twitter_configuration = function() {
    return this.accounts[0].get_twitter_configuration();
  };

  Application.get_dm_recipient_name = function() {
    return this.sending_dm_to;
  };

  Application.set_dm_recipient_name = function(recipient_name) {
    this.sending_dm_to = recipient_name;
    if (recipient_name != null) {
      Hooks.toggle_file(false);
      $('#dm_info_text').html("DM @" + recipient_name);
      $('#dm_info').show();
      $('#place').hide();
      return $('#file_choose').hide();
    } else {
      $('#dm_info').hide();
      $('#place').show();
      return $('#file_choose').show();
    }
  };

  Application.reply_to = function(tweet) {
    if (tweet == null) return this.reply_to_tweet;
    return this.reply_to_tweet = tweet;
  };

  Application.toString = function() {
    return "Application";
  };

  Application.is_sending_dm = function() {
    return this.sending_dm_to != null;
  };

  Application.log = function(place, category, message) {
    var place_str;
    if (!(settings.debug && (typeof console !== "undefined" && console !== null) && (console.log != null))) {
      return;
    }
    place_str = typeof place === "string" ? place : (place.toString != null ? place.toString() : "----");
    return console.log("" + ((new Date()).format("%H:%M:%S")) + " [" + (place_str.pad(25)) + "][" + (category.pad(15)) + "] " + message);
  };

  Application.add_to_autocomplete = function(term) {
    if ($.inArray(term, this.autocompletes) === -1) {
      this.autocompletes.push(term);
      return this.autocompletes.sort();
    }
  };

  Application.infoarea = {
    visible: false,
    show: function(title, content) {
      Application.infoarea.visible = true;
      $('#infoarea_title').html(title);
      $('#infoarea_content').html(content);
      $('#infoarea').show();
      return false;
    },
    hide: function() {
      Application.infoarea.visible = false;
      $('#infoarea').hide();
      return false;
    }
  };

  return Application;

})();
