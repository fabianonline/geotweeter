class Migrations
	@migrations = []
	
	@migrations[14] = { # Migrating from Version 14 to Version 15
		description: "Felder für Instapaper-Zugangsdaten hinzugefügt.",
		blocking: false, # This update can be run "silently" (the default values are okay and GT will run with them)
		change: (settings) ->
			settings["instapaper"] = {user: "", credentials: ""}
			return settings
	}
	
	@migrate: ->
		changes = []
		blocking = false
		return true if window.settings.version == Application.expected_settings_version
		
		for i in [settings.version..Application.expected_settings_version-1]
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
			$('body').html("Bitte fügen Sie den folgenden Text in die settings.js ein (vorigen Inhalt bitte ersetzen). Anschließend laden Sie diese Seite bitte neu.<br /><br /><pre>#{code}</pre>")
			return false
		
		return true