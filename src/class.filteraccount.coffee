# Since Filter-Streaming-API-Requests need an dedicated account, which we don't
# have, we use a FilterAccount, which is basically just a copy of another account.
class FilterAccount extends Account
	parent: null
	
	# The constructor is called by the user via a hook.
	constructor: (@parent, @keywords) ->
		@id="fake_#{(new Date()).getTime()}"
		@keys = @parent.keys
		@screen_name = "Suche: #{@keywords}"
		@user = @parent.user
		# Clone the template-content-area so this account has it's own content
		# area.
		new_area = $('#content_template').clone()
		new_area.attr('id', @get_content_div_id())
		$('body').append(new_area);
		$('#users').append("
			<div class='user' id='user_#{@id}' data-account-id='#{@id}'>
				<a href='#' onClick='return Account.hooks.change_current_account(this);'>
					<img src='icons/magnifier.png' />
					<span class='count'></span>
				</a>
				<a href='#' onClick='return Account.hooks.toggle_pause_request(this);'>
					<img src='icons/lightbulb_off.png' />
				</a>
				<a href='#' onClick='return Account.hooks.destroy(this);'>
					<img src='icons/cross.png' />
				</a>
			</div>
		")
		# Add a tooltip to this account's selector button at the top of the screen.
		$("#user_#{@id}").tooltip?({
			bodyHandler: => "<strong>#{@screen_name}</strong><br />#{@status_text}"
			track: true
			showURL: false
			left: 5
		})
		# Initialize an adequate Stream object.
		@request = new FilterRequest(this, @keywords)
		@request.start_request()
		
	# Saves the given `id` to Tweetmarker.
	set_max_read_id: (id) -> 
		unless id?
			Application.log(this, "set_max_read_id", "Falscher Wert: #{id}")
			return
		@max_read_id = id
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
	
	toString: -> "FilterAccount #{@keywords}"
	
	validate_credentials: -> $("#user_#{@id} img").attr('src', 'icons/magnifier.png')
	
	get_followers: -> 
	
	get_twitter_configuration: ->
	
	fill_list: => @request.start_request()
