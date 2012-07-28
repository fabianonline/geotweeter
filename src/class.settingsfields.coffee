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
		"<h2>#{@name}:</h2>"
	
	_setValue: (val) -> @values.setValue(val); Settings.save()
	_addValue: -> @values.addValue(val); Settings.save()
	_deleteValue: (i) -> @values.deleteValue(i); Settings.save()
	
class SettingsText extends SettingsField
	get_field_html: ->
		if @values.readOnly
			elm = $('<div>').html(@values.getValue())
		else
			elm = $('<input>')
				.attr({type: "text"})
				.val(@values.getValue())
				.change((elm) => 
					@_setValue(elm.target.value)
				)
		return elm

class SettingsPassword extends SettingsText
	get_field_html: ->
		return super().attr({type: "password"})
	
class SettingsList extends SettingsField
	constructor: (values) ->
		super(values)
		@values.listHeaders ?= ["Name"]
		@values.listHeaders.push("Aktionen")
	
	get_field_html: ->
		div = $('<div>')
		button = $("<a href='#'>").attr({style: "float: right; margin-top: -25px;"}).html("Hinzufügen").click( =>
			@_addValue()
			Settings.refresh_view()
		)
		div.append(button)
		table = $('<table>')
		
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
					@_deleteValue(i)
					Settings.refresh_view()
				))
				table.append(tr)
		div.append(table)
		return div