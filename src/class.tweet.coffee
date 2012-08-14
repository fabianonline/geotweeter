class Tweet extends TwitterMessage
	# static variables
	@last: null
	
	mentions: []
	replies: []
	account: null
	thumbs: []
	id: null
	permalink: ""
	data: {}
	text: ""
	original_text: ""
	entities: {}
	date: null
	retweeted_by: null
	in_reply_to: null
	
	constructor: (data, @account) ->
		@mentions = []
		@replies = []
		@thumbs = []
		@data = data
		@id = data.id_str
		@fill_user_variables()
		@save_as_last_message()
		@permalink = "https://twitter.com/#{@sender.screen_name}/status/#{@id}"
		@original_text = if data.retweeted_status? then data.retweeted_status.text else data.text
		@text = @original_text
		@entities = if data.retweeted_status? then data.retweeted_status.entities else data.entities
		@linkify_text()
		@get_thumbnails()
		@date = new Date(@data.created_at)
		#@add_to_collections()
		
	add_to_collections: ->
		@account.tweets[@id] = this
		Application.all_tweets[@id] = this
		if @data.in_reply_to_status_id_str
			tweet = Application.all_tweets[@data.in_reply_to_status_id_str]
			@in_reply_to = tweet
			tweet.replies.push(this) if tweet?
	
	fill_user_variables: -> 
		if @data.retweeted_status?
			@sender = new User(@data.retweeted_status.user)
			@retweeted_by = new User(@data.user)
		else
			@sender = new User(@data.user)
	
	save_as_last_message: -> Tweet.last = this
		
	get_date: -> @date
	div_id: -> "##{@id}"
	get_html: ->
		return "" if @is_ignoreable_tweet()
		
		html = $("<div id='#{@id}' class='#{@get_classes().join(" ")}' data-tweet-id='#{@id}' data-account-id='#{@account.id}'>" +
			@get_single_thumb_html() +
			@get_sender_html() +
			"<span class='text'>#{@text}</span>" +
			@get_multi_thumb_html() +
			@get_permanent_info_html() +
			@get_temporary_info_html() +
			"<div style='clear: both;'></div>" +
			"</div>")
		$(html).find('.lightbox').lightBox({
			imageLoading: "icons/lightbox-ico-loading.gif"
			imageBtnClose: "icons/lightbox-btn-close.gif"
			imageBtnPrev: "icons/lightbox-btn-prev.gif"
			imageBtnNext: "icons/lightbox-btn-next.gif"
			imageBlank: "icons/lightbox-blank.gif"
		})
		return html
	
	is_ignoreable_tweet: ->
		# Word based Blacklist
		return true for entry in settings.muted_strings when @original_text.toLowerCase().indexOf(entry.toLowerCase()) isnt -1
		# Sender based Blacklist
		return true for entry in settings.muted_users when @sender.get_screen_name().toLowerCase().indexOf(entry.toLowerCase()) isnt -1
		# Troll based Blacklist
		return true for entry in settings.muted_combinations when @sender.get_screen_name().toLowerCase().indexOf(entry.user.toLowerCase()) isnt -1 and @original_text.toLowerCase().indexOf(entry.string.toLowerCase()) isnt -1
		
		# default - return false
		return false
	
	isWordOnBlacklist: -> 
		for entry in settings.blacklist 
			return 1 if @original_text.toLowerCase().indexOf(entry)!=-1 
		return 0
		
	isSenderOnBlacklist: ->
		for entry in settings.muted 
			return 1 if @sender.get_screen_name().toLowerCase().indexOf(entry)!=-1 
		return 0
		
	isTroll: ->
		for entry in settings.troll 
			if @sender.get_screen_name().toLowerCase().indexOf(entry)!=-1 
				for entry in settings.trigger
					return 1 if @original_text.toLowerCase().indexOf(entry)!=-1
		return 0
	
		
		
	
	get_sender_html: -> @sender.get_avatar_html() + @sender.get_link_html()
		
	get_permanent_info_html: ->
		@get_retweet_html() +
		@get_place_html()
	
	get_temporary_info_html: ->
		"<div class='info'>" +
		"<a href='#{@permalink}' target='_blank'>#{@date.format("%d.%m.%Y %H:%M")}</a> #{@get_reply_to_info_html()} #{@get_source_html()}" + 
		"</div>"

	get_menu_items: (clicked_element) ->
		array = []
		array.push {name: "Send to Instapaper",         icon: "icons/newspaper_add.png",             separator_below: true, action: (elm) => Tweet.hooks.send_link_to_instapaper(elm, event.target) } if event? && event.target? && $(event.target).is('a.external') && settings.instapaper_credentials.user.length>0
		array.push {name: "Reply",                      icon: "icons/comments.png",                  action: (elm) -> Tweet.hooks.reply(elm)}
		array.push {name: "Retweet",                    icon: "icons/arrow_rotate_clockwise.png",    action: (elm) -> Tweet.hooks.retweet(elm)}
		array.push {name: "Quote",                      icon: "icons/tag.png",                       action: (elm) -> Tweet.hooks.quote(elm)}
		array.push {name: "Favorisieren",               icon: "icons/star_gray.png",                 action: (elm) -> Tweet.hooks.toggle_favorite(elm)} unless @data.favorited
		array.push {name: "Favorisierung entfernen",    icon: "icons/star.png",                      action: (elm) -> Tweet.hooks.toggle_favorite(elm)} if @data.favorited
		array.push {name: "Permalink",                  icon: "icons/link.png",                      separator_below: true, url: @permalink}
		array.push {name: "Geotag",                     icon: "icons/world.png",                     url: "http://maps.google.com/?q=#{@data.coordinates.coordinates[1]},#{@data.coordinates.coordinates[0]}"} if @data.coordinates?
		array.push {name: "Alle Geotags",               icon: "icons/world_add.png",                 separator_below: true, url: "http://maps.google.com/?q=http%3A%2F%2Fapi.twitter.com%2F1%2Fstatuses%2Fuser_timeline%2F#{@sender.screen_name}.atom%3Fcount%3D250"} if @data.coordinates?
		array.push {name: "Tweet löschen",              icon: "icons/cross.png",                     action: (elm) -> Tweet.hooks.delete(elm)} if @account.user.id==@sender.id
		array.push {name: "Als Spammer melden",         icon: "icons/exclamation.png",               action: (elm) -> Tweet.hooks.report_as_spam(elm)} unless @account.user.id==@sender.id
		array.push {name: "Tweet debuggen",             icon: "icons/bug.png",                       separator_above: true, action: (elm) -> Tweet.hooks.debug(elm)}
		return array
	
	get_single_thumb_html: ->
		return "" unless @thumbs.length==1
		return @thumbs[0].get_single_thumb_html()
	
	get_multi_thumb_html: ->
		return "" unless @thumbs.length>1
		html = "<div class='media'>"
		html += thumb.get_multi_thumb_html() for thumb in @thumbs
		html += "</div>"
		return html
	
	get_source_html: ->
		return "" unless @data.source?
		obj = $(@data.source)
		return "from <a href='#{obj.attr('href')}' target='_blank'>#{obj.html()}</a>" if obj.attr('href')
		return "from #{@data.source}"
		
	get_retweet_html: -> 
		return "" unless @retweeted_by?
		"<div class='retweet_info'>Retweeted by <a href='#{@retweeted_by.permalink}' target='_blank'>#{@retweeted_by.screen_name}</a></div>"
	
	get_place_html: ->
		return "" unless @data.place?
		"<div class='place'>from <a href='http://twitter.com/#!/places/#{@data.place.id}' target='_blank'>#{@data.place.full_name}</a></div>"
	
	get_reply_to_info_html: ->
		return "" unless @data.in_reply_to_status_id?
		"<a href='#' onClick='return Tweet.hooks.show_replies(this);'>in reply to...</a> "
	
	linkify_text: ->
		if @entities?
			all_entities = []
			for entity_type, entities of @entities
				for entity in entities
					entity.type=entity_type
					all_entities.push(entity)
			all_entities = all_entities.sort((a, b) -> a.indices[0] - b.indices[0]).reverse()
			for entity in all_entities
				switch entity.type
					when "user_mentions"
						@mentions.push entity.screen_name
						@replace_entity(entity, "<a href='https://twitter.com/#{entity.screen_name}' target='_blank' class='external'>@#{entity.screen_name}</a>")
					when "urls", "media"
						if entity.expanded_url?
							@replace_entity(entity, "<a href='#{entity.expanded_url}' class='external' target='_blank' class='external'>#{entity.display_url}</a>")
						else
							@replace_entity(entity, "<a href='#{entity.url}' class='external' target='_blank' class='external'>#{entity.url}</a>")
					when "hashtags"
						@replace_entity(entity, "<a href='https://twitter.com/#!/search/%23#{entity.text}' target='_blank' class='external'>##{entity.text}</a>")
						Application.add_to_autocomplete("##{entity.text}")
		@text = @text.trim().replace(/\n/g, "<br />")
		@text = @text.replace(/[^\/>](GC[A-Z0-9]+)\b/g, " <a href='http://coords.info/$1' target='_blank' class='external'>$1</a>")
	
	replace_entity: (entity_object, text) -> @text = @text.slice(0, entity_object.indices[0]) + text + @text.slice(entity_object.indices[1])
	
	get_classes: ->
		classes = [
			"tweet"
			"by_#{@data.user.screen_name}"
			"new" if @account.is_unread_tweet(@id)
			"mentions_this_user" if @account.screen_name in @mentions
			"by_this_user" if @account.screen_name == @sender.screen_name
			"favorited" if @data.favorited
		]
		classes.push("mentions_#{mention}") for mention in @mentions
		classes
	
	retweet: ->
		return unless confirm("Wirklich retweeten?")
		@account.twitter_request("statuses/retweet/#{@id}.json", {success_string: "Retweet erfolgreich"})
	
	quote: ->
		Application.set_text("RT @#{@sender.screen_name}: #{@original_text}")
		Application.reply_to(this)
	
	delete: ->
		return unless confirm("Wirklich diesen Tweet löschen?")
		@account.twitter_request("statuses/destroy/#{@id}.json", {success_string: "Tweet gelöscht", success: => $(@div_id()).remove()})
	
	toggle_favorite: ->
		if @data.favorited
			@account.twitter_request("favorites/destroy/#{@id}.json", {
				silent: true
				success: => 
					$(@div_id()).removeClass('favorited')
					$("#{@div_id()} .favorite_button").attr('title', 'Favorisieren').attr('src', 'icons/star_gray.png')
					@data.favorited = false
			})	
		else
			@account.twitter_request("favorites/create/#{@id}.json", {
				silent: true
				success: => 
					$(@div_id()).addClass('favorited')
					$("#{@div_id()} .favorite_button").attr('title', 'Favorisierung entfernen').attr('src', 'icons/star.png')
					@data.favorited = true
			})
	
	report_as_spam: -> @sender.report_as_spam(@account)
	
	reply: ->
		Application.set_dm_recipient_name(null)
		if @sender.screen_name==@account.screen_name && @in_reply_to?
			Application.reply_to(@in_reply_to)
		else
			Application.reply_to(this)
		mentions = []
		mentions.push("@#{@sender.screen_name}") unless @sender.screen_name==@account.screen_name
		mentions.push("@#{mention}") for mention in @mentions.reverse() when mention!=@sender.screen_name && mention!=@account.screen_name
		sender = mentions.shift()
		mentions = mentions.join(" ") + (if mentions.length>0 then " " else "")
		if sender
			Application.set_text("#{sender} #{mentions}")
			$('#text')[0].selectionStart = sender.length+1
			$('#text')[0].selectionEnd = sender.length+1 + mentions.length
		$('#text').focus()
	
	get_thumbnails: ->
		@thumbs = []
		return unless @data.entities?
		if @data.entities.media?
			for media in @data.entities.media
				@thumbs.push(new Thumbnail("#{media.media_url_https}:thumb", media.expanded_url, "#{media.media_url_https}:medium"))
		if @data.entities.urls?
			for entity in @data.entities.urls
				url = entity.expanded_url ? entity.url
				thumb = Tweet.url_to_thumbnail(url)
				@thumbs.push(thumb) if thumb?
	
	@url_to_thumbnail: (url) ->
		# Definitions for the thumbnails.
		# The "//something.com" notation is actually valid HTTP: The double-slash
		# at the beginning means as much as "us the current protocol". So, if the
		# Geotweeter is used via HTTPS, this links will lead to the HTTPS versions
		# of the files, otherwise the HTTP version will be used. Automagically. :D
		# Note that not all of the services offer HTTPS versions, hence the differences.
		return (new Thumbnail("//img.youtube.com/#{res[1]}/1.jpg", url)) if (res=url.match(/(?:http:\/\/(?:www\.)?youtube.com\/.*v=|http:\/\/youtu.be\/)([0-9a-zA-Z_]+)/)) 
		return (new Thumbnail("//twitpic.com/show/mini/#{res[1]}", url, "//twitpic.com/show/large/#{res[1]}")) if (res=url.match(/twitpic.com\/([0-9a-zA-Z]+)/)) 
		return (new Thumbnail("//yfrog.#{res[1]}/#{res[2]}.th.jpg", url, "//yfrog.#{res[1]}/#{res[2]}:medium")) if (res=url.match(/yfrog.(com|us|ru)\/([a-zA-Z0-9]+)/)) # http://yfrog.com/page/api#a5
		return (new Thumbnail("//api.plixi.com/api/tpapi.svc/imagefromurl?url=#{url}&size=thumbnail", url, "//api.plixi.com/api/tpapi.svc/imagefromurl?url=#{url}&size=medium")) if (res=url.match(/lockerz.com\/s\/[0-9]+/)) # http://support.lockerz.com/entries/350297-image-from-url
		return (new Thumbnail("http://moby.to/#{res[1]}:square", url, "http://moby.to/#{res[1]}:medium")) if (res=url.match(/moby\.to\/([a-zA-Z0-9]+)/)) # http://developers.mobypicture.com/documentation/additional/inline-thumbnails/
		return (new Thumbnail("http://ragefac.es/#{res[1]}/i", url, "http://ragefac.es/#{res[1]}/i")) if (res=url.match(/ragefac\.es\/(?:mobile\/)?([0-9]+)/))
		return (new Thumbnail("http://lauerfac.es/#{res[1]}/thumb", url, "http://lauerfac.es/#{res[1]}/full")) if (res=url.match(/lauerfac\.es\/([0-9]+)/)) 
		return (new Thumbnail("http://ponyfac.es/#{res[1]}/thumb", url, "http://ponyfac.es/#{res[1]}/full")) if (res=url.match(/ponyfac\.es\/([0-9]+)/))
		return (new Thumbnail("http://flic.kr/p/img/#{encdec().encode(res[1])}_s.jpg", url, "http://flic.kr/p/img/#{encdec().encode(res[1])}_z.jpg")) if (res=url.match(/flickr.com\/photos\/[^\/]+\/([0-9]+)/)) # http://www.flickr.com/services/api/misc.urls.html
		return (new Thumbnail("http://flic.kr/p/img/#{encdec().encode(res[1])}_s.jpg", url, "http://flic.kr/p/img/#{encdec().encode(res[1])}_z.jpg")) if (res=url.match(/static.flickr.com\/[0-9]+\/([0-9]+)_/)) # http://www.flickr.com/services/api/misc.urls.html
		return (new Thumbnail("http://flic.kr/p/img/#{res[1]}_s.jpg", url, "http://flic.kr/p/img/#{res[1]}_z.jpg")) if (res=url.match(/flic.kr\/p\/(.+)/)) # http://www.flickr.com/services/api/misc.urls.html
		return (new Thumbnail("http://#{res[1]}.imgur.com/#{res[2]}s.jpg", url, "http://#{res[1]}.imgur.com/#{res[2]}l.jpg")) if (res=url.match(/http:\/\/([^\/]+)\.imgur\.com\/([a-zA-Z0-9]+)\.jpg/))
		return (new Thumbnail("//instagr.am/p/#{res[1]}/media/?size=t", url, "//instagr.am/p/#{res[1]}/media/?size=m")) if (res=url.match(/(?:instagr\.am|instagram\.com)\/p\/([^\/]+)/))
		
		return null
	
	show_replies: ->
		html = $('<div>')
		tweet = this
		while true
			html.append(tweet.get_html())
			break unless tweet.data.in_reply_to_status_id_str?
			new_id = tweet.data.in_reply_to_status_id_str
			tweet = @account.tweets[new_id]
			unless tweet?
				html.append($('<div id="info_spinner"><img src="icons/spinner_big.gif" /></div>'))
				@fetch_reply(new_id)
				break
		Application.infoarea.show("Replies", html)
	
	fetch_reply: (id) ->
		@account.twitter_request('statuses/show.json', {
			parameters: {id: id, include_entities: true}
			silent: true
			method: "GET"
			success: (foo, data) =>
				tweet = new Tweet(data, @account)
				$('#info_spinner').before($(tweet.get_html()).hide().fadeIn())
				if Application.infoarea.visible && tweet.data.in_reply_to_status_id_str
					@fetch_reply(tweet.data.in_reply_to_status_id_str)
				else
					$('#info_spinner').remove()
			error: (foo, fata) =>
				debugger;
		})
	
	debug: -> 
		window.tweet = this
		console.dir(this)
		alert("Objekt wurde auf der JS-Konsole ausgegeben und ist in der globalen Variable tweet gespeichert.")
	
	get_avatar_tooltip: -> "
		<strong>#{@sender.data.name}</strong><br />
		<br />
		Tweets: #{@sender.data.statuses_count}<br />
		Followers: #{@sender.data.followers_count}<br />
		Friends: #{@sender.data.friends_count}<br />
		<br />
		@#{@sender.screen_name} folgt dir#{if @account.followers_ids.indexOf(@sender.id)==-1 then " nicht" else ""}.
	"

	@hooks: {
		get_tweet: (element) -> 
			tweet_div = if element.filter? && element.filter(".tweet").length==1 then element else $(element).parents('.tweet')
			Application.accounts[tweet_div.attr('data-account-id')].get_tweet(tweet_div.attr('data-tweet-id'))
		
		reply:          (elm) -> @get_tweet(elm).reply(); return false
		retweet:        (elm) -> @get_tweet(elm).retweet(); return false
		quote:          (elm) -> @get_tweet(elm).quote(); return false
		toggle_favorite:(elm) -> @get_tweet(elm).toggle_favorite(); return false
		delete:         (elm) -> @get_tweet(elm).delete(); return false
		report_as_spam: (elm) -> @get_tweet(elm).report_as_spam(); return false
		show_replies:   (elm) -> @get_tweet(elm).show_replies(); return false
		get_menu_items: (elm) -> return @get_tweet(elm).get_menu_items(elm);
		debug:          (elm) -> @get_tweet(elm).debug(); return false
		
		avatar_tooltip: (elm) -> @get_tweet(elm).get_avatar_tooltip();
		
		send_link_to_instapaper: (elm, link) ->
			tweet = @get_tweet(elm)
			url = $(link).attr('href')
			$.post("proxy/instapaper/add", {
					username: settings.instapaper_credentials.user,
					password: settings.instapaper_credentials.password,
					url: url,
					selection: "@#{tweet.sender.screen_name}: #{tweet.original_text} - #{tweet.permalink}"
				})
			return false
		
		# called by the tweet button
		send: ->
			# event is a global variable. preventDefault() prevents the form from being submitted after this function returned
			event.preventDefault() if event?
			parameters = {
				status: $('#text').val().trim()
				wrap_links: true
			}
			
			show_progress = false
			
			if settings.places.length > 0 && (placeindex=document.tweet_form.place.value-1)>=0
				place = settings.places[placeindex]
				parameters.lat = place.lat + (((Math.random()*300)-15)*0.000001)
				parameters.lon = place.lon + (((Math.random()*300)-15)*0.000001)
				parameters.place_id = place.place_id if place.place_id?
				parameters.display_coordinates = true
			parameters.in_reply_to_status_id = Application.reply_to().id if Application.reply_to()?
			
			if Application.attached_files.length > 0
				data = Application.current_account.sign_request("https://upload.twitter.com/1/statuses/update_with_media.json", "POST", null)
				url = "proxy/upload/statuses/update_with_media.json?#{data}"
				content_type = false
				data = new FormData()
				data.append("media[]", Application.attached_files[0])
				data.append(key, value) for key, value of parameters
				show_progress = true
			else
				data = Application.current_account.sign_request("https://api.twitter.com/1/statuses/update.json", "POST", parameters)
				url = "proxy/api/statuses/update.json"
				content_type = "application/x-www-form-urlencoded"
			$('#form').fadeTo(500, 0)
			$('#progress').fadeIn(500) if show_progress
			
			$.ajax({
				url: url
				data: data
				processData: false
				contentType: content_type
				async: true
				dataType: "json"
				type: "POST"
				xhr: ->
					xhr = jQuery.ajaxSettings.xhr()
					xhr.upload?.addEventListener?("progress", (evt) -> 
						$('#progress_bar').attr('value', (evt.loaded/evt.total*100))
						return true
					)
					return xhr
				success: (data) ->
					$('#progress').fadeOut(500)
					if data.text
						html = "
							Tweet-ID: #{data.id_str}<br />
							Mein Tweet Nummer: #{data.user.statuses_count}<br />
							Follower: #{data.user.followers_count}<br />
							Friends: #{data.user.friends_count}<br />"
						$('#text').val('')
						Hooks.update_counter()
						Application.reply_to(null)
						Application.attached_files = []
						Application.update_file_display()
						$('#success_info').html(html)
						$('#success').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
					else
						$('#failure_info').html(data.error);
						$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
				error: (req) ->
					$('#progress').fadeOut(500)
					info = "Error #{req.status} (#{req.statusText})"
					try additional = $.parseJSON(req.responseText)
					info += "<br /><strong>#{additional.error}</strong>" if additional?.error?
					$('#failure_info').html(info)
					$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
			})
			
			return false
	}
