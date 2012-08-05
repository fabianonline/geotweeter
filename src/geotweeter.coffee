class Application
	@users: {}
	@all_tweets: {}
	@all_dms: {}
	@all_events: []
	@accounts: []
	@current_account: null
	@twitter_config: {}
	@autocompletes: []
	@temp: {}
	@attached_files: []
	@logs = []

	@start: ->
		window.settings = {debug: true}
		Application.log(this, "", "Starting...")
		Settings.list_categories()
		Settings.load()
		return unless Migrations.migrate()
		@fill_places()
		@attach_hooks()
		@set_time_diff()
		if settings.twitter.users.length==0
			Settings.show()
			return
		@initialize_accounts()
		@get_twitter_configuration()
		@accounts[0].show()
		
		# If after_startup() is defined, run it. This can be used to automatically
		# execute code ofter the Geotweeter has started.
		# To use it, just add a script block to index.html containing
		# `Application.after_startup = function() { ... }`.
		@after_startup?()

	@fill_places: ->
		if settings.places.length == 0
			# remove the dropdown field if there are no places defined
			$('#place').hide()
		else
			p = $('#place')[0]
			p.options.remove() for i in [0..p.options.length]
			p.options[0] = new Option("-- leer --", 0)
			p.options[p.options.length] = new Option(place.name, id+1) for place, id in settings.places
			$("#place option[value='#{$.cookie('last_place')}']").attr('selected', true) if $.cookie('last_place')
			$('#place').show()
	
	@set_time_diff: ->
		$.ajax("proxy/api/help/test.json?suppress_response_codes", {
			async: false
			type: "post"
			success: (foo, bar, req) ->
				d = new Date(req.getResponseHeader("Date"))
				OAuth.correctTimestamp(d.getTime() / 1000)
		})

	@attach_hooks: ->
		$('#place').change( -> $.cookie('last_place', $('#place option:selected').val(), {expires: 365}))
		$('#text').keyup( Hooks.update_counter )
		$('#text').autocomplete({
			minLength: 1
			html: true
			source: (request, response) =>
				`this.options.inline = false`
				word = request.term.split(/\s+/).pop()
				word='@'+word if request.term.match(/^d @?[a-z0-9_]+$/i)
				if (word=="rage")
					`this.options.inline = true`
					faces = [100, 53, 126, 154, 127, 57, 72, 113, 111, 31, 141, 313, 19, 103, 151, 434, 436, 120, 403, 408, 55, 435]
					
					response(
						{label: "<img src='http://ragefac.es/#{id}/i' class='rageface' />", value: "http://ragefac.es/#{id}"} for id in faces
					)
				else if word[0]=="@" || word[0]=="#"
					response($.ui.autocomplete.filter(@autocompletes, word));
				else
					response(new Array())
			focus: -> return false
			autoFocus: true
			delay: 0
			appendTo: "#autocomplete_area"
			select: (event, ui) ->
				event.preventDefault()
				term = this.value.split(/\s+/).pop()
				this.value = this.value.substring(0, this.value.length-term.length) + ui.item.value + " "
				Hooks.text_before_enter = this.value
				Hooks.update_counter(event)
				return false
		})
		
		$(document).delegateContextMenu(".tweet", "context_menu", {
			get_items_function: (elm) -> Tweet.hooks.get_menu_items(elm)
		})

		$(document).delegateContextMenu(".dm", "context_menu", {
			get_items_function: (elm) -> DirectMessage.hooks.get_menu_items(elm)
		})
		
		$(document).delegate(".avatar", "mouseover", (e) ->
			obj = $(e.target)
			unless obj.data("has-tooltip")
				obj.tooltip({
					bodyHandler: -> Tweet.hooks.avatar_tooltip(this)
					track: true
					showURL: false
					left: 5
				}) 
				obj.data("has-tooltip", "true")
				obj.mouseover(e)
		)
		
		$('#top *').live('dragover', (e) => 
			$('#dropzone').show() unless @sending_dm_to?
		)
		$('body').bind('dragleave', (e) -> 
			$('#dropzone').hide() if e.pageX==0
		)
		$('#dropzone').bind('drop', (e) ->
			$('#dropzone').hide()
			e.stopPropagation()
			e.preventDefault()
			Application.attach_files(e.originalEvent.dataTransfer.files)
		)

	@initialize_accounts: ->
		for data, id in settings.twitter.users
			acct = new Account(id) # new Account calls validateCredentials.
			@accounts[id] = acct

	@get_twitter_configuration: -> @accounts[0].get_twitter_configuration()
	
	@get_dm_recipient_name: -> @sending_dm_to
	@set_dm_recipient_name: (recipient_name) ->
		@sending_dm_to = recipient_name
		if recipient_name?
			$('#dm_info_text').html("DM @#{recipient_name}")
			$('#dm_info').show()
			$('#place').hide()
		else
			$('#dm_info').hide()
			$('#place').show()
	
	@reply_to: (tweet) ->
		return @reply_to_tweet unless tweet?
		@reply_to_tweet = tweet
		# TODO
	
	@attach_files: (files) ->
		(alert("Es ist bereits ein Bild angehängt. Mehr lässt Twitter nicht zu.") ; return) if @attached_files.length>0
		(alert("Man kann immer nur ein Bild anhängen!") ; return) if files.length>1
		file = files[0]
		(alert("Die Datei ist zu groß.n\nDateigröße:\t#{file.fileSize} Bytes\nMaximum:\t#{@twitter_config.photo_size_limit} Bytes") ; return) if file.fileSize>@twitter_config.photo_size_limit
		(alert("Der Dateityp #{file.type} wird von Twitter nicht akzeptiert.") ; return) if $.inArray(file.type, ["image/png", "image/gif", "image/jpeg"])==-1
		@attached_files = [files[0]]
		@update_file_display()
	
	@update_file_display: ->
		area = $('#fileinfo')
		Hooks.update_counter()
		if @attached_files.length==0
			area.html("").hide()
			return
		reader = new FileReader()
		reader.onloadend = (event) ->
			if event.target.readyState == FileReader.DONE
				area.append(
					$('<img>').attr('src', event.target.result),
					$('<a>').click(->
						Application.attached_files = []
						Application.update_file_display()
						return false
					).attr('href', '#').append(
						$('<img>').attr('src', 'icons/cross.png').attr('title', 'Bild entfernen')
					)
				)
				area.show()
		reader.readAsDataURL(@attached_files[0])
	
	@toString: -> "Application"
	@is_sending_dm: -> @sending_dm_to?
	@log: (place, category, message) ->
		place_str = if typeof place=="string" then place else (if place.toString? then place.toString() else "----")
		string = "#{(new Date()).format("%H:%M:%S")} [#{place_str.pad(25)}][#{category.pad(15)}] #{message}"
		@logs.push(string)
		console.log(string) if settings.debug && console? && console.log?
	
	@add_to_autocomplete: (term) ->
		if $.inArray(term, @autocompletes)==-1
			@autocompletes.push(term)
			@autocompletes.sort()
	
	@set_text: (text) ->
		$('#text').val(text).focus()
		$('#success').stop(true, true).fadeOut(0)
		$('#failure').stop(true, true).fadeOut(0)
		$('#form').stop(true, true).fadeTo(0, 1)
	
	@infoarea: {
		visible: false
		return_to_settings: false
		show: (title, content, return_to_settings=false) ->
			Application.current_account?.hide()
			$('#settings').hide()
			$('#top').hide()
			Application.infoarea.visible = true
			Application.infoarea.return_to_settings = return_to_settings
			$('#infoarea_title').html(title)
			$('#infoarea_content').html("").append(content)
			$('#infoarea').show()
			return false
			
		hide: ->
			Application.infoarea.visible = false
			$('#infoarea').hide()
			if Application.infoarea.return_to_settings
				Settings.refresh_view()
			else
				$('#top').show()
				Application.current_account.show()
			
			return false
	}
