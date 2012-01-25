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

	describe('classes', ->
		it('should have some', ->
			expect(tweet.get_classes()).toContain("tweet")
		)
	)
)