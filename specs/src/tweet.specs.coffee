describe('Tweet', ->
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

	it("should deliver the correct context menu items", ->
		items = tweet.get_menu_items()
		expect((item for item in items when item.name=="Reply").length).toEqual(1)
	)
	
	describe("mentioning this user", ->
		beforeEach(->
			tweet = new Tweet(tweet_mentioning_this_user, get_account())
		)
		
		it("should have some classes", ->
			expect(tweet.get_classes()).toContain("tweet")
			expect(tweet.get_classes()).toContain("by_johnassel")
			expect(tweet.get_classes()).toContain("mentions_fabianonline")
			expect(tweet.get_classes()).toContain("new")
			expect(tweet.get_classes()).toContain("mentions_this_user")
			expect(tweet.get_classes()).not.toContain("by_this_user")
		)
	)
	
	describe("by this user", ->
		beforeEach(->
			tweet = new Tweet(tweet_by_this_user, get_account())
		)
		
		it("should have some classes", ->
			expect(tweet.get_classes()).toContain("tweet")
			expect(tweet.get_classes()).toContain("by_fabianonline")
			expect(tweet.get_classes()).toContain("mentions_johnassel")
			expect(tweet.get_classes()).toContain("new")
			expect(tweet.get_classes()).not.toContain("mentions_this_user")
			expect(tweet.get_classes()).toContain("by_this_user")
		)
	)
	
	describe("with media", ->
		describe("at Twitter", ->
			tweet = null
			
			beforeEach( ->
				tweet = new Tweet(tweet_with_image, get_account())
			)
			
			it("should link the image correctly", ->
				expect(tweet.thumbs[0]).toEqual(new Thumbnail("https://p.twimg.com/AkAw66RCMAM1ngm.jpg:thumb", "http://twitter.com/Rene_dev/status/162183375212392449/photo/1"))
			)
		
			it("should deliver only single_thumb_html", ->
				expect(tweet.get_single_thumb_html()).not.toEqual("")
				expect(tweet.get_multi_thumb_html()).toEqual("")
			)
		)
		
		describe("on another server", ->
			it("should link youtube videos without www correctly", -> expect(Tweet.url_to_thumbnail("http://youtube.com/watch?v=8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg"))
			it("should link youtube videos with www correctly", -> expect(Tweet.url_to_thumbnail("http://www.youtube.com/watch?v=8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg"))
			it("should link short youtube video links correctly", -> expect(Tweet.url_to_thumbnail("http://youtu.be/8bjdpb").thumbnail).toEqual("//img.youtube.com/8bjdpb/1.jpg"))
			it("should link twitpic images correctly", -> expect(Tweet.url_to_thumbnail("http://twitpic.com/12ABcd").thumbnail).toEqual("//twitpic.com/show/mini/12ABcd"))
			it("should link yfrog.com images correctly", -> expect(Tweet.url_to_thumbnail("http://yfrog.com/12ABcd").thumbnail).toEqual("//yfrog.com/12ABcd.th.jpg"))
			it("should link yfrog.us images correctly", -> expect(Tweet.url_to_thumbnail("http://yfrog.us/e9v71kz").thumbnail).toEqual("//yfrog.us/e9v71kz.th.jpg"))
			it("should link yfrog.ru images correctly", -> expect(Tweet.url_to_thumbnail("http://yfrog.ru/12387").thumbnail).toEqual("//yfrog.ru/12387.th.jpg"))
			it("should link lockerz images correctly", -> expect(Tweet.url_to_thumbnail("http://lockerz.com/s/12349").thumbnail).toEqual("//api.plixi.com/api/tpapi.svc/imagefromurl?url=http://lockerz.com/s/12349&size=thumbnail"))
			it("should link moby images correctly", -> expect(Tweet.url_to_thumbnail("http://moby.to/12ABcd").thumbnail).toEqual("http://moby.to/12ABcd:square"))
			it("should link ragefac.es images correctly", -> expect(Tweet.url_to_thumbnail("http://ragefac.es/27").thumbnail).toEqual("http://ragefac.es/27/i"))
			it("should link ragefac.es mobile images correctly", -> expect(Tweet.url_to_thumbnail("http://ragefac.es/mobile/27").thumbnail).toEqual("http://ragefac.es/27/i"))
			it("should link lauerfac.es images correctly", -> expect(Tweet.url_to_thumbnail("http://lauerfac.es/27").thumbnail).toEqual("http://lauerfac.es/27/thumb"))
			it("should link ponyfac.es images correctly", -> expect(Tweet.url_to_thumbnail("http://ponyfac.es/27").thumbnail).toEqual("http://ponyfac.es/27/thumb"))
			it("should link twitter images correctly", -> expect(Tweet.url_to_thumbnail("http://www.flickr.com/photos/fabianonline/6789770962/in/set-72157629468588309").thumbnail).toEqual("http://flic.kr/p/img/bkZmmA_s.jpg"))
			it("should link static.twitter urls correctly", -> expect(Tweet.url_to_thumbnail("http://farm6.static.flickr.com/5012/5454042425_9526e2e477.jpg").thumbnail).toEqual("http://flic.kr/p/img/9iXoNe_s.jpg"))
			it("should link short twitter urls correctly", -> expect(Tweet.url_to_thumbnail("http://flic.kr/p/7sqMtA").thumbnail).toEqual("http://flic.kr/p/img/7sqMtA_s.jpg"))
		)
	)
	
)
