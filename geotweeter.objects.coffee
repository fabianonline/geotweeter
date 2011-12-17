class Sender
	constructor: (@data) ->
	get_avatar_html: ->
		"<span class='avatar'><img class='user_avatar' src='#{@profile_image_url}' /></span>"
	get_link_html: ->
		"<span class='poster'><a href='https://twitter.com/#{@screen_name}' target='_blank'>#{@screen_name}</a></span>"

class TwitterMessage
	constructor: (@data) ->
		@sender = new Sender(@data.sender)
	
class window.Tweet extends TwitterMessage
	constructor: (data) ->
		super(data)
		@sender = new Sender(@data.user)
		window.tweets[@id()] = this

	id: -> @data.id_str
	div_id: -> "#tweet_#{@id()}"
	get_html: ->
		"<div id='#{@id()}'>" +
		@sender.get_avatar_html() +
		@sender.get_link_html() +
		"</div>"