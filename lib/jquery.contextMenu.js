/**
 * jQuery.contextMenu - Show a custom context when right clicking something
 * Jonas Arnklint, http://github.com/arnklint/jquery-contextMenu
 * Released into the public domain
 * Date: Jan 14, 2011
 * @author Jonas Arnklint
 * @version 1.3
 * 
 * ********************************************************
 * 
 * Heavily modified for use with the Geotweeter.
 * 
*/
// Making a local '$' alias of jQuery to support jQuery.noConflict
(function($) {
	var options;
	
	var pre_context_menu = function ( parent, name, opts) {
		options = opts,
		me = parent,
		menu = $('<ul id="'+name+'" class="context-menu"></ul>').hide().appendTo('body'),
		activeElement = null, // last clicked element that responds with contextMenu
		hideMenu = function() {
			$('.context-menu:visible').each(function() {
				$(this).trigger("closed");
				$(this).hide();
				$('body').unbind('click', hideMenu);
			});
		},
		default_options = {
			disable_native_context_menu: false, // disables the native contextmenu everywhere you click
			leftClick: false // show menu on left mouse click instead of right
		},
		options = $.extend(default_options, options);

		$(document).bind('contextmenu', function(e) {
			if (options.disable_native_context_menu) {
				e.preventDefault();
			}
			hideMenu();
		});
	}
	
	var post_context_menu = function(e) {
		// Hide any existing context menus
		hideMenu();

		if( (options.leftClick && e.button == 0) || (options.leftClick == false && e.button == 2) ){

			activeElement = $(this); // set clicked element

			//menu.html(Tweet.hooks.get_menu_items(activeElement));
			menu.html("");
			var items = options.get_items_function(activeElement);
			for (var i=0; i<items.length; i++) {
				var item = items[i];
				var url = item.url || "#";
				var item_html = $('<li><a href="'+url+'" target="_blank">'+item.name+'</a>');
				item_html.appendTo(menu).css({
					"background-image": "url('" + item.icon + "')"
				});
				if (item.action) {
					item_html.bind("click", function(e) {
						item.action(activeElement);
						e.preventDefault();
					})
				}
			}

			if (options.showMenu) {
				options.showMenu.call(menu, activeElement);
			}

			// Bind to the closed event if there is a hideMenu handler specified
			if (options.hideMenu) {
				menu.bind("closed", function() {
					options.hideMenu.call(menu, activeElement);
				});
			}

			menu.css({
				visibility: 'hidden',
				position: 'absolute',
				zIndex: 1000
			});

			// include margin so it can be used to offset from page border.
			var mWidth = menu.outerWidth(true),
				mHeight = menu.outerHeight(true),
				xPos = ((e.pageX - window.scrollX) + mWidth < window.innerWidth) ? e.pageX : e.pageX - mWidth,
				yPos = ((e.pageY - window.scrollY) + mHeight < window.innerHeight) ? e.pageY : e.pageY - mHeight;

			menu.show(0, function() {
				$('body').bind('click', hideMenu);
			}).css({
				visibility: 'visible',
				top: yPos + 'px',
				left: xPos + 'px',
				zIndex: 1000
			});

			return false;
		}
	};
	
	jQuery.fn.contextMenu = function ( name, options ) {
		pre_context_menu(this, name, options);
		return me.bind('contextmenu click', post_context_menu);
	}

	jQuery.fn.delegateContextMenu = function ( selector, name, options ) {
		pre_context_menu(this, name, options);
		return $(document).delegate(selector, 'contextmenu click', post_context_menu)
	}
	
})(jQuery);

