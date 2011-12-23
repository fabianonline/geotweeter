class Account
	screen_name = null
	max_read_id = "0"
	max_known_id = "0"
	tweets = {}
	
	constructor: (settings_id) ->
		@id=settings_id
		@keys = {
			consumerKey: settings.twitter.consumerKey
			consumerSecret: settings.twitter.consumerSecret
			token: settings.twitter.users[settings_id].token
			tokenSecret: settings.twitter.users[settings_id].tokenSecret
		}
		validate_credentials()
		
	my_element: $('#content_'+@id())
	
	set_max_read_id: -> # TODO
	get_max_read_id: -> # TODO
	mark_as_read: -> # TODO
	validate_credentials: -> # TODO
	get_tweet: (id) -> @tweets[id]
	get_id: -> @id
	
	is_unread_tweet: (tweet_id) -> 
		l1 = max_read_id.length
		l2 = tweet_id.length
		return tweet_id>max_read_id if l1 == l2
		return l2 > l1
	
	twitter_request: (url, options) ->
		message = {
			action: "https://api.twitter.com/1/#{url}"
			method: options.method ? "POST"
			parameters: options.parameters
		}
		verbose = !(!!options.silent && true)
		$('#form').fadeTo(500, 0).delay(500) if verbose
		OAuth.setTimestampAndNonce(message)
		OAuth.completeRequest(message, @keys)
		OAuth.signatureMethod.sign(message, @keys)
		url = "proxy/api/#{url}"
		data = OAuth.formEncode(message.parameters)
		
		result = $.ajax({
			url: url
			data: data
			dataType: options.dataType ? "json"
			async: options.async ? true
			type: options.method ? "POST"
			success: (data, textStatus, req) ->
				if req.status=="200"
					$('#success_info').html(options.success_string) if options.success_string?
					options.success($('#success_info'), data, req, options.additional_info) if options.success?
					$('#success').fadeIn(500).delay(5000).fadeOut(500, -> $('#form').fadeTo(500, 1)) if verbose
				else
					if options.error?
						options.error($('#failure_info'), data, req, "", null, options.additional_info) 
					else
						$('#failure_info').html(data.error)
					$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1)) if verbose
			error: (req, textStatus, exc) ->
				if options.error?
					options.error($('#failure_info'), null, req, textStatus, exc, options.additional_info)
				else
					$('#failure_info').html("Error #{req.status} (#{req.statusText})")
				$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1)) if verbose
		})
		return result.responseText if options.return_response
