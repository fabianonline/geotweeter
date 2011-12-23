class Account
	screen_name = null
	max_read_id = "0"
	max_known_id = "0"
	
	constructor: (settings_id) ->
		@id=settings_id
		validate_credentials()
		
	my_element: $('#content_'+@id())
	
	set_max_read_id: -> # TODO
	get_max_read_id: -> # TODO
	mark_as_read: -> # TODO
	twitter_request: () -> # TODO
	validate_credentials: -> # TODO
	
	is_unread_tweet: (tweet_id) -> 
		l1 = max_read_id.length
		l2 = tweet_id.length
		return tweet_id>max_read_id if l1 == l2
		return l2 > l1
