class Application
	@users: {}
	@accounts: []
	@expected_settings_version: 12
	@current_account: 0
	@twitter_config: {}

	@start: ->
		return unless @is_settings_version_okay()
		@fill_places()
		@attach_hooks()
		@initialize_accounts()
		@get_twitter_configuration()
		# select the first account
		@change_account(0)

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

	@change_account: (id) ->
		$('.content').hide()
		$("#content_#{id}").show()
		$('#users .user').removeClass('active')
		$("#user_#{id}").addClass('active')
		@current_account = id
	
	@add_null: (number) ->
		return number if number>10
		return "0#{number}"
		