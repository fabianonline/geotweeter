(function() {
  var Sender, TwitterMessage;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

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

  TwitterMessage = (function() {

    function TwitterMessage(data) {
      this.data = data;
      this.sender = new Sender(this.data.sender);
    }

    return TwitterMessage;

  })();

  window.Tweet = (function() {

    __extends(Tweet, TwitterMessage);

    function Tweet(data) {
      Tweet.__super__.constructor.call(this, data);
      this.sender = new Sender(this.data.user);
      window.tweets[this.id()] = this;
    }

    Tweet.prototype.id = function() {
      return this.data.id_str;
    };

    Tweet.prototype.div_id = function() {
      return "#tweet_" + (this.id());
    };

    Tweet.prototype.get_html = function() {
      return ("<div id='" + (this.id()) + "'>") + this.sender.get_avatar_html() + this.sender.get_link_html() + "</div>";
    };

    return Tweet;

  })();

}).call(this);
