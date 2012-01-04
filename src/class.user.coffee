class User
	constructor: (@data) ->
		users[@data.id] = this
		@screen_name = @data.screen_name
		@permalink = "https://twitter.com/#{@screen_name}"
		@id = @data.id_str
		
	id: -> @data.id_str
	get_avatar_html: -> 
		"<span class='avatar'>
			<span class='tooltip_info'>
				<strong>#{@data.name}</strong><br /><br />
				#{@data.followers_count} Follower<br />
				#{@data.friends_count} Friends<br />
				#{@data.statuses_count} Tweets
			</span>
			<a href='https://twitter.com/account/profile_image/#{@data.screen_name}' target='_blank'>
				<img class='user_avatar' src='#{@data.profile_image_url}' />
			</a>
		</span>"
	
	get_link_html: -> "<span class='poster'><a href='https://twitter.com/#{@data.screen_name}' target='_blank'>#{@data.screen_name}</a></span>"
	get_screen_name: -> @data.screen_name
	report_as_spam: (account) ->
		return unless confirm("Wirklich #{@screen_name} als Spammer melden?")
		account.twitter_request("report_spam.json", {parameters: {screen_name: @screen_name}, success_string: "Als Spammer gemeldet.", success: -> $(".by_#{@screen_name}").remove})