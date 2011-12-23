(function() {
  var Account, Hooks, Sender, TwitterMessage, User, tweets, users,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Account = (function() {
    var max_known_id, max_read_id, screen_name;

    screen_name = null;

    max_read_id = "0";

    max_known_id = "0";

    function Account(settings_id) {
      this.id = settings_id;
      validate_credentials();
    }

    Account.prototype.my_element = $('#content_' + Account.id());

    Account.prototype.set_max_read_id = function() {};

    Account.prototype.get_max_read_id = function() {};

    Account.prototype.mark_as_read = function() {};

    Account.prototype.twitter_request = function() {};

    Account.prototype.validate_credentials = function() {};

    Account.prototype.is_unread_tweet = function(tweet_id) {
      var l1, l2;
      l1 = max_read_id.length;
      l2 = tweet_id.length;
      if (l1 === l2) return tweet_id > max_read_id;
      return l2 > l1;
    };

    return Account;

  })();

  tweets = {};

  users = {};

  Hooks = (function() {
    var _this = this;

    function Hooks() {}

    Hooks.get_tweet(function() {});

    Hooks.reply(function() {});

    return Hooks;

  }).call(this);

  Sender = (function() {

    function Sender(data) {
      this.data = data;
    }

    Sender.prototype.get_avatar_html = function() {
      return "<span class='avatar'><img class='user_avatar' src='" + this.profile_image_url + "' /></span>";
    };

    Sender.prototype.get_link_html = function() {
      return "<span class='poster'><a href='https://twitter.com/" + this.screen_name + "' target='_blank'>" + this.screen_name + "</a></span>";
    };

    return Sender;

  })();

  window.Tweet = (function(_super) {
    var account, mentions;

    __extends(Tweet, _super);

    mentions = [];

    account = null;

    function Tweet(data, account) {
      this.account = account;
      Tweet.__super__.constructor.call(this, data);
      this.sender = new User(data.user);
      tweets[this.id()] = this;
      this.text = data.status;
      this.linkify_text();
    }

    Tweet.prototype.id = function() {
      return this.data.id_str;
    };

    Tweet.prototype.div_id = function() {
      return "#tweet_" + (this.id());
    };

    Tweet.prototype.get_html = function() {
      return ("<div id='" + (this.id()) + "' class='" + (this.get_classes().join(" ")) + "'>") + this.sender.get_avatar_html() + this.sender.get_link_html() + this.text + this.get_info_html() + this.get_buttons_html() + "</div>";
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
      classes = [this.get_type(), "by_" + this.data.user.screen_name, this.account.is_unread_tweet(this.data.id_str) ? "new" : void 0, (_ref = this.account.screen_name, __indexOf.call(this.mentions, _ref) >= 0) ? "mentions_this_user" : void 0, this.account.screen_name === this.data.user.screen_name ? "by_this_user" : void 0];
      _ref2 = this.mentions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        mention = _ref2[_i];
        classes.push("mentions_" + mention);
      }
      return classes;
    };

    return Tweet;

  })(TwitterMessage);

  TwitterMessage = (function() {

    function TwitterMessage(data) {
      this.data = data;
      this.sender = new Sender(this.data.sender);
    }

    return TwitterMessage;

  })();

  User = (function() {

    function User(data) {
      this.data = data;
      users[this.data.id()] = this;
    }

    User.prototype.id = function() {
      return this.data.id_str;
    };

    User.prototype.get_avatar_html = function() {
      return "<span class='avatar'><img class='user_avatar' src='" + this.data.profile_image_url + "' /></span>";
    };

    User.prototype.get_link_html = function() {
      return "<span class='poster'><a href='https://twitter.com/" + this.data.screen_name + "' target='_blank'>" + this.data.screen_name + "</a></span>";
    };

    return User;

  })();

}).call(this);
