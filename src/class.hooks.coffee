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
			@time_of_last_enter = now
		else
			@text_before_enter = $('#text').val()
		text = $('#text').val() # don't trim just yet
		if !Application.get_dm_recipient_name()? && parts=text.match(/^d @?(\w+) (.*)$/i)
			Application.set_dm_recipient_name(parts[1])
			text = parts[2]
			$('#text').val(text)
		color = '#0b0'
		text = text.trim()
		length = text.length
		length += Application.twitter_config.characters_reserved_per_media + 1 if $('#file')[0].files[0]
		urls = text.match(/((https?:\/\/)(([^ :]+(:[^ ]+)?@)?[a-zäüöß0-9]([a-zäöüß0-9i\-]{0,61}[a-zäöüß0-9])?(\.[a-zäöüß0-9]([a-zäöüß0-9\-]{0,61}[a-zäöüß0-9])?){0,32}\.[a-z]{2,5}(\/[^ \"@\n]*[^" \.,;\)@\n])?))/ig)
		for url in urls ? []
			length -= url.length
			length += if url.slice(0,5)=="https" then Application.twitter_config.short_url_length_https else Application.twitter_config.short_url_length
		color = '#f00' if length>140
		$('#counter').html(140-length)
		$('#counter').css('color', color)
		

		
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
	
	@add: ->
		html = "
			<ul>
				<li><a href='#' onClick='return Hooks.add_user();'>User</a><br />
					Fügt einen weiteren User zum Geotweeter hinzu.</li>
				<li><a href='#' onClick='return Hooks.add_filter_stream();'>Suche</a><br />
					Fügt einen Stream mit einer Echtzeit-Suche hinzu.</li>
			</ul>
		"
		Application.infoarea.show("Hinzufügen", html)
		return false
	
	@add_filter_stream: ->
		html = "
			Nach welchen Begriffen soll gesucht werden?<br />
			Leerzeichen stellen AND, Kommas OR dar.<br />
			Beispiel: 'top gear, topgear'.<br /><br />
			<input type='text' id='filter_keyword' /> 
			<input type='button' value='Go!' onClick='return Hooks.add_filter_stream_2();' />
		"
		Application.infoarea.show("Such-Stream hinzufügen", html)
	
	@add_filter_stream_2: ->
		keywords = $('#filter_keyword').val()
		acct = new FilterAccount(Application.current_account, keywords)
		Application.accounts[acct.id] = acct
		Application.infoarea.hide()
