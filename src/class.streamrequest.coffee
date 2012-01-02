class StreamRequest extends Request
	connected: false
	buffer: ""
	response_offset: 0
	request: null
	processing: false
	connection_started_at: null
	last_data_received_at: null
	
	constructor: (account) ->
		super(account)
	
	start_request: ->
		@processing = false
		@buffer = ""
		@response_offset = 0
		@connected = false
		@connection_started_at = new Date()
		@last_data_received_at = new Date()
		data = @account.sign_request("https://userstream.twitter.com/2/user.json", "GET", {delimited: "length", include_entities: "1", include_rts: "1"})
		url = "user_proxy?#{data}"
		@request = new XMLHttpRequest();
		@request.open("GET", url, true);
		@request.onreadystatechange = =>
			@last_data_received_at = new Date()
			switch @request.readyState
				when 3
					@connected = true
				when 4
					@connected = false
					@delay = settings.timings.mindelay if (new Date()).getTime() - @connection_started_at.getTime() > 10000
					# TODO: Fehlermeldung
					window.setTimeout(@account.fill_list, @delay*1000)
					@delay = @delay * 2
			@buffer += @request.responseText.substr(@response_offset)
			@response_offset = @request.responseText.length
			@process_buffer()
		
		@request.send(null)
	
	process_buffer: ->
		return if @processing
		@processing = true
		regex = /^[\r\n]*([0-9]+)\r\n([\s\S]+)$/;
		while res=@buffer.match(regex)
			len = parseInt(res[1])
			break if res[2].length<len
			parseable_text = res[2].substr(0, len)
			@buffer = res[2].substr(len)
			try @account.parse_data(parseable_text)
		@processing = false;
	