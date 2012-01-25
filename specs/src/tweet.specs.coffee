describe('Normal Tweet', ->
	tweet = null
	Application = {}
	
	
	beforeEach( ->
		tweet = new Tweet(normal_tweet, get_account())
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

describe("Tweets with images", ->
	tweet = null
	
	beforeEach( ->
		tweet = new Tweet(tweet_with_image, get_account())
	)
	
	describe("Tweet with twitter image", ->	
		it("should link the image correctly", ->
			expect(tweet.thumbs[0]).toEqual(new Thumbnail("https://p.twimg.com/AkAw66RCMAM1ngm.jpg:thumb", "http://twitter.com/Rene_dev/status/162183375212392449/photo/1"))
		)
		
		it("should deliver only single_thumb_html", ->
			expect(tweet.get_single_thumb_html()).not.toEqual("")
			expect(tweet.get_multi_thumb_html()).toEqual("")
		)
	)
	
	describe("Tweet with youtube video", ->
		it("should link long links without www correctly", ->
			tweet.data.entities = {"hashtags":[],"user_mentions":[],"urls":[{"indices":[1,2],"expanded_url":"http://youtube.com/watch?v=8bjdpb"}]}
			tweet.thumbs = []
			tweet.get_thumbnails()
			expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg")
		)
		
		it("should link long links with www correctly", ->
			tweet.data.entities = {"hashtags":[],"user_mentions":[],"urls":[{"indices":[1,2],"expanded_url":"http://www.youtube.com/watch?v=8bjdpb"}]}
			tweet.thumbs = []
			tweet.get_thumbnails()
			expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg")
		)
		
		it("should link short links correctly", ->
			tweet.data.entities = {"hashtags":[],"user_mentions":[],"urls":[{"indices":[1,2],"expanded_url":"http://youtu.be/8bjdpb"}]}
			tweet.thumbs = []
			tweet.get_thumbnails()
			expect(tweet.thumbs[0].thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg")
		)
	)
)