class PullRequest extends Request
	start_request: ->
		@account.remove_errors()
		window.setTimeout(@account.fill_list, 300000)
	
	stop_request: ->
		@account.fill_list()
	
	restart: -> @stop_request()