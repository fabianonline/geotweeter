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

    Tweet.mentions = [];

    function Tweet(data) {
      Tweet.__super__.constructor.call(this, data);
      this.sender = new Sender(data.user);
      window.tweets[this.id()] = this;
      this.text = data.status;
      this.linkify();
    }

    Tweet.prototype.id = function() {
      return this.data.id_str;
    };

    Tweet.prototype.div_id = function() {
      return "#tweet_" + (this.id());
    };

    Tweet.prototype.get_html = function() {
      return ("<div id='" + (this.id()) + "'>") + this.sender.get_avatar_html() + this.sender.get_link_html() + this.text + "</div>";
    };

    Tweet.prototype.linkify = function() {
      var all_entities, entities, entity, entity_type, _i, _j, _len, _len2, _ref, _results;
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
        _results = [];
        for (_j = 0, _len2 = all_entities.length; _j < _len2; _j++) {
          entity = all_entities[_j];
          switch (entity.type) {
            case "user_mentions":
              this.mentions.push(entity.screen_name);
              _results.push(this.replace_entity(entity, "<a href='https://twitter.com/" + entity.screen_name + "' target='_blank'>@" + entity.screen_name + "</a>"));
              break;
            case "urls":
            case "media":
              if (entity.expanded_url != null) {
                _results.push(this.replace_entity(entity, "<a href='" + entity.expanded_url + "' class='external' target='_blank'>" + entity.display_url + "</a>"));
              } else {
                _results.push(this.replace_entity(entity, "<a href='" + entity.url + "' class='external' target='_blank'>" + entity.url + "</a>"));
              }
              break;
            case "hashtags":
              _results.push(this.replace_entity(entity, "<a href='https://twitter.com/search?q=#" + entity.text + "' target='_blank'>#" + entity.text + "</a>"));
              break;
            default:
              _results.push(void 0);
          }
        }
        return _results;
      }
    };

    Tweet.prototype.replace_entity = function(entity_object, text) {
      return this.text = this.text.slice(0, entity_object.indices[0]) + text + this.text.slice(entity_object.indices[1]);
    };

    return Tweet;

  })();

}).call(this);
