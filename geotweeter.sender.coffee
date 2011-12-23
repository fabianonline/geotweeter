class Sender
	constructor: (@data) ->
	get_avatar_html: -> "<span class='avatar'><img class='user_avatar' src='#{@profile_image_url}' /></span>"
	get_link_html: -> "<span class='poster'><a href='https://twitter.com/#{@screen_name}' target='_blank'>#{@screen_name}</a></span>"
