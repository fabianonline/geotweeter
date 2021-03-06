class User
	@id: "0"
	@permalink: ""
	@screen_name: ""
	
	constructor: (@data) ->
		@id = @data.id_str
		Application.users[@id] = this
		@screen_name = @data.screen_name
		Application.add_to_autocomplete("@#{@screen_name}") 
		@permalink = "https://twitter.com/#{@screen_name}"
		
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
				<img class='user_avatar' src='#{@get_avatar_image()}' />
			</a>
		</span>"
	
	get_avatar_image: -> if location.protocol=="https:" then @data.profile_image_url_https else @data.profile_image_url
	
	get_link_html: (show_full_name=false)-> "
		<span class='poster'>
			<a href='https://twitter.com/#{@data.screen_name}' target='_blank'>
				#{@data.screen_name}
			</a>
			#{if show_full_name then " (#{@data.name})" else ""}
			</span>"
	
	get_screen_name: -> @data.screen_name
	report_as_spam: (account) ->
		return unless confirm("Wirklich #{@screen_name} als Spammer melden?")
		account.twitter_request("report_spam.json", {parameters: {screen_name: @screen_name}, success_string: "Als Spammer gemeldet.", success: => $(".by_#{@screen_name}").remove()})