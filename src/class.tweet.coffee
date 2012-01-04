class Tweet extends TwitterMessage
	mentions: []
	account: null
	thumbs: []
	id: null
	permalink: ""
	
	constructor: (data, @account) ->
		@data = data
		@id = data.id_str
		@sender = new User(@get_user_data())
		@permalink = "https://twitter.com/#{@sender.screen_name}/status/#{@id}"
		@account.tweets[@id] = this
		@text = data.text
		@linkify_text()
		@thumbs = @get_thumbnails()
		@date = new Date(@data.created_at)
		format = Application.add_null
		@nice_date = "#{format(@date.getDate())}.#{format(@date.getMonth()+1)}.#{@date.getYear()+1900} #{format(@date.getHours())}:#{format(@date.getMinutes())}";
	
	get_user_data: -> @data.retweeted_status?.user ? @data.user
	get_date: -> @date
	div_id: -> "#tweet_#{@id}"
	get_html: ->
		"<div id='#{@id}' class='#{@get_classes().join(" ")}' data-tweet-id='#{@id}' data-account-id='#{@account.id}'>" +
		@sender.get_avatar_html() +
		@sender.get_link_html() +
		"<span class='text'>#{@text}</span>" +
		@get_permanent_info_html() +
		@get_overlay_html() +
		"</div>"
		
	get_permanent_info_html: ->
		@get_retweet_html() +
		@get_place_html()
	
	get_overlay_html: -> 
		"<div class='overlay'>" +
		@get_temporary_info_html() +
		@get_buttons_html() +
		"</div>"
	
	get_temporary_info_html: ->
		"<div class='info'>" +
		"<a href='#{@permalink}' target='_blank'>#{@nice_date}</a> #{@get_reply_to_info_html()} #{@get_source_html()}" + 
		"</div>"
			
	get_buttons_html: ->
		"<a href='#' onClick='Tweet.hooks.reply(this);'><img src='icons/comments.png' title='Reply' /></a>" +
		"<a href='#' onClick='Tweet.hooks.retweet(this);'><img src='icons/arrow_rotate_clockwise.png' title='Retweet' /></a>" +
		"<a href='#' onClick='Tweet.hooks.quote(this);'><img src='icons/tag.png' title='Quote' /></a>" +
		"<a href='#{@permalink}' target='_blank'><img src='icons/link.png' title='Permalink' /></a>" +
		(if @data.coordinates? then "<a href='http://maps.google.com/?q=#{@data.coordinates.coordinates[1]},#{@data.coordinates.coordinates[0]}' target='_blank'><img src='icons/world.png' title='Geotag' /></a>" else "") +
		(if @data.coordinates? then "<a href='http://maps.google.com/?q=http%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fuser_timeline%2F#{@sender.screen_name}.atom%3Fcount%3D250' target='_blank'><img src='icons/world_add.png' title='All Geotags' /></a>" else "") +
		(if @account.screen_name==@sender.screen_name then "<a href='#' onClick='Tweet.hooks.delete(this);'><img src='icons/cross.png' title='Delete' /></a>" else "") +
		(if @account.screen_name!=@sender.screen_name then "<a href='#' onClick='Tweet.hooks.report_as_spam(this);'><img src='icons/exclamation.png' title='Block and report as spam' /></a>" else "")
		
	get_source_html: ->
		return "" unless @data.source?
		obj = $(@data.source)
		return "from <a href='#{obj.attr('href')}' target='_blank'>#{obj.html()}</a>" if obj.attr('href')
		return "from #{@data.source}"
		
	get_retweet_html: -> 
		return "" unless @data.retweeted_status?
		"<div class='retweet_info'>Retweeted by <a href='http://twitter.com/#{@data.retweeted_status.user.screen_name}' target='_blank'>#{@data.retweeted_status.user.screen_name}</a></div>"
	
	get_place_html: ->
		return "" unless @data.place?
		"<div class='place'>from <a href='http://twitter.com/#!/places/#{@data.place.id}' target='_blank'>#{@data.place.full_name}</a></div>"
	
	get_reply_to_info_html: ->
		return "" unless @data.in_reply_to_status_id?
		"<a href='#' onClick='Hooks.show_replies(); return false;'>in reply to...</a> "
	
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
			"new" if @account.is_unread_tweet(@id)
			"mentions_this_user" if @account.screen_name in @mentions
			"by_this_user" if @account.screen_name == @sender.screen_name
		]
		classes.push("mentions_#{mention}") for mention in @mentions
		classes
	
	retweet: ->
		return unless confirm("Wirklich retweeten?")
		@account.twitter_request("statuses/retweet/#{@id}.json", {success_string: "Retweet erfolgreich"})
	
	delete: ->
		return unless confirm("Wirklich diesen Tweet löschen?")
		@account.twitter_request("statuses/destroy/#{@id}.json", {success_string: "Tweet gelöscht", success: -> $(@div_id()).remove()})
	
	report_as_spam: -> @sender.report_as_spam(@account)
	
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
	
	@hooks: {
		get_tweet: (element) -> 
			tweet_div = $(element).parents('.tweet')
			Application.accounts[tweet_div.attr('data-account-id')].get_tweet(tweet_div.attr('data-tweet-id'))
		
		reply:          (elm) -> @get_tweet(elm).reply(); return false
		retweet:        (elm) -> @get_tweet(elm).retweet(); return false
		quote:          (elm) -> @get_tweet(elm).quote(); return false
		delete:         (elm) -> @get_tweet(elm).delete(); return false
		report_as_spam: (elm) -> @get_tweet(elm).report_as_spam(); return false
	}
