class Application
	@users: {}
	@all_tweets: {}
	@all_dms: {}
	@all_events: []
	@accounts: []
	@expected_settings_version: 12
	@current_account: null
	@twitter_config: {}
	@autocompletes: []

	@start: ->
		Application.log(this, "", "Starting...")
		return unless @is_settings_version_okay()
		@fill_places()
		@attach_hooks()
		@initialize_accounts()
		@get_twitter_configuration()
		@accounts[0].show()

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
		$('#text').autocomplete({
			minLength: 1
			source: (request, response) =>
				word = request.term.split(/\s+/).pop()
				word='@'+word if request.term.match(/^d @?[a-z0-9_]+$/i)
				if (word[0]!="@" && word[0]!="#")
					response(new Array())
				else
					response($.ui.autocomplete.filter(@autocompletes, word));
			focus: -> return false
			autoFocus: true
			delay: 0
			appendTo: "#autocomplete_area"
			select: (event, ui) ->
				term = this.value.split(/\s+/).pop()
				this.value = this.value.substring(0, this.value.length-term.length) + ui.item.value + " "
				return false
		})
		
		$(document).delegateContextMenu(".tweet", "context_menu_tweet", {
			get_items_function: (elm) -> Tweet.hooks.get_menu_items(elm)
		})

	@initialize_accounts: ->
		for data, id in settings.twitter.users
			acct = new Account(id) # new Account calls validateCredentials.
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
		console.log("#{(new Date()).format("%H:%M:%S")} [#{place_str.pad(25)}][#{category.pad(15)}] #{message}")
	
	@add_to_autocomplete: (term) ->
		if $.inArray(term, @autocompletes)==-1
			@autocompletes.push(term)
			@autocompletes.sort()
	
	@infoarea: {
		visible: false
		show: (title, content) ->
			Application.infoarea.visible = true
			$('#infoarea_title').html(title)
			$('#infoarea_content').html(content)
			$('#infoarea').show()
			return false
			
		hide: ->
			Application.infoarea.visible = false
			$('#infoarea').hide()
			return false
	}
