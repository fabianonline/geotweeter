
describe('Normal Tweet', function() {
  var Application, tweet;
  tweet = null;
  Application = {};
  beforeEach(function() {
    var account;
    account = new Account(0);
    return tweet = new Tweet(normal_tweet, account);
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
