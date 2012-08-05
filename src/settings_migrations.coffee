class Migrations
	@migrations = []
	
	@migrations[0] = { # Migrating from Version 0 (non-existant setting) to Version 1
		description: "Settings wurden neu erzeugt",
		blocking: true, # This update can be run "silently" (the default values are okay and GT will run with them)
		change: (settings) ->
			settings = {
				twitter: {
					users: []
					consumerKey: "57z3b4GB1n8fOBUh7RZuQ"
					consumerSecret: "TcwsnNqJByzhnrWvukjjFoZnBu6NpeOCo5MQQ4maCio"
				}
				muted_strings: []
				muted_users: []
				muted_combinations: []
				places: []
				timings: {
			        mindelay: 2,
			        maxdelay: 160,
			        max_double_enter_time: 150
			    },
			    show_error_if_no_place_is_set: true,
			    unshorten_links: false,
			    debug: false,
			    timeout_detect_factor: 4,
			    timeout_minimum_delay: 120,
			    timeout_maximum_delay: 600,
			    instapaper_credentials: {
			        user: null,
			        password: null
			    }
			}
			return settings
	}
	
	@migrations[1] = {
		description: "Feld für die Anzeige von Bilder in der Lightbox hinzugefügt."
		blocking: false
		change: (settings) -> settings.show_images_in_lightbox = true; return settings
	}
	
	@migrate: ->
		changes = []
		blocking = false
		Application.log("Migration", "migrate", "Newest available Version: #{@migrations.length}")
		if window.settings
			Application.log("Migration", "migrate", "Current Version: #{window.settings.version}")
			if window.settings.version == @migrations.length
				return true
			start_version = window.settings.version
		else
			Application.log("Migration", "migrate", "No Settings available - starting fresh.")
			start_version = 0
		
		for i in [start_version..@migrations.length-1]
			migration = @migrations[i]
			changes.push "  * #{migration.description}" if migration.blocking
			blocking ||= migration.blocking
			window.settings = migration.change(window.settings)
			window.settings.version = i+1
		
		if blocking
			text = "Die settings müssen aktualisiert werden.\n\nFolgende Neuerungen kamen insgesamt dazu:\n" + changes.join("\n")
			alert(text)
			Settings.force_restart = true
			Settings.show()
			return false
		
		Settings.save()
		return true