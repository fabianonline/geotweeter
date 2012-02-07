
describe('Tweet', function() {
  var Application, tweet;
  tweet = null;
  Application = {};
  beforeEach(function() {
    return tweet = new Tweet(normal_tweet, get_account());
  });
  it('should have an id', function() {
    return expect(tweet.id).toEqual("162157777156980736");
  });
  it('should have some classes', function() {
    expect(tweet.get_classes()).toContain("tweet");
    expect(tweet.get_classes()).toContain("by_zurvollenstunde");
    expect(tweet.get_classes()).toContain("new");
    expect(tweet.get_classes()).not.toContain("by_this_user");
    return expect(tweet.get_classes()).not.toContain("mentions_this_user");
  });
  it('should fill it\'s user variable', function() {
    return expect(tweet.sender.constructor).toEqual(User);
  });
  it("should not have a retweeted_by user", function() {
    return expect(tweet.retweeted_by).toBeNull();
  });
  it("should have no thumbnails", function() {
    expect(tweet.get_single_thumb_html()).toEqual("");
    return expect(tweet.get_multi_thumb_html()).toEqual("");
  });
  it("should deliver the correct context menu items", function() {
    var item, items;
    items = tweet.get_menu_items();
    return expect(((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        if (item.name === "Reply") _results.push(item);
      }
      return _results;
    })()).length).toEqual(1);
  });
  describe("mentioning this user", function() {
    beforeEach(function() {
      return tweet = new Tweet(tweet_mentioning_this_user, get_account());
    });
    return it("should have some classes", function() {
      expect(tweet.get_classes()).toContain("tweet");
      expect(tweet.get_classes()).toContain("by_johnassel");
      expect(tweet.get_classes()).toContain("mentions_fabianonline");
      expect(tweet.get_classes()).toContain("new");
      expect(tweet.get_classes()).toContain("mentions_this_user");
      return expect(tweet.get_classes()).not.toContain("by_this_user");
    });
  });
  describe("by this user", function() {
    beforeEach(function() {
      return tweet = new Tweet(tweet_by_this_user, get_account());
    });
    return it("should have some classes", function() {
      expect(tweet.get_classes()).toContain("tweet");
      expect(tweet.get_classes()).toContain("by_fabianonline");
      expect(tweet.get_classes()).toContain("mentions_johnassel");
      expect(tweet.get_classes()).toContain("new");
      expect(tweet.get_classes()).not.toContain("mentions_this_user");
      return expect(tweet.get_classes()).toContain("by_this_user");
    });
  });
  return describe("with media", function() {
    describe("at Twitter", function() {
      tweet = null;
      beforeEach(function() {
        return tweet = new Tweet(tweet_with_image, get_account());
      });
      it("should link the image correctly", function() {
        return expect(tweet.thumbs[0]).toEqual(new Thumbnail("https://p.twimg.com/AkAw66RCMAM1ngm.jpg:thumb", "http://twitter.com/Rene_dev/status/162183375212392449/photo/1"));
      });
      return it("should deliver only single_thumb_html", function() {
        expect(tweet.get_single_thumb_html()).not.toEqual("");
        return expect(tweet.get_multi_thumb_html()).toEqual("");
      });
    });
    return describe("on another server", function() {
      it("should link youtube videos without www correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://youtube.com/watch?v=8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
      });
      it("should link youtube videos with www correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://www.youtube.com/watch?v=8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
      });
      it("should link short youtube video links correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://youtu.be/8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
      });
      it("should link twitpic images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://twitpic.com/12ABcd").thumbnail).toEqual("//twitpic.com/show/mini/12ABcd");
      });
      it("should link yfrog images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://yfrog.com/12ABcd").thumbnail).toEqual("//yfrog.com/12ABcd.th.jpg");
      });
      it("should link lockerz images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://lockerz.com/s/12349").thumbnail).toEqual("//api.plixi.com/api/tpapi.svc/imagefromurl?url=http://lockerz.com/s/12349&size=thumbnail");
      });
      it("should link moby images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://moby.to/12ABcd").thumbnail).toEqual("http://moby.to/12ABcd:square");
      });
      it("should link ragefac.es images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://ragefac.es/27").thumbnail).toEqual("http://ragefac.es/27/i");
      });
      it("should link ragefac.es mobile images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://ragefac.es/mobile/27").thumbnail).toEqual("http://ragefac.es/27/i");
      });
      it("should link lauerfac.es images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://lauerfac.es/27").thumbnail).toEqual("http://lauerfac.es/27/thumb");
      });
      return it("should link ponyfac.es images correctly", function() {
        return expect(Tweet.url_to_thumbnail("http://ponyfac.es/27").thumbnail).toEqual("http://ponyfac.es/27/thumb");
      });
    });
  });
});
