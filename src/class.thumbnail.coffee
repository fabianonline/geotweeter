class Thumbnail
	constructor: (@thumbnail, @link) ->
	get_single_thumb_html: -> 
		"<a href='#{@link}' target='_blank'>
			<img src='#{@thumbnail}' class='media' style='float: right;' />
		</a>"
	
	get_multi_thumb_html: ->
		"<a href='#{@link}' target='_blank'>
			<img src='#{@thumbnail}' />
		</a>"
	