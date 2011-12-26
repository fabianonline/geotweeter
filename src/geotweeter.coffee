users = {}
accounts = []
expected_settings_version: 12

start: ->
	return unless is_settings_version_okay()
	fill_places()
	attach_hooks()
	initialize_accounts()

is_settings_version_okay: -> 
	if settings.version != expected_settings_version
		alert("settings.js veraltet.\nErwartet: #{expected_settings_version}\nGegeben: #{settings.version}")
		return false
	return true

fill_places: ->
	if settings.places.length == 0
		# remove the dropdown field if there are no places defined
		$('#place').remove()
	else
		$('#place').options[0] = new Option("-- leer --", 0)
		$('#place').options[$('#place').options.length] = new Option(place.name, id+1) for place, id in settings.places
		$("#place option[value='#{$.cookie('last_place')}']").attr('selected', true) if $.cookie('last_place')

attach_hooks: ->
	$('#place').change( -> $.cookie('last_place', $('#place option:selected').val(), {expires: 365}))
	$('#file').change( check_file )

check_file: -> # TODO

initialize_accounts: ->
	for data, id in settings.twitter.users
		acct = new Account(id) # new Account calls validateCredentials.
		# TODO
		accounts[id] = acct