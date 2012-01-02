var Account, Application, Hooks, PullRequest, Request, StreamRequest, Thumbnail, Tweet, TwitterMessage, User,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
  __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Account = (function() {

  Account.prototype.screen_name = null;

  Account.prototype.max_read_id = "0";

  Account.prototype.max_known_id = "0";

  Account.prototype.max_known_dm_id = "0";

  Account.prototype.tweets = {};

  Account.prototype.id = null;

  Account.prototype.user_data = null;

  Account.prototype.request = null;

  Account.prototype.keys = {};

  function Account(settings_id) {
    this.id = settings_id;
    this.keys = {
      consumerKey: settings.twitter.consumerKey,
      consumerSecret: settings.twitter.consumerSecret,
      token: settings.twitter.users[settings_id].token,
      tokenSecret: settings.twitter.users[settings_id].tokenSecret
    };
    this.validate_credentials();
    this.request = settings.twitter.users[settings_id].stream != null ? new StreamRequest(this) : new PullRequest(this);
    this.fill_list();
  }

  Account.prototype.my_element = function() {
    return $("#content_" + (this.id()));
  };

  Account.prototype.set_max_read_id = function() {};

  Account.prototype.get_max_read_id = function() {};

  Account.prototype.mark_as_read = function() {};

  Account.prototype.get_content_div_id = function() {
    return "content_" + (this.get_id());
  };

  Account.prototype.validate_credentials = function() {
    var _this = this;
    return this.twitter_request('account/verify_credentials.json', {
      method: "GET",
      silent: true,
      async: false,
      success: function(element, data) {
        var html, new_area;
        if (!data.screen_name) {
          _this.add_html("Unknown error in validate_credentials. Exiting. " + data);
          return;
        }
        _this.user_data = data;
        _this.screen_name = data.screen_name;
        new_area = $('#content_template').clone();
        new_area.attr('id', _this.get_content_div_id());
        $('body').append(new_area);
        html = '';
        $('#users').append("					<div class='user' id='user_" + (_this.get_id()) + "' data-account-id='" + (_this.get_id()) + "'>						<a href='#' onClick='change_account(); return false;'>							<img src='" + data.profile_image_url + "' />						</a>					</div>				");
        return $("#user_" + (_this.get_id())).tooltip({
          bodyHandler: function() {
            return "<strong>@" + _this.user_data.name + "</strong>";
          },
          track: true,
          showURL: false,
          left: 5
        });
      }
    });
  };

  Account.prototype.get_tweet = function(id) {
    return this.tweets[id];
  };

  Account.prototype.get_id = function() {
    return this.id;
  };

  Account.prototype.add_html = function() {};

  Account.prototype.update_user_counter = function() {};

  Account.prototype.is_unread_tweet = function(tweet_id) {
    var l1, l2;
    l1 = max_read_id.length;
    l2 = tweet_id.length;
    if (l1 === l2) return tweet_id > max_read_id;
    return l2 > l1;
  };

  Account.prototype.get_twitter_configuration = function() {
    return this.twitter_request('help/configuration.json', {
      silent: true,
      async: false,
      success: function(element, data) {
        return Application.twitter_config = data;
      }
    });
  };

  Account.prototype.sign_request = function(url, method, parameters) {
    var message;
    message = {
      action: url,
      method: method,
      parameters: parameters
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.completeRequest(message, this.keys);
    OAuth.SignatureMethod.sign(message, this.keys);
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
    threads_running = 5;
    threads_errored = 0;
    responses = [];
    after_run = function() {
      if (threads_errored === 0) {
        _this.parse_data(responses);
        _this.request.start_request();
      } else {
        setTimeout(_this.fill_list, 30000);
      }
      return _this.update_user_counter;
    };
    success = function(element, data) {
      responses.push(data);
      threads_running -= 1;
      if (threads_running === 0) return after_run();
    };
    error = function(element, data) {
      threads_running -= 1;
      threads_errored += 1;
      if (threads_running === 0) return after_run();
    };
    default_parameters = {
      include_rts: true,
      count: 200,
      include_entities: true,
      page: 1,
      since_id: this.max_known_id !== "0" ? this.max_known_id : void 0
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
    var data, json_data, responses, temp, temp_elements, _i, _j, _len, _len2;
    if (json.constructor !== Array) json = [json];
    responses = [];
    for (_i = 0, _len = json.length; _i < _len; _i++) {
      json_data = json[_i];
      try {
        temp = $.parseJSON(json_data);
      } catch (_error) {}
      if (temp == null) continue;
      if (temp.constructor === Array) {
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
    debugger;
  };

  return Account;

})();

Hooks = (function() {

  function Hooks() {}

  Hooks.get_tweet = function() {
    var tweet_div;
    tweet_div = $(Hooks).parents('.tweet');
    return accounts[tweet_div.data('account-id')].get_tweet(tweet_div.data('tweet-id'));
  };

  Hooks.reply = function() {
    return Hooks.get_tweet().reply();
  };

  Hooks.retweet = function() {
    return Hooks.get_tweet().retweet();
  };

  Hooks.check_file = function() {};

  return Hooks;

}).call(this);

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
    this.sender = new User(this.data.sender);
  }

  TwitterMessage.prototype.get_date = function() {
    return this.date;
  };

  TwitterMessage.prototype.get_id = function() {
    return this.object_id;
  };

  TwitterMessage.get_object = function(data, account) {
    if (data == null) return;
    if ((data.text != null) && (data.recipient != null)) return;
    if (data.text != null) return new Tweet(data, account);
  };

  return TwitterMessage;

})();

Tweet = (function(_super) {

  __extends(Tweet, _super);

  Tweet.prototype.mentions = [];

  Tweet.prototype.account = null;

  Tweet.prototype.thumbs = [];

  function Tweet(data, account) {
    var _ref;
    this.account = account;
    this.data = data;
    this.sender = new User((_ref = data.retweeted_status) != null ? _ref : data.user);
    this.account.tweets[this.get_id()] = this;
    this.text = data.text;
    this.linkify_text();
    this.thumbs = this.get_thumbnails();
    this.date = new Date(this.data.created_at);
  }

  Tweet.prototype.get_id = function() {
    return this.data.id_str;
  };

  Tweet.prototype.get_date = function() {
    return this.date;
  };

  Tweet.prototype.div_id = function() {
    return "#tweet_" + (this.get_id());
  };

  Tweet.prototype.get_html = function() {
    return ("<div id='" + (this.get_id()) + "' class='" + (this.get_classes().join(" ")) + "' data-tweet-id='" + (this.get_id()) + "' data-account-id='" + (this.account.get_id()) + "'>") + this.sender.get_avatar_html() + this.sender.get_link_html() + ("<span class='text'>" + this.text + "</span>") + this.get_info_html() + this.get_buttons_html() + "</div>";
  };

  Tweet.prototype.get_info_html = function() {};

  Tweet.prototype.get_buttons_html = function() {};

  Tweet.prototype.linkify_text = function() {
    var all_entities, entities, entity, entity_type, _i, _j, _len, _len2, _ref;
    if (this.data.entities != null) {
      all_entities = [];
      _ref = this.data.entities;
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
        }
      }
    }
    return this.text = this.text.replace(/\n/g, "<br />\n");
  };

  Tweet.prototype.replace_entity = function(entity_object, text) {
    return this.text = this.text.slice(0, entity_object.indices[0]) + text + this.text.slice(entity_object.indices[1]);
  };

  Tweet.prototype.get_type = function() {
    return "tweet";
  };

  Tweet.prototype.get_classes = function() {
    var classes, mention, _i, _len, _ref, _ref2;
    classes = [this.get_type(), "by_" + this.data.user.screen_name, this.account.is_unread_tweet(this.get_id()) ? "new" : void 0, (_ref = this.account.screen_name, __indexOf.call(this.mentions, _ref) >= 0) ? "mentions_this_user" : void 0, this.account.screen_name === this.data.user.screen_name ? "by_this_user" : void 0];
    _ref2 = this.mentions;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      mention = _ref2[_i];
      classes.push("mentions_" + mention);
    }
    return classes;
  };

  Tweet.prototype.retweet = function() {
    if (!confirm("Wirklich retweeten?")) return;
    return this.account.twitter_request("statuses/retweet/" + (get_id()) + ".json", {
      success_string: "Retweet erfolgreich"
    });
  };

  Tweet.prototype["delete"] = function() {
    if (!confirm("Wirklich diesen Tweet löschen?")) return;
    return this.account.twitter_request("statuses/destroy/" + (get_id()) + ".json", {
      success_string: "Tweet gelöscht",
      success: function() {
        return $(this.div_id()).remove();
      }
    });
  };

  Tweet.prototype.get_thumbnails = function() {
    var entity, media, res, url, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4;
    _ref2 = ((_ref = this.data.entities) != null ? _ref.media : void 0) != null;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      media = _ref2[_i];
      this.thumbs.push(new Thumbnail("" + media.media_url_https + ":thumb", media.expanded_url));
    }
    _ref4 = ((_ref3 = this.data.entities) != null ? _ref3.urls : void 0) != null;
    for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
      entity = _ref4[_j];
      url = entity.expanded_url;
      if ((res = url.match(/(?:http:\/\/(?:www\.)youtube.com\/.*v=|http:\/\/youtu.be\/)([0-9a-zA-Z]+)/))) {
        thumbs.push(new Thumbnail("http://img.youtube.com/" + res[1] + "/1.jpg", url));
      }
      if ((res = url.match(/twitpic.com\/([0-9a-zA-Z]+)/))) {
        thumbs.push(new Thumbnail("http://twitpic.com/show/mini/" + res[1], url));
      }
      if ((res = url.match(/yfrog.com\/([a-zA-Z0-9]+)/))) {
        thumbs.push(new Thumbnail("http://yfrog.com/" + res[1] + ".th.jpg", url));
      }
      if ((res = url.match(/lockerz.com\/s\/[0-9]+/))) {
        thumbs.push(new Thumbnail("http://api.plixi.com/api/tpapi.svc/imagefromurl?url=" + url + "&size=thumbnail", url));
      }
      if ((res = url.match(/moby\.to\/([a-zA-Z0-9]+)/))) {
        thumbs.push(new Thumbnail("http://moby.to/" + res[1] + ":square", url));
      }
      if ((res = url.match(/ragefac\.es\/(?:mobile\/)?([0-9]+)/))) {
        thumbs.push(new Thumbnail("http://ragefac.es/" + res[1] + "/i", url));
      }
      if ((res = url.match(/lauerfac\.es\/([0-9]+)/))) {
        thumbs.push(new Thumbnail("http://lauerfac.es/" + res[1] + "/thumb", url));
      }
      if ((res = url.match(/ponyfac\.es\/([0-9]+)/))) {
        thumbs.push(new Thumbnail("http://ponyfac.es/" + res[1] + "/thumb", url));
      }
    }
  };

  return Tweet;

})(TwitterMessage);

User = (function() {

  function User(data) {
    this.data = data;
    users[this.data.id] = this;
  }

  User.prototype.id = function() {
    return this.data.id_str;
  };

  User.prototype.get_avatar_html = function() {
    return "<span class='avatar'>			<span class='tooltip_info'>				<strong>" + this.data.name + "</strong><br /><br />				" + this.data.followers_count + " Follower<br />				" + this.data.friends_count + " Friends<br />				" + this.data.statuses_count + " Tweets			</span>			<a href='https://twitter.com/account/profile_image/" + this.data.screen_name + "' target='_blank'>				<img class='user_avatar' src='" + this.data.profile_image_url + "' />			</a>		</span>";
  };

  User.prototype.get_link_html = function() {
    return "<span class='poster'><a href='https://twitter.com/" + this.data.screen_name + "' target='_blank'>" + this.data.screen_name + "</a></span>";
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

  function StreamRequest(account) {
    StreamRequest.__super__.constructor.call(this, account);
  }

  StreamRequest.prototype.start_request = function() {
    var data, url,
      _this = this;
    this.processing = false;
    this.buffer = "";
    this.response_offset = 0;
    this.connected = false;
    this.connection_started_at = new Date();
    this.last_data_received_at = new Date();
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
          _this.connected = true;
          break;
        case 4:
          _this.connected = false;
          if ((new Date()).getTime() - _this.connection_started_at.getTime() > 10000) {
            _this.delay = settings.timings.mindelay;
          }
          window.setTimeout(_this.account.fill_list, _this.delay * 1000);
          _this.delay = _this.delay * 2;
      }
      _this.buffer += _this.request.responseText.substr(_this.response_offset);
      _this.response_offset = _this.request.responseText.length;
      return _this.process_buffer();
    };
    return this.request.send(null);
  };

  StreamRequest.prototype.process_buffer = function() {
    var len, parseable_text, regex, res;
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

  PullRequest.prototype.start_request = function() {};

  return PullRequest;

})(Request);

Application = (function() {

  function Application() {}

  Application.users = {};

  Application.accounts = [];

  Application.expected_settings_version = 12;

  Application.current_account = 0;

  Application.twitter_config = {};

  Application.start = function() {
    if (!this.is_settings_version_okay()) return;
    this.fill_places();
    this.attach_hooks();
    this.initialize_accounts();
    this.get_twitter_configuration();
    return this.change_account(0);
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
    $('#place').change(function() {
      return $.cookie('last_place', $('#place option:selected').val(), {
        expires: 365
      });
    });
    return $('#file').change(Hooks.check_file);
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

  Application.change_account = function(id) {
    $('.content').hide();
    $("#content_" + id).show();
    $('#users .user').removeClass('active');
    $("#user_" + id).addClass('active');
    return this.current_account = id;
  };

  return Application;

})();
