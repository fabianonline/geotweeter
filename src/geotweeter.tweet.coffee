class window.Tweet extends TwitterMessage
	mentions = []
	account = null
	
	constructor: (data, @account) ->
		super(data)
		@sender = new User(data.user)
		tweets[@id()] = this
		@text = data.status
		@linkify_text()
	
	id: -> @data.id_str
	div_id: -> "#tweet_#{@id()}"
	get_html: ->
		"<div id='#{@id()}' class='#{@get_classes().join(" ")}'>" +
		@sender.get_avatar_html() +
		@sender.get_link_html() +
		@text +
		@get_info_html() +
		@get_buttons_html() +
		"</div>"
	
	get_info_html: -> # TODO
	
	get_buttons_html: -> # TODO
	
	linkify_text: ->
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
		@text = @text.replace(/\n/g, "<br />\n")
	
	replace_entity: (entity_object, text) -> @text = @text.slice(0, entity_object.indices[0]) + text + @text.slice(entity_object.indices[1])
	get_type: -> "tweet"
	
	get_classes: ->
		classes = [
			@get_type()
			"by_#{@data.user.screen_name}"
			"new" if @account.is_unread_tweet(@data.id_str)
			"mentions_this_user" if @account.screen_name in @mentions
			"by_this_user" if @account.screen_name == @data.user.screen_name
		]
		classes.push("mentions_#{mention}") for mention in @mentions
		classes
