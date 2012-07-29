class Thumbnail
	constructor: (@thumbnail, @link, @full_size) ->
	get_single_thumb_html: -> 
		cl = if @full_size then "lightbox" else ""
		"<a href='#{@full_size}' target='_blank' class='#{cl}'>
			<img src='#{@thumbnail}' class='media' style='float: right;' />
		</a>"
	
	get_multi_thumb_html: ->
		cl = if @full_size then "lightbox" else ""
		"<a href='#{@full_size}' target='_blank' class='#{cl}'>
			<img src='#{@thumbnail}' />
		</a>"
	