class Application
	@users: {}
	@accounts: []
	@expected_settings_version: 12
	@current_account: null
	@twitter_config: {}

	@start: ->
		Application.log(this, "", "Starting...")
		return unless @is_settings_version_okay()
		@fill_places()
		@attach_hooks()
		@initialize_accounts()
		@get_twitter_configuration()
		@accounts[0].activate()

	@is_settings_version_okay: -> 
		if settings.version != @expected_settings_version
			alert("settings.js veraltet.\nErwartet: #{expected_settings_version}\nGegeben: #{settings.version}")
			return false
		return true

	@fill_places: ->
		if settings.places.length == 0
			# remove the dropdown field if there are no places defined
			$('#place').remove()
		else
			p = $('#place')[0]
			p.options[0] = new Option("-- leer --", 0)
			p.options[p.options.length] = new Option(place.name, id+1) for place, id in settings.places
			$("#place option[value='#{$.cookie('last_place')}']").attr('selected', true) if $.cookie('last_place')

	@attach_hooks: ->
		$('#place').change( -> $.cookie('last_place', $('#place option:selected').val(), {expires: 365}))
		$('#file').change( Hooks.check_file )

	@initialize_accounts: ->
		for data, id in settings.twitter.users
			acct = new Account(id) # new Account calls validateCredentials.
			# TODO
			@accounts[id] = acct

	@get_twitter_configuration: -> @accounts[0].get_twitter_configuration()
	
	@get_dm_recipient_name: -> @sending_dm_to
	@set_dm_recipient_name: (recipient_name) ->
		@sending_dm_to = recipient_name
		if recipient_name?
			Hooks.toggle_file(false)
			$('#dm_info_text').html("DM @#{recipient_name}")
			$('#dm_info').show()
			$('#place').hide()
			$('#file_choose').hide()
		else
			Hooks.toggle_file(true)
			$('#dm_info').hide()
			$('#place').show()
			$('#file_choose').show()
	
	@reply_to: (tweet) ->
		return @reply_to_tweet unless tweet?
		@reply_to_tweet = tweet
		# TODO
	
	@toString: -> "Application"
	@is_sending_dm: -> @sending_dm_to?
	@log: (place, category, message) ->
		return unless settings.debug && console? && console.log?
		place_str = if typeof place=="string" then place else (if place.toString? then place.toString() else "----")
		console.log("[#{place_str.pad(25)}][#{category.pad(15)}] #{message}")
	