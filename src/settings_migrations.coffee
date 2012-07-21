class Migrations
	@migrations = []
	
	@migrations[14] = { # Migrating from Version 14 to Version 15
		description: "Felder für Instapaper-Zugangsdaten hinzugefügt.",
		blocking: false, # This update can be run "silently" (the default values are okay and GT will run with them)
		change: (settings) ->
			settings["instapaper_credentials"] = {user: "", password: ""}
			return settings
	}
	
	@migrations[13] = { # 13 to 14
		description: "Entfernt ein paar alte Settings; formatiert die Filter neu.",
		blocking: false,
		change: (settings) ->
			delete settings.fill_list
			delete settings.show_error_if_no_place_is_set
			delete settings.unshorten_links
			settings.muted_strings = settings.blacklist
			delete settings.blacklist
			settings.muted_users = settings.muted
			delete settings.muted
			settings.muted_combinations = []
			settings.muted_combinations.push({user: settings.troll[i], string: settings.trigger[i]}) for i in settings.troll
			delete settings.troll
			delete settings.trigger
			return settings
	}
	
	@migrations[12] = { # 12 to 13
		description: "Filter-Strings müssen komplett klein geschrieben sein.",
		blocking: false,
		change: (settings) ->
			settings.blacklist[i] = settings.blacklist[i].toLowerCase for i in settings.blacklist
			return settings
	}
	
	@migrate: ->
		changes = []
		blocking = false
		return true if window.settings.version == @migrations.length
		
		for i in [settings.version..@migrations.length-1]
			migration = @migrations[i]
			changes.push "  * #{migration.description}"
			blocking ||= migration.blocking
			window.settings = migration.change(window.settings)
			window.settings.version = i+1
		
		text = "Die settings müssen aktualisiert werden.\n\nFolgende Änderungen wurden eingepflegt:\n" + changes.join("\n")
		
		update = false
		
		if blocking
			text += "\n\nSie *müssen* settings.js aktualisieren, bevor Sie den Geotweeter nutzen können!"
			alert(text)
			update = true
		else
			text += "\n\nDie Aktualisierung ist freiwillig. Wenn Sie sie jetzt nicht vornehmen, sind neue Features evtl. nicht verfügbar. Sie werden bei jedem weiteren Start daran erinnert werden.\nWollen Sie die Aktualisierung jetzt vornehmen?"
			update = confirm(text)
		
		if update
			code = JSON.stringify(window.settings, null, "    ")
			$('body').html("Bitte fügen Sie den folgenden Text in die settings.js ein (vorigen Inhalt bitte ersetzen). Anschließend laden Sie diese Seite bitte neu.<br /><br /><pre>var settings = #{code}</pre>")
			return false
		
		return true