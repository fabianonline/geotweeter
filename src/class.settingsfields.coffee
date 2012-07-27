class SettingsField
	values: null
	name: null
	category: null
	
	constructor: (values) ->
		@values = values
	
	get_id: -> (@category+@name).replace(/[^A-Za-z0-9]/g, "")
	
	get_html: ->
		$("<div id='#{@get_id()}'>" + @get_head_html() + "</div>").append(@get_field_html())
	
	get_head_html: ->
		"<h1>#{@name}:</h1>"
	
class SettingsText extends SettingsField
	get_field_html: ->
		elm = $('<input>')
			.attr({type: "text"})
			.val(@values.getValue())
			.change((elm) => 
				@values.setValue(elm.target.value)
			)
		return elm
	
class SettingsList extends SettingsField
	get_field_html: ->
		div = $('<div>')
		button = $("<a href='#'>").attr({style: "float: right; margin-top: -25px;"}).click(@values.addValue).html("Hinzufügen")
		div.append(button)
		table = $('<table>')
		if @values.listHeaders?
			tr = $('<tr>')
			tr.append($('<th>').html(val)) for val in @values.listHeaders
			table.append(tr)
		
		count = @values.count()
		if count>0 then for i in [0..count-1]
			do (i, table) =>
				tr = $('<tr>')
				cells = @values.getValue(i)
				if cells.constructor == Array
					tr.append($('<td>').html(val)) for val in cells
				else
					tr.append($('<td>').html(cells))
				tr.append($('<td>').html("X").click((elm) => 
					@values.deleteValue(i)
					Settings.refresh_view()
				))
				table.append(tr)
		div.append(table)
		return div