
describe('Normal Tweet', function() {
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
  return it("should have no thumbnails", function() {
    expect(tweet.get_single_thumb_html()).toEqual("");
    return expect(tweet.get_multi_thumb_html()).toEqual("");
  });
});

describe("Tweets with images", function() {
  var tweet;
  tweet = null;
  beforeEach(function() {
    return tweet = new Tweet(tweet_with_image, get_account());
  });
  describe("Tweet with twitter image", function() {
    it("should link the image correctly", function() {
      return expect(tweet.thumbs[0]).toEqual(new Thumbnail("https://p.twimg.com/AkAw66RCMAM1ngm.jpg:thumb", "http://twitter.com/Rene_dev/status/162183375212392449/photo/1"));
    });
    return it("should deliver only single_thumb_html", function() {
      expect(tweet.get_single_thumb_html()).not.toEqual("");
      return expect(tweet.get_multi_thumb_html()).toEqual("");
    });
  });
  return describe("Tweet with youtube video", function() {
    it("should link long links without www correctly", function() {
      tweet.data.entities = {
        "hashtags": [],
        "user_mentions": [],
        "urls": [
          {
            "indices": [1, 2],
            "expanded_url": "http://youtube.com/watch?v=8bjdpb"
          }
        ]
      };
      tweet.thumbs = [];
      tweet.get_thumbnails();
      return expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
    });
    it("should link long links with www correctly", function() {
      tweet.data.entities = {
        "hashtags": [],
        "user_mentions": [],
        "urls": [
          {
            "indices": [1, 2],
            "expanded_url": "http://www.youtube.com/watch?v=8bjdpb"
          }
        ]
      };
      tweet.thumbs = [];
      tweet.get_thumbnails();
      return expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
    });
    return it("should link short links correctly", function() {
      tweet.data.entities = {
        "hashtags": [],
        "user_mentions": [],
        "urls": [
          {
            "indices": [1, 2],
            "expanded_url": "http://youtu.be/8bjdpb"
          }
        ]
      };
      tweet.thumbs = [];
      tweet.get_thumbnails();
      return expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg");
    });
  });
});
