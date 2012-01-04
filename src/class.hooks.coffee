class Hooks
	@display_file: false
	
	@check_file: => # TODO
	@update_counter: ->
	@toggle_file: (new_value) ->
		if new_value?
			@display_file = new_value
		else
			@display_file = !@display_file
		$('#file_div').toggle(@display_file)
		$('#file').val('') unless @display_file
		return false