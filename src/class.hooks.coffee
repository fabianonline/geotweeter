class Hooks
	@get_tweet => 
		tweet_div = $(this).parents('.tweet')
		accounts[tweet_div.data('account-id')].get_tweet(tweet_div.data('tweet-id'))
		
	@reply => @get_tweet().reply()
	@retweet => @get_tweet().retweet()
		