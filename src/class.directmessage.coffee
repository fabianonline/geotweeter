class DirectMessage extends Tweet
	get_user_data: -> @data.sender
	get_classes: -> ["dm", "by_#{@sender.get_screen_name()}"]
