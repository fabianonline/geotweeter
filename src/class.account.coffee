class Account
	screen_name: null
	max_read_id: "0"
	max_known_id: "0"
	max_known_dm_id: "0"
	tweets: {}
	id: null
	user_data: null
	request: null
	keys: {}
	
	constructor: (settings_id) ->
		@id=settings_id
		@keys = {
			consumerKey: settings.twitter.consumerKey
			consumerSecret: settings.twitter.consumerSecret
			token: settings.twitter.users[settings_id].token
			tokenSecret: settings.twitter.users[settings_id].tokenSecret
		}
		@validate_credentials()
		@request = if settings.twitter.users[settings_id].stream? then new StreamRequest(this) else new PullRequest(this)
		@fill_list()
		
	my_element: -> $("#content_#{@id()}")
	
	set_max_read_id: -> # TODO
	get_max_read_id: -> # TODO
	mark_as_read: -> # TODO
	get_content_div_id: -> "content_#{@get_id()}"
	validate_credentials: ->
		@twitter_request('account/verify_credentials.json', {
			method: "GET"
			silent: true
			async: false
			success: (element, data) =>
				unless data.screen_name
					@add_html("Unknown error in validate_credentials. Exiting. #{data}")
					return
				@user_data = data
				@screen_name = data.screen_name
				new_area = $('#content_template').clone()
				new_area.attr('id', @get_content_div_id())
				$('body').append(new_area);
				html = '';
				$('#users').append("
					<div class='user' id='user_#{@get_id()}' data-account-id='#{@get_id()}'>
						<a href='#' onClick='change_account(); return false;'>
							<img src='#{data.profile_image_url}' />
						</a>
					</div>
				")
				$("#user_#{@get_id()}").tooltip({
					bodyHandler: => "<strong>@#{@user_data.name}</strong>"
					track: true
					showURL: false
					left: 5
				})
		})
	
	get_tweet: (id) -> @tweets[id]
	get_id: -> @id
	add_html: -> # TODO
	update_user_counter: -> # TODO
	
	is_unread_tweet: (tweet_id) -> 
		l1 = max_read_id.length
		l2 = tweet_id.length
		return tweet_id>max_read_id if l1 == l2
		return l2 > l1
	
	get_twitter_configuration: ->
		@twitter_request('help/configuration.json', {
			silent: true
			async: false
			success: (element, data) -> Application.twitter_config = data
		})
	
	sign_request: (url, method, parameters) ->
		message = {
			action: url
			method: method
			parameters: parameters
		}
		OAuth.setTimestampAndNonce(message)
		OAuth.completeRequest(message, @keys)
		OAuth.SignatureMethod.sign(message, @keys)
		return OAuth.formEncode(message.parameters)
	
	twitter_request: (url, options) ->
		method = options.method ? "POST"
		verbose = !(!!options.silent && true)
		$('#form').fadeTo(500, 0).delay(500) if verbose
		data = @sign_request("https://api.twitter.com/1/#{url}", method, options.parameters)
		url = "proxy/api/#{url}"
		
		result = $.ajax({
			url: url
			data: data
			dataType: options.dataType ? "json"
			async: options.async ? true
			type: method
			success: (data, textStatus, req) ->
				if req.status=="200" || req.status==200
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
	
	fill_list: ->
		threads_running = 5
		threads_errored = 0
		responses = []
		
		after_run = =>
			if threads_errored == 0
				@parse_data(responses)
				@request.start_request() 
			else
				setTimeout(@fill_list, 30000)
				# TODO Dokumentation
			@update_user_counter
		
		success = (element, data) ->
			responses.push(data)
			threads_running -= 1
			after_run() if threads_running == 0
		
		error = (element, data) ->
			threads_running -= 1
			threads_errored += 1
			# TODO: Dokumentation
			after_run() if threads_running == 0
		
		default_parameters = {
			include_rts: true
			count: 200
			include_entities: true
			page: 1
			since_id: @max_known_id unless @max_known_id=="0"
		}
		
		requests = [
			{
				url: "statuses/home_timeline.json"
				name: "home_timeline 1"
			}
			{
				url: "statuses/home_timeline.json"
				name: "home_timeline 2"
				extra_parameters: {page: 2}
			}
			{
				url: "statuses/mentions.json"
				name: "mentions"
			}
			{
				url: "direct_messages.json"
				name: "Received DMs"
				extra_parameters: {
					count: 100
					since_id: @max_known_dm_id if @max_known_dm_id?
				}
			}
			{
				url: "direct_messages/sent.json"
				name: "Sent DMs"
				extra_parameters: {
					count: 100
					since_id: @max_known_dm_id if @max_known_dm_id?
				}
			}
		]
		
		for request in requests
			parameters = {}
			parameters[key] = value for key, value of default_parameters when value
			parameters[key] = value for key, value of request.extra_parameters when value
			@twitter_request(request.url, {
				method: "GET"
				parameters: parameters
				dataType: "text"
				silent: true
				additional_info: {name: request.name}
				success: success
				error: error
			})
	
	parse_data: (json) -> #TODO
		json = [json] unless json.constructor==Array
		responses = []
		for json_data in json
			try temp = $.parseJSON(json_data)
			continue unless temp?
			if temp.constructor == Array
				if temp.length>0
					temp_elements = []
					temp_elements.push(TwitterMessage.get_object(data, this)) for data in temp
					responses.push(temp_elements)
			else
				responses.push([TwitterMessage.get_object(temp, this)])
		return if responses.length==0
		debugger
		
			