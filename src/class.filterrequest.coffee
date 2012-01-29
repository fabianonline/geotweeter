class FilterRequest extends StreamRequest
	constructor: (account, @keywords) -> super(account)
	
	toString: -> "FilterReq #{@account.user.screen_name}"
	
	clear_timeout: ->
	set_timeout: (delay) ->
		
	get_url: ->
		data = @account.sign_request("https://stream.twitter.com/1/statuses/filter.json", "GET", {delimited: "length", track: @keywords})
		url = "proxy/stream/statuses/filter.json?#{data}"