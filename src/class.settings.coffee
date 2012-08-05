class Settings
	@fields = {}
	@categories = []
	@current_category = null
	@force_restart = false
	@local_storage_key = ""
	
	@add: (category, name, help, object) ->
		object.category = category
		object.name = name
		object.help = help
		
		@fields[category]?={}
		@fields[category][name] = {
			object: object
			help: help
			category: category
			name: name
		}
		@categories.push(category) if @categories.indexOf(category)==-1
	
	@show: (category = @categories[0], refresh_only=false) -> 
		@save()
		@current_category = category
		html = $("<div></div>")
		html.append(entry.object.get_html()) for name, entry of @fields[category]
		$('#settings_content').empty().append(html)
		$('#top').hide()
		Application.current_account?.hide()
		$('ul#settings_categories li').removeClass("selected")
		$("ul#settings_categories li#category_#{category}").addClass("selected")
		$('#settings').show() unless refresh_only
	
	@close: ->
		@save()
		if @force_restart
			return true
		else
			$('#settings').hide()
			$('#top').show()
			Application.current_account.show()
			return false
	
	@refresh_view: (refresh_only = false) -> @show(@current_category, refresh_only)
	
	@save: -> 
		Application.log("Settings", "", "Saving Settings")
		localStorage.setItem(@local_storage_key, JSON.stringify(settings))
	
	@load: -> 
		found_settings = {}
		Application.log("Settings", "load", "Loading...")
		key = @local_storage_key = "geotweeter.settings." + window.location.pathname.replace(/\/$/, "")
		Application.log("Settings", "load", "Standard-Key: #{@local_storage_key}")
		if localStorage.getItem(@local_storage_key) == null
			Application.log("Settings", "load", "Keine Settings gefunden. Suche nach Alternativen...")
			if localStorage.length>0
				for i in [0..localStorage.length-1]
					temp_key = localStorage.key(i)
					if temp_key.match(/^geotweeter\.settings(?:\.|$)/)
						Application.log("Settings", "load", "Key '#{temp_key}' schaut gut aus...")
						try
							data = JSON.parse(localStorage.getItem(temp_key))
							# Wenn wir hier noch sind, schaut das doch schonmal ganz gut aus...
							if data.version
								Application.log("Settings", "load", "   ... und ist Version #{data.version}. Nehmen wir.")
								key = temp_key
								break
							else
								Application.log("Settings", "load", "   ... hat aber keine Version. Also nicht gut.")
						catch error
							Application.log("Settings", "load", "   ... ist aber kein valides JSON.")
		
		Application.log("Settings", "load", "Key zum initialen Laden der Daten:    #{key}")
		Application.log("Settings", "load", "Key zum weiteren Speichern der Daten: #{@local_storage_key}")
		try
			window.settings = JSON.parse(localStorage.getItem(key))
		catch error
			prompt("Die bisherigen Settings sind kein valides JSON. Die Settings werden daher notgedrungen zurückgesetzt. Zur Sicherheit: Unten steht der bisherige Wert der Settings. Bitte sichern, für den Fall, dass der Programmierer einen Fehler gemacht hat und die Daten doch OK sind...", localStorage.getItem("geotweeter.settings"))
			window.settings = null
	
	@reset: -> 
		delete_other_settings = false
		localStorage.removeItem(@local_storage_key)
		if localStorage.length>0
			for i in [0..localStorage.length-1]
				key = localStorage.key(i)
				if key.match(/^geotweeter\.settings(?:\.|$)/)
					delete_other_settings = confirm("Es wurden noch weitere Geotweeter-Settings gefunden. Sollen diese auch gelöscht werden?") unless delete_other_settings
					
					if delete_other_settings
						Application.log("Settings", "reset", "Lösche '#{key}'.")
						localStorage.removeItem(key)
					else
						break
		localStorage.setItem(@local_storage_key, JSON.stringify({version: 0, debug: true}))
		window.location.href = "."
	
	@list_categories: ->
		ul = $('#settings ul')
		for cat in @categories
			do (cat) ->
				li = $('<li>').click( -> Settings.show(cat) ).html($('<a href="#" onClick="return false;">').html(cat)).attr({id: "category_#{cat}"})
				ul.append(li)
	
	@scrub: (settings) ->
		set = jQuery.extend(true, {}, settings) # clone settings
		set.twitter.consumerKey = set.twitter.consumerKey.replace(/[a-z0-9]/ig, "x")
		set.twitter.consumerSecret = set.twitter.consumerSecret.replace(/[a-z0-9]/ig, "x")
		for user, i in set.twitter.users
			set.twitter.users[i].token = user.token.replace(/[a-z0-9]/ig, "x") 
			set.twitter.users[i].tokenSecret = user.tokenSecret.replace(/[a-z0-9]/ig, "x") 
		try set.instapaper_credentials.user = set.instapaper_credentials.user.replace(/[a-z0-9]/ig, "x")
		try set.instapaper_credentials.password = set.instapaper_credentials.password.replace(/[a-z0-9]/ig, "x")
		return set






Settings.add("Allgemeines", "Konten", "Liste aller dem Geotweeter bekannten Twitter-Accounts.", new SettingsList({
	count: -> settings.twitter.users.length
	getValue: (i) -> [settings.twitter.users[i].screen_name, if settings.twitter.users[i].stream then 'Ja' else '']
	actions: [
		{
			name: "Löschen"
			icon: "icons/cancel.png"
			action: (i) -> 
				if confirm("Wirklich den gewählten User-Account löschen?")
					Application.accounts[i].request.stop_request() if settings.twitter.users[i].stream
					settings.twitter.users.splice(i, 1) 
					Settings.force_restart = true
		}]
	listHeaders: ["Account", "Streaming"]
	addValue: Hooks.add_user_1
}))

Settings.add("Allgemeines", "Places", "Im Geotweeter verwendbare Orte", new SettingsList({
	count: -> settings.places.length
	getValue: (i) -> settings.places[i].name
	actions: [
		{
			name: "Löschen"
			icon: "icons/cancel.png"
			action: (i) ->
				if confirm("Wirklich den gewählten Ort löschen?")
					settings.places.splice(i, 1) 
					Application.fill_places()
		}]
		
	listHeaders: ["Name"]
	addValue: Hooks.add_location_1
}))

Settings.add("Allgemeines", "Bilder direkt anzeigen", "Sollen die Thumbnails zu den Bildern verlinken oder aber nach einem Klick die Bilder (falls möglich) direkt im Geotweeter anzeigen? (Änderungen wirken sich nur auf neu kommende Tweets oder nach einem Neustart aus!)", new SettingsBoolean({
	getValue: -> settings.show_images_in_lightbox
	setValue: (value) -> settings.show_images_in_lightbox = value
}))

Settings.add("Filter", "Begriffe", "Tweets mit diesen Begriffen werden nicht angezeigt", new SettingsList({
	count: -> settings.muted_strings.length
	getValue: (i) -> settings.muted_strings[i]
	actions: [
		{ 
			name: "Löschen",
			icon: "icons/cancel.png"
			action: (i) -> settings.muted_strings.splice(i, 1)
		}]
	listHeaders: ["Begriff"]
	addValue: ->
		answer = prompt("Bitte den zu filternden Begriff eingeben.")
		settings.muted_strings.push(answer.toLowerCase()) if answer
}))

Settings.add("Filter", "Benutzer", "Tweets von diesen Usern werden nicht angezeigt", new SettingsList({
	count: -> settings.muted_users.length
	getValue: (i) -> settings.muted_users[i]
	actions: [
		{ 
			name: "Löschen",
			icon: "icons/cancel.png"
			action: (i) -> settings.muted_users.splice(i, 1)
		}]
	listHeaders: ["User"]
	addValue: ->
		answer = prompt("Bitte den zu filternden Usernamen eingeben.")
		settings.muted_users.push(answer.toLowerCase()) if answer
}))

Settings.add("Filter", "Kombinationen", "Tweets mit diesen User-Begriff-Kombinationen werden nicht angezeigt", new SettingsList({
	count: -> settings.muted_combinations.length
	getValue: (i) -> [settings.muted_combinations[i].user, settings.muted_combinations[i].string]
	actions: [
		{ 
			name: "Löschen",
			icon: "icons/cancel.png"
			action: (i) -> settings.muted_combinations.splice(i, 1)
		}]
	listHeaders: ["User", "Begriff"]
	addValue: ->
		answer1 = prompt("Bitte den zu filternden Usernamen eingeben.")
		answer2 = prompt("Bitte den zu filternden Begriff eingeben.")
		settings.muted_combinations.push({user: answer1.toLowerCase(), string: answer2.toLowerCase()}) if answer1 && answer2
}))

Settings.add("Instapaper", "Username", "Username bei Instapaper", new SettingsText({
	getValue: -> settings.instapaper_credentials.user
	setValue: (value) -> settings.instapaper_credentials.user = value
	style: "big"
}))

Settings.add("Instapaper", "Password", "Password bei Instapaper", new SettingsPassword({
	getValue: -> if settings.instapaper_credentials.user && settings.instapaper_credentials.user.length>0 then "12345678" else ""
	setValue: (value) -> settings.instapaper_credentials.password = value unless value=="12345678"
	style: "big"
}))

Settings.add("Experten", "Debug-Modus", "Gibt mehr Infos auf der Konsole aus", new SettingsBoolean({
	getValue: -> settings.debug
	setValue: (value) -> settings.debug = value
}))

Settings.add("Experten", "Doppelenterzeit", "Wie viele ms zwischen zwei Enter-Drücken liegen dürfen, damit das als Doppelenter erkannt wird", new SettingsText({
	format: "integer"
	getValue: -> settings.timings.max_double_enter_time
	setValue: (value) -> settings.timings.max_double_enter_time = value
}))

Settings.add("Experten", "Timeout-Faktor", "Ist DurchschnittszeitDerLetztenTweets * TimeoutFaktor Zeit seit dem letzten Tweet vergangen, resetten wir den Stream", new SettingsText({
	format: "integer"
	validations: [{message: "Der Faktor muss mindestens 1 sein.", func: (x)->x>=1}]
	getValue: -> settings.timeout_detect_factor
	setValue: (value) -> settings.timeout_detect_factor = value
}))

Settings.add("Experten", "Timeout-Minimum", "Minimalwert, nach dem frühestens ein Timeout angenommen wird (Sekunden)", new SettingsText({
	format: "integer"
	validations: [{message: "Wert muss mindestens 1 sein.", func: (x)->x>=1}, {message: "Wert muss kleiner als das Maximum sein", func: (x)->x<settings.timeout_maximum_delay}]
	getValue: -> settings.timeout_minimum_delay
	setValue: (value) -> settings.timeout_minimum_delay = value
}))

Settings.add("Experten", "Timeout-Maximum", "Maximalwert, nach dem auf jeden Fall ein Timeout angenommen wird (Sekunden)", new SettingsText({
	format: "integer"
	validations: [{message: "Wert muss mindestens 1 sein.", func: (x)->x>=1}, {message: "Wert muss größer als das Minimum sein", func: (x)->x>settings.timeout_minimum_delay}]
	getValue: -> settings.timeout_maximum_delay
	setValue: (value) -> settings.timeout_maximum_delay = value
}))

Settings.add("Experten", "ConsumerKey", "ConsumerKey für die Kommunikation mit Twitter. Wird er geändert, müssen alle Account neu angelegt werden!", new SettingsPassword({
	getValue: -> "abcdefghijklmno"
	setValue: (value) ->
		if value!=settings.twitter.consumerKey && value!="abcdefghijklmno" && confirm("Wirklich den ConsumerKey ändern? Dadurch werden alle Accounts gelöscht und müssen neu hinzugefügt werden!")
			acc.request.stop_request() for acc, id in Application.accounts when settings.twitter.users[id].stream
			settings.twitter.consumerKey = value
			settings.twitter.users = []
			Settings.force_restart = true
	style: "big"
}))

Settings.add("Experten", "ConsumerSecret", "ConsumerSecret für die Kommunikation mit Twitter. Wird es geändert, müssen alle Account neu angelegt werden!", new SettingsPassword({
	getValue: -> "abcdefghijklmnokjhkjhkjh"
	setValue: (value) ->
		if value!=settings.twitter.consumerSecret && value!="abcdefghijklmnokjhkjhkjh" && confirm("Wirklich das ConsumerSecret ändern? Dadurch werden alle Accounts gelöscht und müssen neu hinzugefügt werden!")
			acc.request.stop_request() for acc, id in Application.accounts when settings.twitter.users[id].stream
			settings.twitter.consumerSecret = value
			settings.twitter.users = []
			Settings.force_restart = true
	style: "big"
}))

Settings.add("Sonstiges", "Export", "Exportiert die Settings, um sie z.B. auf einen anderen PC zu übertragen.", new SettingsButton({
	action: -> prompt("Folgender Text enthält die Settings. Bitte irgendwo lokal speichern und *nicht weitergeben*!", JSON.stringify(settings))
}))

Settings.add("Sonstiges", "Import", "Importiert Settings, die vorher exportiert wurden.", new SettingsButton({
	action: ->
		text = prompt("Bitte den Text eingeben. Danach wird der Geotweeter automatisch neu gestartet.")
		settings = JSON.parse(text)
		Settings.save()
		location.href = "."
}))

Settings.add("Sonstiges", "zurücksetzen", "Löscht alle Settings und startet den Geotweeter dann neu.", new SettingsButton({
	action: -> Settings.reset() if confirm("Sicher? Alle (!) Einstellungen löschen?")
}))

Settings.add("Sonstiges", "Settings-Dump für Support", "Gibt einen Dump der Settings, bereinigt um sensible Daten, aus.", new SettingsButton({
	action: -> prompt("Folgenden Text bitte an den 'Support' weiterreichen. Sensible Daten wurden bereinigt.", JSON.stringify(Settings.scrub(settings), "\t"))
}))