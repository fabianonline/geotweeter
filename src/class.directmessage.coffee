class DirectMessage extends Tweet
	fill_user_variables: -> 
		@sender = new User(@data.sender)
		@recipient = new User(@data.recipient)
	
	save_as_last_message: -> DirectMessage.last = this
	get_classes: -> ["dm", "by_#{@sender.get_screen_name()}"]
	
	reply: ->
		$('#text').val('').focus()
		Application.set_dm_recipient_name(if @sender.screen_name!=@account.screen_name then @sender.screen_name else @recipient.screen_name)
	
	get_buttons_html: ->
		"<a href='#' onClick='return DirectMessage.hooks.reply(this);'><img src='icons/comments.png' title='Reply' /></a>" +
		(if @account.screen_name!=@sender.screen_name then "<a href='#' onClick='return Tweet.hooks.report_as_spam(this);'><img src='icons/exclamation.png' title='Block and report as spam' /></a>" else "")
	
	@hooks.get_tweet = (element) ->
		tweet_div = $(element).parents('.dm')
		Application.accounts[tweet_div.attr('data-account-id')].get_tweet(tweet_div.attr('data-tweet-id'))
	
	@hooks.send = ->
		# event is a global variable. preventDefault() prevents the form from being submitted after this function returned
		event.preventDefault() if event?
		parameters = {
			text: $('#text').val()
			wrap_links: true
			screen_name: Application.get_dm_recipient_name()
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
					Application.set_dm_recipient_name(null)
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
	
	@hooks.reply = (elm) -> @get_tweet(elm).reply(); return false;