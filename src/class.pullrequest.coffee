class PullRequest extends Request
	start_request: ->
		window.setTimeout(@account.fill_list, 300000)