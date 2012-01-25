describe('Normal Tweet', ->
	tweet = null
	Application = {}
	
	
	beforeEach( ->
		account = new Account(0)
		tweet = new Tweet(normal_tweet, account)
	)
	
	it('should have an id', ->
		expect(tweet.id).toEqual("162157777156980736")
	)

	it('should have some classes', ->
		expect(tweet.get_classes()).toContain("tweet")
		expect(tweet.get_classes()).toContain("by_zurvollenstunde")
		expect(tweet.get_classes()).toContain("new")
		expect(tweet.get_classes()).not.toContain("by_this_user")
		expect(tweet.get_classes()).not.toContain("mentions_this_user")
	)
	
	it('should fill it\'s user variable', ->
		expect(tweet.sender.constructor).toEqual(User)
	)
	
	it("should not have a retweeted_by user", ->
		expect(tweet.retweeted_by).toBeNull()
	)
	
	it("should have no thumbnails", ->
		expect(tweet.get_single_thumb_html()).toEqual("")
		expect(tweet.get_multi_thumb_html()).toEqual("")
	)
)