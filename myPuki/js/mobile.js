////////////////////////////////////////////////////////////
// MOBILE
////////////////////////////////////////////////////////////
var forPortrait=false;

/*!
 * 
 * START MOBILE CHECK - This is the function that runs for mobile event
 * 
 */
function checkMobileEvent(){
	if($.browser.mobile || isTablet){
		$( window ).off('orientationchange').on( "orientationchange", function( event ) {
			$('#canvasHolder').hide();
			
			setTimeout(function() {
				checkMobileOrientation();
			}, 1000);
		});
		checkMobileOrientation();
	}
}

/*!
 * 
 * MOBILE ORIENTATION CHECK - This is the function that runs to check mobile orientation
 * 
 */
function checkMobileOrientation() {
	// Rotation screen disabled - always show canvas regardless of orientation
	if(loaded)
		$('#canvasHolder').show();
}

/*!
 * 
 * TOGGLE ROTATE MESSAGE - This is the function that runs to display/hide rotate instruction
 * 
 */
function toggleRotate(con){
	// Rotation screen disabled - function does nothing
	return;
}