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
		"<strong>#{@name}:</strong>"
	
	_setValue: (val) -> @values.setValue(val); Settings.save()
	_addValue: -> @values.addValue()
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

class SettingsBoolean extends SettingsField
	get_field_html: ->
		elm = $('<input>')
			.attr({type: "checkbox", checked: @values.getValue()})
			.change((elm) =>
				@_setValue($(elm.target).is(':checked'))
			)
		return elm
	
class SettingsList extends SettingsField
	constructor: (values) ->
		super(values)
		@values.listHeaders ?= ["Name"]
		@values.listHeaders.push("Aktionen")
	
	get_html: ->
		div = $('<div>').append(@get_head_html())
		button = $("<a href='#'>").html("Hinzufügen").click( =>
			@_addValue()
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