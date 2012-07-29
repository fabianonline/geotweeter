class Thumbnail
	constructor: (@thumbnail, @link, @full_size) ->
	get_single_thumb_html: -> 
		if settings.show_images_in_lightbox && @full_size
			cl = "lightbox"
			url = @full_size
		else
			cl = ""
			url = @link
		
		"<a href='#{url}' target='_blank' class='#{cl}'>
			<img src='#{@thumbnail}' class='media' style='float: right;' />
		</a>"
	
	get_multi_thumb_html: ->
		if settings.show_images_in_lightbox && @full_size
			cl = "lightbox"
			url = @full_size
		else
			cl = ""
			url = @link
		
		"<a href='#{url}' target='_blank' class='#{cl}'>
			<img src='#{@thumbnail}' />
		</a>"
	