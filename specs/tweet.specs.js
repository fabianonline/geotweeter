
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
  return describe('classes', function() {
    return it('should have some', function() {
      return expect(tweet.get_classes()).toContain("tweet");
    });
  });
});
