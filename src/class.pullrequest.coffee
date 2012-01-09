class PullRequest extends Request
	start_request: ->
		@account.get_max_read_id()
		window.setTimeout(@account.fill_list, 300000)
	
	stop_request: ->
		@account.fill_list()