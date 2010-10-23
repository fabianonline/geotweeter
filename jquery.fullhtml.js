/* Copyright (c) 2008 Richard Lyon (http://www.richardlyon.co.uk/)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * $LastChangedDate: 2008-3-5 01:36:00 - GMT (Wed, 5 Mar 2008) $
 * $Rev: 1 $
 *
 * Version: 1.0
 *
 * Requires: nothing as far as I know, other than jQuery 1.*
 */
 
(function() {

jQuery.fn.fullhtml = function() {

	var tagName = this[0].tagName.toLowerCase()

	var attribs = this[0].attributes

	var outCode = "<" + tagName;

	for( var i = 0; i < attribs.length; i++ ) {
		var attrName = attribs[i].nodeName;
		outCode += " "+ attrName + "='" + $(this).attr( attrName ) + "'"
	}
	
	outCode += ">" + $(this).html() + "</" + tagName + ">"

	return outCode
}

})(jQuery);
