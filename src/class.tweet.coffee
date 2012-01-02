class Tweet extends TwitterMessage
	mentions: []
	account: null
	thumbs: []
	
	constructor: (data, @account) ->
		@data = data
		@sender = new User(@get_user_data())
		@account.tweets[@get_id()] = this
		@text = data.text
		@linkify_text()
		@thumbs = @get_thumbnails()
		@date = new Date(@data.created_at)
	
	get_user_data: -> @data.retweeted_status?.user ? @data.user
	get_id: -> @data.id_str
	get_date: -> @date
	div_id: -> "#tweet_#{@get_id()}"
	get_html: ->
		"<div id='#{@get_id()}' class='#{@get_classes().join(" ")}' data-tweet-id='#{@get_id()}' data-account-id='#{@account.get_id()}'>" +
		@sender.get_avatar_html() +
		@sender.get_link_html() +
		"<span class='text'>#{@text}</span>" +
		@get_info_html() +
		@get_buttons_html() +
		"</div>"
	
	get_info_html: -> # TODO
	
	get_buttons_html: -> # TODO
	
	linkify_text: ->
		@mentions = [] # hack to prevent semi-static array mentions from filling up
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
	
	get_classes: ->
		classes = [
			"tweet"
			"by_#{@data.user.screen_name}"
			"new" if @account.is_unread_tweet(@get_id())
			"mentions_this_user" if @account.screen_name in @mentions
			"by_this_user" if @account.screen_name == @data.user.screen_name
		]
		classes.push("mentions_#{mention}") for mention in @mentions
		classes
	
	retweet: ->
		return unless confirm("Wirklich retweeten?")
		@account.twitter_request("statuses/retweet/#{get_id()}.json", {success_string: "Retweet erfolgreich"})
	
	delete: ->
		return unless confirm("Wirklich diesen Tweet löschen?")
		@account.twitter_request("statuses/destroy/#{get_id()}.json", {success_string: "Tweet gelöscht", success: -> $(@div_id()).remove()})
	
	get_thumbnails: ->
		for media in @data.entities?.media?
			@thumbs.push(new Thumbnail("#{media.media_url_https}:thumb", media.expanded_url))
		for entity in @data.entities?.urls?
			url = entity.expanded_url
			thumbs.push(new Thumbnail("http://img.youtube.com/#{res[1]}/1.jpg", url)) if (res=url.match(/(?:http:\/\/(?:www\.)youtube.com\/.*v=|http:\/\/youtu.be\/)([0-9a-zA-Z_]+)/)) 
			thumbs.push(new Thumbnail("http://twitpic.com/show/mini/#{res[1]}", url)) if (res=url.match(/twitpic.com\/([0-9a-zA-Z]+)/)) 
			thumbs.push(new Thumbnail("http://yfrog.com/#{res[1]}.th.jpg", url)) if (res=url.match(/yfrog.com\/([a-zA-Z0-9]+)/)) 
			thumbs.push(new Thumbnail("http://api.plixi.com/api/tpapi.svc/imagefromurl?url=#{url}&size=thumbnail", url)) if (res=url.match(/lockerz.com\/s\/[0-9]+/)) 
			thumbs.push(new Thumbnail("http://moby.to/#{res[1]}:square", url)) if (res=url.match(/moby\.to\/([a-zA-Z0-9]+)/)) 
			thumbs.push(new Thumbnail("http://ragefac.es/#{res[1]}/i", url)) if (res=url.match(/ragefac\.es\/(?:mobile\/)?([0-9]+)/))
			thumbs.push(new Thumbnail("http://lauerfac.es/#{res[1]}/thumb", url)) if (res=url.match(/lauerfac\.es\/([0-9]+)/)) 
			thumbs.push(new Thumbnail("http://ponyfac.es/#{res[1]}/thumb", url)) if (res=url.match(/ponyfac\.es\/([0-9]+)/)) 
		return