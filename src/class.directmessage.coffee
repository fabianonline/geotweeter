class DirectMessage extends Tweet
	fill_user_variables: -> @sender = new User(@data.sender)
	save_as_last_message: -> DirectMessage.last = this
	get_classes: -> ["dm", "by_#{@sender.get_screen_name()}"]
	
	@hooks.send = ->
		parameters = {
			text: $('#text').val()
			wrap_links: true
			screen_name: Application.send_dm_to()
		}
		data = Application.current_account.sign_request("https://api.twitter.com/1/direct_messages/new.json", "POST", parameters)
		url = "proxy/api/direct_messages/new.json"
		$('#form').fadeTo(500, 0)
		
		$.ajax({
			url: url
			data: data
			async: true
			dataType: "json"
			type: "POST"
			success: (data) ->
				if data.recipient
					$('#text').val('')
					Application.reply_to(null)
					Application.send_dm_to(null)
					Hooks.toggle_file(false)
					$('#success_info').html("DM erfolgreich verschickt.")
					$('#success').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
				else
					$('#failure_info').html(data.error);
					$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
			error: (req) ->
				info = "Error #{req.status} (#{req.statusText})"
				try additional = $.parseJSON(req.responseText)
				info += "<br /><strong>#{additional.error}</strong>" if additional.error?
				$('#failure_info').html(info)
				$('#failure').fadeIn(500).delay(2000).fadeOut(500, -> $('#form').fadeTo(500, 1))
		})
		