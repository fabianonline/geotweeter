tweets = {}
users = {}


class User
	constructor: (@data) ->
		users[@data.id()] = this
		
	id: -> @data.id_str
	get_avatar_html: -> "<span class='avatar'><img class='user_avatar' src='#{@data.profile_image_url}' /></span>"
	get_link_html: -> "<span class='poster'><a href='https://twitter.com/#{@data.screen_name}' target='_blank'>#{@data.screen_name}</a></span>"

class TwitterMessage
	constructor: (@data) -> @sender = new Sender(@data.sender)

class window.Tweet extends TwitterMessage
	@mentions = []
	
	constructor: (data) ->
		super(data)
		@sender = new User(data.user)
		tweets[@id()] = this
		@text = data.status
		@linkify()
	
	id: -> @data.id_str
	div_id: -> "#tweet_#{@id()}"
	get_html: ->
		"<div id='#{@id()}'>" +
		@sender.get_avatar_html() +
		@sender.get_link_html() +
		@text +
		@get_info_html() +
		@get_buttons_html() +
		"</div>"
	
	get_info_html: -> // TODO
	
	get_buttons_html: -> // TODO
	
	linkify: ->
		if @data.entities?
			all_entities = []
			for entity_type, entities of @data.entities
				for entity in entities
					entity.type=entity_type
					all_entities.push(entity)
			all_entities = all_entities.sort((a, b) -> a.indices[0] - b.indices[0]).reverse()
			for entity in all_entities
				switch entity.type
					when "user_mentions"
						@mentions.push entity.screen_name
						@replace_entity(entity, "<a href='https://twitter.com/#{entity.screen_name}' target='_blank'>@#{entity.screen_name}</a>")
					when "urls", "media"
						if entity.expanded_url?
							@replace_entity(entity, "<a href='#{entity.expanded_url}' class='external' target='_blank'>#{entity.display_url}</a>")
						else
							@replace_entity(entity, "<a href='#{entity.url}' class='external' target='_blank'>#{entity.url}</a>")
					when "hashtags"
						@replace_entity(entity, "<a href='https://twitter.com/search?q=##{entity.text}' target='_blank'>##{entity.text}</a>")
	
	replace_entity: (entity_object, text) -> @text = @text.slice(0, entity_object.indices[0]) + text + @text.slice(entity_object.indices[1])

class Account
	constructor: (settings_id) -> @id=settings_id
	my_element: $('#content_'+@id())
	
	set_maxread_id: -> // TODO
	
	get_maxread_id: -> // TODO
	
	mark_as_read: -> // TODO
	
	twitter_request: () -> // TODO
