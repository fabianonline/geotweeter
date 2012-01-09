class Hooks
	@display_file: false
	@time_of_last_enter: new Date()
	@update_counter: ->
		if event? && event.type? && event.type == "keyup" && event.which == 13
			# user pressed enter. check the time since last press of enter...
			now = new Date()
			if now - @time_of_last_enter <= settings.timings.max_double_enter_time
				event.preventDefault()
				$('#text').val(@text_before_enter)
				Hooks.send()
				return
			@text_before_enter = $('#text').val()
			@time_of_last_enter = now
		text = $('#text').val() # don't trim just yet
		if !Application.get_dm_recipient_name()? && parts=text.match(/^d @?(\w+) (.*)$/i)
			Application.set_dm_recipient_name(parts[1])
			text = parts[2]
			$('#text').val(text)
		color = '#0b0'
		text = text.trim()
		length = text.length
		length += characters_reserved_per_media + 1 if $('#file')[0].files[0]
		urls = text.match(/((https?:\/\/)(([^ :]+(:[^ ]+)?@)?[a-zäüöß0-9]([a-zäöüß0-9i\-]{0,61}[a-zäöüß0-9])?(\.[a-zäöüß0-9]([a-zäöüß0-9\-]{0,61}[a-zäöüß0-9])?){0,32}\.[a-z]{2,5}(\/[^ \"@\n]*[^" \.,;\)@\n])?))/ig)
		for url in urls ? []
			length -= url.length
			length += if url.slice(0,5)=="https" then Application.twitter_config.short_url_length_https else Application.twitter_config.short_url_length_http
		color = '#f00' if length>140
		$('#counter').html(140-length)
		$('#counter').css('color', color)
		reply = Application.get_reply_to_tweet()
		

		
	@send: -> if Application.get_dm_recipient_name()? then DirectMessage.hooks.send() else Tweet.hooks.send()
	@cancel_dm: ->
		receiver = Application.get_dm_recipient_name()
		Application.set_dm_recipient_name(null)
		$('#text').val("@#{receiver} #{$('#text').val()}")
	
	@toggle_file: (new_value) ->
		if new_value?
			@display_file = new_value
		else
			@display_file = !@display_file
		$('#file_div').toggle(@display_file)
		$('#file').val('') unless @display_file
		return false
	
	@check_file: ->
		file = $('#file')[0].files[0]
		error = false
		return unless file?
		if file.fileSize > Application.twitter_config.photo_size_limit
			alert("Die Datei ist zu groß.\n\nDateigröße:\t#{file.fileSize} Bytes\nMaximum:\t#{Application.twitter_config.photo_size_limit} Bytes")
			error = true
		else if $.inArray(file.type, ["image/png", "image/gif", "image/jpeg"])==-1
			alert("Der Dateityp #{file.type} wird von Twitter nicht akzeptiert.")
			error = true
		$('#file').val('') if error