class SettingsField
	values: null
	name: null
	category: null
	help: ""
	
	constructor: (values) ->
		@values = values
	
	get_id: -> (@category+@name).replace(/[^A-Za-z0-9]/g, "")
	
	get_html: ->
		$("<div id='#{@get_id()}' class='setting'>").append(@get_head_html()).append(@get_field_html()).append("<br class='clear' />")
	
	get_head_html: ->
		$("<h2>").html("#{@name}:").after($('<img>').attr({src: "icons/help.png", title: @help}).tooltip({track: true, delay: 0, showURL: false, extraClass: "settings_tooltip"}))
	
	_setValue: (val) -> @values.setValue(val); Settings.save(); Settings.refresh_view(true)
	_addValue: -> @values.addValue(); Settings.refresh_view(true)
	_deleteValue: (i) -> @values.deleteValue(i); Settings.save(); Settings.refresh_view(true)
	
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
		elm.addClass(@values.style) if @values.style
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
	
	get_html: ->
		div = $('<div>').append(@get_head_html()).addClass('list')
		button = $("<a href='#' style='float: right;'>").html("<img src='icons/add.png' title='Hinzufügen' /> Hinzufügen").click( =>
			@_addValue()
		)
		div.append(button)
		div.append("<br class='break' />")
		table = $('<table>')
		
		tr = $('<tr>')
		tr.append($('<th>').html(val)) for val in @values.listHeaders
		tr.append($('<th>').html("Aktionen").addClass("grey"))
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
				tr.append($('<td>').html("<a href='#' onClick='return false;'><img src='icons/cancel.png' title='Löschen' /> Löschen</a>").addClass("grey").click((elm) => 
					@_deleteValue(i)
					Settings.refresh_view()
				))
				table.append(tr)
		div.append(table)
		return div