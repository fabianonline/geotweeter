# Account maps to a single Twitter Account with its keys and so on
class Account
	# Account.first is a shortcut for developing: `Account.first` is much 
	# easier to type on the console than `Application.accounts[0]`.
	@first: null
	
	screen_name: "unknown"
	max_read_id: "0"
	max_read_dm_id: "0"
	max_read_mention_id: "0"
	max_known_tweet_id: "0"
	min_known_tweet_id: null
	min_known_dm_id: null
	max_known_dm_id: "0"
	my_last_tweet_id: "0"
	tweets: {}
	dms: {}
	id: null
	user: null
	request: null
	keys: {}
	followers_ids: []
	friends_ids: []
	status_text: ""
	scroll_top: 0
	requests: []
	ratelimit_remaining: null
	ratelimit_limit: null
	ratelimit_time: null
	
	# The constructor is called by Application. `settings_id` is the id of
	# this account as it appears in `settings.twitter.user`.
	constructor: (settings_id) ->
		@id=settings_id
		Account.first = this if settings_id==0
		@keys = {
			consumerKey: settings.twitter.consumerKey
			consumerSecret: settings.twitter.consumerSecret
			token: settings.twitter.users[settings_id].token
			tokenSecret: settings.twitter.users[settings_id].tokenSecret
		}
		# Clone the template-content-area so this account has it's own content
		# area.
		new_area = $('#content_template').clone()
		new_area.attr('id', @get_content_div_id())
		new_area.attr('data-account-id', @id)
		$('body').append(new_area);
		$('#users').append("
			<div class='user' id='user_#{@id}' data-account-id='#{@id}'>
				<a href='#' onClick='return Account.hooks.change_current_account(this);'>
					<img src='icons/spinner.gif' />
					<span class='count'></span>
				</a>
			</div>
		")
		# Add a tooltip to this account's selector button at the top of the screen.
		$("#user_#{@id}").tooltip?({
			bodyHandler: => 
				$("<div>").html("<strong>@#{@screen_name}</strong><br />#{@status_text}").append(@get_ratelimit_status())
			track: true
			showURL: false
			left: 5
		})
		# Initialize an adequate Stream object.
		@request = if settings.twitter.users[settings_id].stream then new StreamRequest(this) else new PullRequest(this)
		# Try to validate the keys and get informations about this account.
		@validate_credentials()
		
	# Returns the jQuery element of the content area of this account.
	get_my_element: -> $("#content_#{@id}")
	
	# Saves the given `id` to Tweetmarker.
	set_max_read_id: (id, mention_id, dm_id) -> 
		unless id?
			Application.log(this, "set_max_read_id", "Falscher Wert: #{id}")
			return
		
		@max_read_id = id
		mention_id = id if mention_id==null || mention_id=="0"
		dm_if = id if dm_id==null || dm_id=="0"

		@max_read_mention_id = mention_id
		@max_read_dm_id = dm_id
		
		# Tweetmarker uses Oauth echo: To verify our identity, we generate
		# valid OAuth credentials for our twitter account and send those to
		# Tweetmarker. They can use them and identify us.
		# This method is safe: The generated credentials can only be used once
		# and only for verify_credentials.
		header = {
			"X-Auth-Service-Provider": "https://api.twitter.com/1/account/verify_credentials.json"
			"X-Verify-Credentials-Authorization": @sign_request("https://api.twitter.com/1/account/verify_credentials.json", "GET", {}, {return_type: "header"})
		}
		
		# We are lazy and send the same id for timeline and mentions collection.
		# Oh, and please note the super secret api key...
		$.ajax({
			type: 'POST'
			url: "proxy/tweetmarker/lastread?collection=timeline,mentions,messages&username=#{@user.screen_name}&api_key=GT-F181AC70B051"
			headers: header
			contentType: "text/plain"
			dataType: 'text'
			data: "#{id},#{mention_id},#{dm_id}"
			processData: false
			error: (req) =>
				html = "
					<div class='status'>
						<b>Fehler in setMaxReadID():</b><br />
						Error #{req.status} (#{req.responseText})
					</div>"
				@add_html(html)
		})
		@update_read_tweet_status()
	
	# Walks through all "new" tweets and marks them as read, if necessary.
	update_read_tweet_status: ->
		elements = $("#content_#{@id} .new")
		for elm in elements
			element = $(elm)
			element.removeClass('new') unless @is_unread_tweet(element.attr('data-tweet-id'))
		@update_user_counter()
	
	# Gets the current `max_read_id` from Tweetmarker. The request runs asynchronously
	# to prevent lockups in case of long reaction times of their site. So it
	# can take a few seconds to actually change the display of read and unread
	# tweets.
	get_max_read_id: ->
		$("#user_#{@id} .count").html('(?)')
		
		# Again OAuth echo stuff. For a better explanation please refer to
		# `set_max_read_id`.
		header = {
			"X-Auth-Service-Provider": "https://api.twitter.com/1/account/verify_credentials.json"
			"X-Verify-Credentials-Authorization": @sign_request("https://api.twitter.com/1/account/verify_credentials.json", "GET", {}, {return_type: "header"})
		}
		
		# Ignore the mentions collection and just query 
		$.ajax({
			method: 'GET'
			async: true
			url: "proxy/tweetmarker/lastread?collection=timeline,mentions,messages&username=#{@user.screen_name}&api_key=GT-F181AC70B051"
			headers: header
			dataType: 'text'
			success: (data, textStatus, req) =>
				if req.status==200 && data?
					data = data.split(",")
					@max_read_id = data[0]
					@max_read_mention_id = data[1]
					@max_read_dm_id = data[2]
					Application.log(@, "get_max_read_id", "result: #{data[0]}")
					Application.log(@, "get_max_read_mention_id", "result: #{data[1]}")
					Application.log(@, "get_max_read_dm_id", "result: #{data[2]}")
					@update_read_tweet_status()
		})
		return
	
	toString: -> "Account #{@user.screen_name}"
	
	get_content_div_id: -> "content_#{@id}"
	
	get_ratelimit_status: ->
		return $("") unless @ratelimit_remaining?
		$('<div>').html("<br /><strong>Rate-Limit:</strong> #{@ratelimit_remaining}/#{@ratelimit_limit} (vor #{Math.round((new Date()-@ratelimit_time)/1000)} Sekunden)")
	
	# Validates the credentials of the current account and also gets some basic
	# data about this account (e.g. `screen_name`, `id` and so on).
	validate_credentials: ->
		@set_status("Validating Credentials...", "orange")
		@twitter_request('account/verify_credentials.json', {
			method: "GET"
			silent: true
			async: true
			success: (element, data, req) =>
				unless data.screen_name
					@add_status_html("Unknown error in validate_credentials. Exiting. #{req.responseText}")
					
					$("#user_#{@id} img").attr('src', "icons/exclamation.png")
					return
				@user = new User(data)
				@screen_name = @user.screen_name
				settings.twitter.users[@id].screen_name = @screen_name
				$("#user_#{@id} img").attr('src', @user.get_avatar_image())
				@get_max_read_id()
				Application.log(this, "RateLimit", "#{req.getResponseHeader("X-RateLimit-Remaining")}/#{req.getResponseHeader("X-RateLimit-Limit")}")
				try @get_followers()
				try @get_friends()
				@fill_list({clip: true})
				
				# If after_validation is defined, run it.
				@after_validation?()
			error: (element, data, req, textStatus) =>
				@add_status_html("Unknown error in validate_credentials. Exiting.<br />#{req.status} - #{req.statusText}")
				$("#user_#{@id} img").attr('src', "icons/exclamation.png")
				@set_status("Error!", "red")
		})
	
	get_followers: -> @twitter_request('followers/ids.json', {
		silent: true
		method: "GET"
		parameters: {
			stringify_ids: true
		}
		success: (element, data) => 
			@followers_ids=data.ids
			@get_friends_and_followers_data() if @friends_ids.length>0
	})
	
	get_friends: -> @twitter_request('friends/ids.json', {
		silent: true
		method: "GET"
		parameters: {
			stringify_ids: true
		}
		success: (element, data) => 
			@friends_ids=data.ids
			@get_friends_and_followers_data() if @followers_ids.length>0
	})
	
	get_friends_and_followers_data: ->
		# merge friends and followers ids and split them into 100er blocks
		all_contacts = @friends_ids.concat(@followers_ids)
		parts = while all_contacts.length>0
			all_contacts.splice(0, 100)
		
		@twitter_request('users/lookup.json', {
			silent: true
			parameters: {
				user_id: users.join(",")
			}
			success: (element, data) =>
				Application.add_to_autocomplete("@#{user.screen_name}") for user in data
		}) for users in parts
	
	get_tweet: (id) -> @tweets[id]
	get_dm: (id) -> @dms[id]
	
	# Adds HTML code to this account's content area. The HTML code is added
	# to a new `div` element which is then added to the DOM. That method is
	# much, much, much, much faster than adding the html directly.
	add_html: (html, add_at_bottom=false) -> 
		element = $("<div>").append(html)
		if add_at_bottom
			@get_my_element().find(".bottom").before(element)
		else
			@get_my_element().prepend(element)
	
	# Adds a status message to this account's content area.
	add_status_html: (message, additional_classes="") ->
		html = "
			<div class='status #{additional_classes}'>
				#{message}
			</div>"
		@add_html(html)
		return ""
	
	# Adds an error message, which will fade out as soon as a working connection
	# has been established.
	add_error_html: (message) -> @add_status_html(message, "error")
	
	# Updates the number of unread tweets at the top of the page.
	# We count all unread tweets including mentions (even if they aren't)
	# visibly marked as new, but excluding my own tweets.
	update_user_counter: ->
		count = $("#content_#{@id} .tweet.new").not('.by_this_user').length
		str = if count>0 then "(#{count})" else ""
		$("#user_#{@id} .count").html(str)
	
	# Decides if the given tweet can be considered unread or not.
	is_unread_tweet: (tweet_id) -> tweet_id.is_bigger_than(@max_read_id)
	
	# Get the current twitter configuration (values like `short_link_length`,
	# `max_photo_size` and so on). Gets called on the first account only by
	# Application at startup.
	get_twitter_configuration: ->
		@twitter_request('help/configuration.json', {
			silent: true
			async: true
			method: "GET"
			success: (element, data) -> Application.twitter_config = data
		})
	
	# Signs a request to the Twitter API using the current account's keys.
	# `options` can contain following options:
	# 
	# * `return_type`:
	#   * `header`: Returns only the oauth_values in a form useful as header
	#     value. Example: `oauth_key="abc", oauth_nonce="def", ...`
	#   * `parameters` (default): Returns all parameters as URLencoded string.
	#     Example: `some_key=some_value&oauth_key=abc&oauth_nonce=def`
	sign_request: (url, method, parameters, options={}) ->
		message = {
			action: url
			method: method
			parameters: parameters
		}
		OAuth.setTimestampAndNonce(message)
		OAuth.completeRequest(message, @keys)
		OAuth.SignatureMethod.sign(message, @keys)
		
		switch options.return_type
			when "header"
				return ("#{key}=\"#{value}\"" for key, value of message.parameters when key.slice(0, 5)=="oauth").join(", ")
			when "parameters"
				return message.parameters
		return OAuth.formEncode(message.parameters)
	
	# Performs a request to the Twitter API. Valid options are:
	# 
	# * `silent` (default: `false`): Set to true to skip all outputs. Use for background actions.
	# * `method` (default: `POST`): `POST` or `GET`
	# * `parameters`: An object containing parameters for the request.
	# * `dataType` (default: `json`): The dataType to expect back.
	# * `async` (default: `true`): Whether to run asynchronously or not.
	# * `success_string`: String to show after request was successful.
	# * `success`: Function to be executed after request was successful.
	# * `error`: Function to be executed after the request either got an error
	#   code back or the resulting de-JSON-ififed object contained an error.
	# * `return_response` (default: `false`): Whether to return the responseText
	#   after the request. Only useful if `async` was set to `false`.
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
			success: (data, textStatus, req) =>
				if req.getResponseHeader("X-RateLimit-Remaining")
					@ratelimit_remaining = req.getResponseHeader("X-RateLimit-Remaining")
					@ratelimit_limit = req.getResponseHeader("X-RateLimit-Limit")
					@ratelimit_time = new Date()
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
			error: (req, textStatus, exc) =>
				if req.getResponseHeader("X-RateLimit-Remaining")
					@ratelimit_remaining = req.getResponseHeader("X-RateLimit-Remaining")
					@ratelimit_limit = req.getResponseHeader("X-RateLimit-Limit")
					@ratelimit_time = new Date()
				if options.error?
					options.error($('#failure_info'), null, req, textStatus, exc, options.additional_info)
				else
					$('#failure_info').html("Error #{req.status} (#{req.statusText})")
				$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1)) if verbose
		})
		return result.responseText if options.return_response
	
	# fill_list performs all necessary request to fill your timeline.
	# Requests done by this function are:
	# 
	# * `home_timeline` twice to get 2x200 tweets
	# * `mentions` to get mentions from people you don't follow
	# * `direct_messages` to get direct messages sent to you
	# * `direct_messages/sent` to get direct messages sent from you
	# 
	# This code gets called by `validate_credentials` and by timeouts in this
	# account's `Request` object.
	fill_list: (options={}) =>
		@set_status("Filling List...", "orange")
		
		options.clip=true if options.fill_bottom?
		
		# This method is supposed to run multiple requests asynchronously, so
		# we have to fiddle with it a bit.
		# We will be starting 4 "threads" (a.k.a. requests).
		threads_errored = 0
		responses = []
		main_data = null
		
		# `after_run` is run after the last request finished.
		after_run = =>
			responses.unshift(main_data) if main_data?
			if threads_errored == 0
				# if we were successful, we parse the returned data and start
				# the request.
				@set_status("", "")
				@parse_data(responses, options)
				@request.start_request() 
				@get_my_element().find(".bottom").show()
			else
				# otherwise we ouptput an error and try again some time later.
				setTimeout(@fill_list, 30000)
				@add_error_html("Fehler in fill_list.<br />Nächster Versuch in 30 Sekunden.")
		
		# `success` is run whenever a request finished successfully.
		success = (element, data, req, additional_info) =>
			if additional_info.main_data? 
				main_data = data
			else
				responses.push(data)
			threads_running -= 1
			after_run() if threads_running == 0
		
		# `error` is run whenever a request finished with an error.
		error = (object, data, req, textStatus, exc, additional_info) =>
			threads_running -= 1
			threads_errored += 1
			@add_error_html("Fehler in #{additional_info.name}:<br />#{req.status} - #{exc}")
			after_run() if threads_running == 0
		
		# Set some default parameters for all request.
		default_parameters = {
			# We want to get RTs in the timeline
			include_rts: true
			count: 200
			# Entities contain information about unshortened t.co-Links and
			# so on. Naturally, we want those, too.
			include_entities: true
			page: 1
			# If `@max_known_tweet_id` is set, we already know some tweets.
			# So we set `since_id` to only get new tweets.
			since_id: @max_known_tweet_id unless @max_known_tweet_id=="0" || options.fill_bottom?
			max_id: @min_known_tweet_id.decrement() if options.fill_bottom?
		}
		
		# Define all the necessary requests to be made. `extra_parameters` can
		# be set to override the `default_parameters` for this request.
		requests = [
			{
				url: "statuses/home_timeline.json"
				name: "home_timeline"
				main_data: true
			}
			{
				url: "statuses/mentions.json"
				name: "mentions"
			}
			{
				url: "direct_messages.json"
				name: "Received DMs"
				extra_parameters: {
					# You (at least I) don't get soo much DMs, so 100 is
					# enough.
					count: 100
					# DMs have their own IDs, so we use `@max_known_dm_id`
					# here.
					since_id: @max_known_dm_id if @max_known_dm_id? && !options.fill_bottom?
					max_id: @min_known_dm_id.decrement() if @min_known_dm_id? && options.fill_bottom?
				}
			}
			{
				url: "direct_messages/sent.json"
				name: "Sent DMs"
				extra_parameters: {
					count: 100
					since_id: @max_known_dm_id if @max_known_dm_id? && !options.fill_bottom?
					max_id: @min_known_dm_id.decrement() if @min_known_dm_id? && options.fill_bottom?
				}
			}
		]
		
		# Number of threads to be started. Will be reduced by one every time
		# one of the threads finishes. If zero, all requests are done.
		threads_running = requests.length
		
		# Do the actual requests.
		for request in requests
			parameters = {}
			# Construct a new parameters object with `default_parameters`
			# extended by `extra_parameters`.
			parameters[key] = value for key, value of default_parameters when value
			parameters[key] = value for key, value of request.extra_parameters when value
			additional_info = {name: request.name}
			additional_info.main_data = true if request.main_data
			@twitter_request(request.url, {
				method: "GET"
				parameters: parameters
				dataType: "text"
				silent: true
				additional_info: additional_info
				success: success
				error: error
			})
	
	# `parse_data` gets an array of (arrays of) responses from the Twitter API
	# (generated by `fill_list` and `StreamRequest`), sorts them, gets matching
	# objects, calls `get_html` on them and outputs the HTML.
	parse_data: (json, options={}) ->
		# If we didn't get an array of responses, we create one.
		json = [json] unless json.constructor==Array
		responses = []
		# We still have only JSON code, no real object. So we go through the
		# array and parse all the JSON.
		for json_data in json
			try temp = $.parseJSON(json_data)
			continue unless temp?
			if temp.constructor == Array
				# Did we get an array of messages or just one?
				if temp.length>0
					temp_elements = []
					# `TwitterMessage.get_object` will determine the type of
					# an object and return a matching "real" object.
					# This is done for alle elements of this array.
					temp_elements.push(TwitterMessage.get_object(data, this)) for data in temp
					responses.push(temp_elements)
			else
				# Just one message... So let's try to parse it.
				object = TwitterMessage.get_object(temp, this)
				# We could get an `undefined` back (this happens e.g. to that
				# friends array you get on connecting to the Streaming API).
				# Since that would be the only object, we just go on.
				continue unless object?
				responses.push([object])
		return if responses.length==0
		return if responses.length==1 && responses[0][0]==null
		
		# By now we have all requests in a 2-dimensional array `responses`.
		# The first dimension comes from multiple requests in `fill_array`.
		# Data from a `StreamRequest` will always have just one element in
		# the first dimension.
		# Anyway, we have to get through the multiple arrays and sort the
		# tweets in there. Let's go.
		all_objects = []
		html = $('<div>')
		last_id = ""
		while responses.length > 0
			# Save the Date and the index of the array holding the newest
			# element.
			newest_date = null
			newest_index = null
			for index, array of responses
				object = array[0]
				if newest_date==null || object.get_date()>newest_date
					newest_date = object.get_date()
					newest_index = index
			# Retrieve the first object of the winning array (a.k.a. the newest
			# element).
			array = responses[newest_index]
			object = array.shift()
			# If this array has become empty, we remove it from `responses`.
			responses.splice(newest_index, 1) if array.length==0
			
			# Wenn `clip` aktiviert ist und das erste ("wichtigste") Array leer
			# ist, brechen wir ab.
			if array.length==0 && newest_index=="0" && options.clip?
				# Vorher müssen wir jedoch zusehen, `max_known_tweet_id` und
				# `max_known_dm_id` zu setzen (falls sie noch leer sind).
				if @max_known_tweet_id == "0"
					for array in responses
						object = array[0]
						@max_known_tweet_id = object.id if object.constructor==Tweet && object.id.is_bigger_than(@max_known_tweet_id)
				if @max_known_dm_id == "0"
					for array in responses
						object = array[0]
						@max_known_dm_id = object.id if object.constructor==DirectMessage && object.id.is_bigger_than(@max_known_dm_id)
				# Jetzt können wir aber wirklich abbrechen.
				break
				
			this_id = object.id
			# Add the html to the temporary html code. But look out for duplicate
			# tweets (e.g. mentions from friends will be in `home_timeline` as
			# well as in `mentions`).
			html.append(object.get_html()) unless this_id==old_id
			all_objects.push(object)
			# If we have a `Tweet` or `DirectMessage`, note it's `id`, if
			# necessary.
			if object.constructor==Tweet
				@max_known_tweet_id=object.id if object.id.is_bigger_than(@max_known_tweet_id)
				@my_last_tweet_id=object.id if object.sender.id==@user.id && object.id.is_bigger_than(@my_last_tweet_id)
				@min_known_tweet_id=object.id unless @min_known_tweet_id? && object.id.is_bigger_than(@min_known_tweet_id)
			if object.constructor==DirectMessage
				@max_known_dm_id=object.id if object.id.is_bigger_than(@max_known_dm_id)
				@min_known_dm_id=object.id unless @min_known_dm_id? && object.id.is_bigger_than(@min_known_dm_id)
			# Save this id for recognizing duplicates in the next round.
			old_id = this_id
		# After we are done with all tweets, add the collected html to the DOM.
		@add_html(html, options.fill_bottom?)
		# Update the counter to display the right number of unread tweets.
		@update_user_counter()
		# Call `add_to_collections` (again) in order to correctly link this tweet
		all_objects.reverse()
		object.add_to_collections?() for object in all_objects
	
	# Scrolls down to a specified tweet.
	scroll_to: (tweet_id, alternate_target) ->
		target = $("##{tweet_id}")
		target = $(alternate_target) unless target.length>0
		element_top = target.offset().top
		# Just scrolling to a tweet doesn't show it because it will be hidden behind
		# the form on the top. So we use this as an offset.
		topheight = parseInt($('#content_template').css("padding-top"))
		$(document).scrollTop(element_top - topheight);
		return false
	
	# Set this Account as the active (show this Account's tweets and so on).
	show: ->
		Application.current_account.hide() if Application.current_account? && this!=Application.current_account
		$("#content_#{@id}").show()
		$("#user_#{@id}").addClass('active')
		$(window).scrollTop(@scroll_top)
		Application.current_account = this
	
	# Hide this account (as in "don't show it's tweets).
	hide: ->
		@scroll_top = $(window).scrollTop()
		$("#content_#{@id}").hide()
		$("#user_#{@id}").removeClass('active')
	
	# Sets the current status of this account. `color` is actually the name of
	# a CSS class setting the background-color and so on. Currently available
	# colors are `red`, `green`, `yellow` and `orange`.
	set_status: (message, color) ->
		$("#user_#{@id}").removeClass('red green yellow orange').addClass(color)
		@status_text = message
	
	# Removes this account. Currently only used by FilterAccounts.
	destroy: ->
		@request.stop_request()
		Account.first.show() if Application.current_account==this
		$("##{@get_content_div_id()}").remove()
		# Call mouseout to remove the tooltip
		$("#user_#{@id}").mouseout()
		$("#user_#{@id}").remove()
		delete Application.accounts[@id]
	
	# Removes the errors of this account by fading them out.
	remove_errors: -> @get_my_element().find(".error").slideUp()
	
	toggle_pause_request: (pause_link_element) ->
		if @request.stopped
			$(pause_link_element).find('img').attr('src', 'icons/lightbulb_off.png')
			@request.start_request()
		else
			$(pause_link_element).find('img').attr('src', 'icons/lightbulb_on.png')
			@request.stop_request()
	
	scroll_to_last_read_tweet: ->
		@scroll_to(@max_read_id, "##{@get_content_div_id()} .bottom")
	
	# Some static hooks to be called from the HTML via buttons and stuff.
	# Mostly self-explenatory.
	@hooks: {
		get_account: (elm) -> Application.accounts[$(elm).parents('.user, .content').data('account-id')]
		
		change_current_account: (elm) ->
			@get_account(elm).show()
			return false
		
		fill_bottom: (elm) ->
			@get_account(elm).fill_list({fill_bottom: true})
			return false
		
		# Marks all tweets up to upperst completety visible tweet as read.
		mark_as_read: (elm) ->
			# First, get all "new" tweets.
			elements = $("#content_#{Application.current_account.id} .tweet.new")
			id = null
			mention_id = null
			dm_id = null
			if elm != null
				# Get offset if an element is given
				offset = $(elm).offset().top
			else
				# Get the height of the top area as offset.
				offset = $(document).scrollTop() + $('#top').height()
			# Go through all elements until we find the first tweet which's
			# top is bigger than the `offset`. This means the tweet begins
			# under the top area and so is completely visible.
			for element in elements
				if $(element).offset().top >= offset
					id = $(element).attr('data-tweet-id')
					break

			elements = $("#content_#{Application.current_account.id} .mentions_this_user.new")
			for element in elements
				if $(element).offset().top >= offset
					mention_id = $(element).attr('data-tweet-id')
					break

			elements = $("#content_#{Application.current_account.id} .dm")
			for element in elements
				if $(element).offset().top >= offset
					dm_id = $(element).attr('data-tweet-id')
					break

			Application.current_account.set_max_read_id(id, mention_id, dm_id)
			return false
		
		goto_my_last_tweet: ->
			Application.current_account.scroll_to(Application.current_account.my_last_tweet_id)
			return false
		
		goto_unread_tweet: ->
			Application.current_account.scroll_to_last_read_tweet()
			return false
		
		reload: ->
			Application.current_account.get_max_read_id()
			Application.current_account.request.restart()
			return false
		
		destroy: (elm) ->
			@get_account(elm).destroy()
			return false
		
		toggle_pause_request: (elm) -> 
			@get_account(elm).toggle_pause_request()
			return false
	}
