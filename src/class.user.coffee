class User
	constructor: (@data) ->
		users[@data.id()] = this
		
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
