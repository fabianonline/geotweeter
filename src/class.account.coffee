class Account
	screen_name: null
	max_read_id: "0"
	max_known_tweet_id: "0"
	max_known_dm_id: "0"
	my_last_tweet_id: "0"
	tweets: {}
	id: null
	user: null
	request: null
	keys: {}
	followers_ids: []
	
	constructor: (settings_id) ->
		@id=settings_id
		@keys = {
			consumerKey: settings.twitter.consumerKey
			consumerSecret: settings.twitter.consumerSecret
			token: settings.twitter.users[settings_id].token
			tokenSecret: settings.twitter.users[settings_id].tokenSecret
		}
		@validate_credentials()
		@get_max_read_id()
		@get_followers()
		@request = if settings.twitter.users[settings_id].stream? then new StreamRequest(this) else new PullRequest(this)
		@fill_list()
	
	get_my_element: -> $("#content_#{@id}")
	
	set_max_read_id: (id) -> 
		unless id?
			Aplication.log(this, "set_max_read_id", "Falscher Wert: #{id}")
			return
		
		@max_read_id = id
		$.ajax({
			type: 'POST'
			url: settings.set_maxreadid_url || 'maxreadid/set.php'
			async: false
			dataType: 'text'
			data: {account_id: @user.id, value: @max_read_id}
			error: (req) =>
				html = "
					<div class='status'>
						<b>Fehler in setMaxReadID():</b><br />
						Error #{req.status} (#{req.responseText})
					</div>"
				@add_html(html)
		})
		elements = $("#content_#{@id} .new")
		for elm in elements
			element = $(elm)
			element.removeClass('new') unless @is_unread_tweet(element.attr('data-tweet-id'))
	
	get_max_read_id: ->
		value = $.ajax({
			method: 'GET'
			url: settings.get_maxreadid_url || 'maxreadid/get.php'
			async: false
			dataType: 'text'
			data: {account_id: @user.id}
		}).responseText
		@max_read_id = value
		Application.log(this, "getMaxReadID", "result: " + value);
		return value
	
	toString: -> "Account #{@user.screen_name}"
	
	get_content_div_id: -> "content_#{@id}"
	validate_credentials: ->
		@twitter_request('account/verify_credentials.json', {
			method: "GET"
			silent: true
			async: false
			success: (element, data) =>
				unless data.screen_name
					@add_html("Unknown error in validate_credentials. Exiting. #{data}")
					return
				@user = new User(data)
				@screen_name = @user.screen_name
				new_area = $('#content_template').clone()
				new_area.attr('id', @get_content_div_id())
				$('body').append(new_area);
				html = '';
				$('#users').append("
					<div class='user' id='user_#{@id}' data-account-id='#{@id}'>
						<a href='#' onClick='return Account.hooks.change_current_account(this);'>
							<img src='#{data.profile_image_url}' />
						</a>
					</div>
				")
				$("#user_#{@id}").tooltip({
					bodyHandler: => "<strong>@#{@user.screen_name}</strong>"
					track: true
					showURL: false
					left: 5
				})
		})
	
	get_followers: -> @twitter_request('followers/ids.json', {silent: true, method: "GET", success: (element, data) => @followers_ids=data.ids})
	get_tweet: (id) -> @tweets[id]
	add_html: (html) -> 
		element = document.createElement("div")
		element.innerHTML = html
		@get_my_element().prepend(element)
	
	add_status_html: (message) ->
		html = "
			<div class='status'>
				#{message}
			</div>"
		@add_html(html)
		return ""
		
	update_user_counter: -> # TODO
	
	is_unread_tweet: (tweet_id) -> tweet_id.is_bigger_than(@max_read_id)
	
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
	
	fill_list: =>
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
		
		html = ""
		last_id = ""
		while responses.length > 0
			newest_date = null
			newest_index = null
			for index, array of responses
				object = array[0]
				if newest_date==null || object.get_date()>newest_date
					newest_date = object.get_date()
					newest_index = index
			array = responses[newest_index]
			object = array.shift()
			responses.splice(newest_index, 1) if array.length==0
			this_id = object.id
			html += object.get_html() unless this_id==old_id
			if object.constructor==Tweet
				@max_known_tweet_id=object.id if object.id.is_bigger_than(@max_known_tweet_id)
				@my_last_tweet_id=object.id if object.sender.id==@user.id && object.id.is_bigger_than(@my_last_tweet_id)
			if object.constructor==DirectMessage
				@max_known_dm_id=object.id if object.id.is_bigger_than(@max_known_dm_id)
			old_id = this_id
		@add_html(html)
		@update_user_counter()
	
	scroll_to: (tweet_id) ->
		element_top = $("##{tweet_id}").offset().top
		# Just scrolling to a tweet doesn't show it because it will be hidden behind
		# the form on the top. So we use this as an offset.
		topheight = parseInt($('#content_template').css("padding-top"))
		$(document).scrollTop(element_top - topheight);
		return false
	
	activate: ->
		$('.content').hide()
		$("#content_#{@id}").show()
		$('#users .user').removeClass('active')
		$("#user_#{@id}").addClass('active')
		Application.current_account = this
	
	@hooks: {
		change_current_account: (elm) ->
			account_id = $(elm).parents('.user').data('account-id')
			acct = Application.accounts[account_id]
			acct.activate()
			return false
		
		mark_as_read: (elm) ->
			elements = $("#content_#{Application.current_account.id} .tweet.new")
			id = null
			offset = $(document).scrollTop() + $('#top').height()
			for element in elements
				if $(element).offset().top >= offset
					id = $(element).attr('data-tweet-id')
					break
			Application.current_account.set_max_read_id(id)
			return false
		
		goto_my_last_tweet: ->
			Application.current_account.scroll_to(Application.current_account.my_last_tweet_id)
			return false
		
		goto_unread_tweet: ->
			Application.current_account.scroll_to(Application.current_account.max_read_id)
			return false
	}