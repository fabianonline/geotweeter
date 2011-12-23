class User
	constructor: (@data) ->
		users[@data.id()] = this
		
	id: -> @data.id_str
	get_avatar_html: -> "<span class='avatar'><img class='user_avatar' src='#{@data.profile_image_url}' /></span>"
	get_link_html: -> "<span class='poster'><a href='https://twitter.com/#{@data.screen_name}' target='_blank'>#{@data.screen_name}</a></span>"
