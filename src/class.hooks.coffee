class Hooks
	@display_file: false
	@time_of_last_enter: new Date()
	@text_before_enter: ""
	@update_counter: (event) ->
		if event? && event.type? && event.type == "keyup" && event.which == 13
			# user pressed enter. check the time since last press of enter...
			now = new Date()
			if now - @time_of_last_enter <= settings.timings.max_double_enter_time
				event.preventDefault()
				$('#text').val(Hooks.text_before_enter)
				Hooks.send()
				return
			@time_of_last_enter = now
		else
			Hooks.text_before_enter = $('#text').val()
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
				<li><a href='#' onClick='return Hooks.add_user_1();'>User</a><br />
					Fügt einen weiteren User zum Geotweeter hinzu.</li>
				<li><a href='#' onClick='return Hooks.add_filter_stream();'>Suche</a><br />
					Fügt einen Stream mit einer Echtzeit-Suche hinzu.</li>
				<li><a href='#' onClick='return Hooks.add_location_1();'>Location</a><br />
					Fügt eine weitere Location hinzu.</li>
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
		$('#filter_keyword').focus()
		$('#filter_keyword').keyup( (event) =>
			@add_filter_stream_2() if event.which==13
		)
		return false
	
	@add_filter_stream_2: ->
		keywords = $('#filter_keyword').val()
		acct = new FilterAccount(Application.current_account, keywords)
		Application.accounts[acct.id] = acct
		Application.infoarea.hide()

	@add_location_1: ->
		html = "
			Bitte die Koordinaten des aktuellen Ortes im Dezimalsystem
			durch Leerzeichen getrennt eingeben. Beispiel: '51,2276 7,5234'.<br />
			Tipp: Das ist exakt das Format, dass bei Google Maps in den
			LatLng-Markern zu finden ist. ;-)<br /><br />
			<input type='text' id='location_coords' />
			<input type='button' value='Go!' onClick='return Hooks.add_location_2();' />"
		Application.infoarea.show("Places suchen", html)
		if navigator.geolocation?
			navigator.geolocation.getCurrentPosition(
				(position) ->
					# success
					$('#location_coords').val("#{position.coords.latitude} #{position.coords.longitude}") unless $('#location_coords').val()!=""
				->
					# error 51,484574 7,415849
					
					# do nothing
			)
		return false
	
	@add_location_2: ->
		parts = $('#location_coords').val().split(" ")
		Application.temp.lat = parts[0].replace(/,/, ".")
		Application.temp.long = parts[1].replace(/,/, ".")
		html = "
			Suche nach Locations...<br />
			<img src='icons/spinner_big.gif' />"
		Application.infoarea.show("Location hinzufügen", html)
		
		Account.first.twitter_request("geo/search.json", {
			silent: true
			parameters: {
				lat: Application.temp.lat
				long: Application.temp.long
				granularity: "poi"
				max_results: 20
			}
			success: (elm, data) ->
				html = "Folgende POIs wurden in der Umgebung der Koordinaten gefunden:<br />
					<ul>"
				for place in data.result.places
					html += "<li><a href='#' onClick=\"return Hooks.add_location_final('#{place.id}');\">#{place.name}</a> (<a href='#' onClick=\"Application.temp.contained_within='#{place.id}'; $('#location_add_hidden').show(); return false;\">umgebend</a>)</li>"
				html += "</ul><br />
					Kein passender Ort dabei? Dann erstellen wir halt einen neuen.<br />
					Bitte zunächst bei einem übergeordneten Place aus der Liste oben auf 'umgebend' klicken.<br />
					<div id='location_add_hidden' style='display: none;'>
					Bitte hier die Bezeichnung für den neuen Ort angeben:<br />
					<input type='text' id='location_place_name' />
					<input type='button' value='Go!' onClick=\"return Hooks.add_location_3();\" />
					</div>"
				$('#infoarea_content').html(html)
		})
		return false
	
	@add_location_3: ->
		Application.temp.name = $('#location_place_name').val()
		Application.infoarea.show("Location erstellen", "<img src='icons/spinner_big.gif' />")
		
		Account.first.twitter_request("geo/similar_places.json", {
			silent: true
			method: "GET"
			parameters: {
				lat: Application.temp.lat
				long: Application.temp.long
				name: Application.temp.name
			}
			success: (elm, data) ->
				Application.temp.token = data.result.token
				if data.result.places.length>0
					html = "Folgende passenden POIs wurden in der Umgebung der Koordinaten gefunden:<br />
						<ul>"
					for place in data.result.places
						html += "<li><a href='#' onClick=\"return Hooks.add_location_final('#{place.id}');\">#{place.name}</a></li>"
					html += "</ul><br /><br />
						War da der gesuchte Punkt wieder nicht bei, können wir ihn auch anlegen. Diesmal dann aber wirklich!<br />
						<a href='#' onClick=\"return Hooks.add_location_4();\">Tu das bitte.</a>"
					$('#infoarea_content').html(html)
				else
					Hooks.add_location_4()
		})
		return false
	
	@add_location_4: ->
		Account.first.twitter_request("geo/place.json", {
			silent: true
			parameters: {
				lat: Application.temp.lat
				long: Application.temp.long
				name: Application.temp.name
				token: Application.temp.token
				contained_within: Application.temp.contained_within
			}
			success: (elm, data) ->
				Hooks.add_location_final(data.id)
		})
	
	@add_location_final: (id) ->
		html = "Bitte folgenden Code zum places-Bereich der Settings hinzufügen:<br />
			<textarea width='70' height='5'>{name:'#{Application.temp.name}', lat:#{Application.temp.lat}, lon:#{Application.temp.long}, place_id:'#{id}'},</textarea><br />
			Anschließend den Geotweeter bitte neu starten."
		Application.infoarea.show("Ort hinzufügen", html)
	
	@add_user_1:->
		Application.infoarea.show("User hinzufügen", "<div id='info_spinner'><img src='icons/spinner_big.gif' /></div>")
		parameters = { oauth_callback: "oob" }
		message = {
			action: "https://api.twitter.com/oauth/request_token",
			method: "POST",
			parameters: parameters
		}
		keys = {
			consumerKey: settings.twitter.consumerKey,
			consumerSecret: settings.twitter.consumerSecret
		}
		OAuth.setTimestampAndNonce(message)
		OAuth.completeRequest(message, keys)
		OAuth.SignatureMethod.sign(message, keys)
		url = "proxy/oauth/request_token"
		data = OAuth.formEncode(message.parameters)
		request = $.ajax({
			url: url,
			data: data,
			dataType: "text",
			async: false,
			type: "POST"
		});
		throw new Exception("o_O") unless request.status==200
		result = request.responseText
		oauth_results = {}
		result = result.split("&")
		(x = x.split("=") ; oauth_results[x[0]] = x[1]) for x in result
		url = "https://api.twitter.com/oauth/authorize?oauth_token=#{oauth_results.oauth_token}&force_login=true"
		html = "
			Bitte folgendem Link folgen, den Geotweeter authorisieren und dann die angezeigte PIN hier eingeben:<br />
			<a href='#{url}' target='_blank'>Geotweeter authorisieren</a><br /><br />
			<input type='text' name='pin' id='pin' />
			<input type='button' value='OK' onClick=\"return Hooks.add_user_2('#{oauth_results.oauth_token}');\" />"
		$('#info_spinner').before(html)
		$('#info_spinner').hide()
	
	@add_user_2: (oauth_token) ->
		pin = $('#pin').val()
		Application.infoarea.show("User hinzufügen", "<div id='info_spinner'><img src='icons/spinner_big.gif' /></div>")
		parameters = { oauth_token: oauth_token, oauth_verifier: pin }
		message = {
			action: "https://api.twitter.com/oauth/access_token",
			method: "POST",
			parameters: parameters
		}
		keys = {
			consumerKey: settings.twitter.consumerKey,
			consumerSecret: settings.twitter.consumerSecret
		}
		OAuth.setTimestampAndNonce(message)
		OAuth.completeRequest(message, keys)
		OAuth.SignatureMethod.sign(message, keys)
		url = "proxy/oauth/access_token"
		data = OAuth.formEncode(message.parameters)
		request = $.ajax({
			url: url,
			data: data,
			dataType: "text",
			async: false,
			type: "POST"
		});
		throw new Exception("o_O") unless request.status==200
		result = request.responseText
		oauth_results = {}
		result = result.split("&")
		(x = x.split("=") ; oauth_results[x[0]] = x[1]) for x in result
		code = "{ // #{oauth_results.screen_name}\n" + 
		       "    token: '#{oauth_results.oauth_token}',\n" +
		       "    tokenSecret: '#{oauth_results.oauth_token_secret}'\n" +
		       "}"
		html = "
			Bitte folgenden Code zur settings.js im Bereich twitter.users hinzufügen:<br />
			<textarea cols='100' rows='4'>#{code}</textarea><br />
			Anschließend den Geotweeter neuladen, damit die Änderungen aktiv werden."
		$('#info_spinner').before(html)
		$('#info_spinner').hide()
		return false