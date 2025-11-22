Marble.OsdLayer	= function()
{
	this._pageSel	= '#osdContainer';

	// show the page
	jQuery(this._pageSel).show();

	this._score	= 0;
	this._scoreDirty= true;
	
	this._lives	= 0;
	this._livesDirty= true;
	
	this._timeout		= '';
	this._timeoutDirty	= true;

	// bind .helpButton
	this._$helpButtonOnClick	= this._helpButtonOnClick.bind(this);
	jQuery("#osdContainer .helpButton").bind('click', this._$helpButtonOnClick);	

}

Marble.OsdLayer.prototype.destroy	= function()
{
	// hide the page
	jQuery(this._pageSel).hide();
	// unbind .helpButton
	jQuery("#osdContainer .helpButton").unbind('click', this._$helpButtonOnClick);	
}

//////////////////////////////////////////////////////////////////////////////////
//			button							//
//////////////////////////////////////////////////////////////////////////////////

Marble.OsdLayer.prototype._helpButtonOnClick	= function()
{
	var dialogSel	= '#osdContainer .helpDialog';
	jQuery(dialogSel).jqm();
	jQuery(dialogSel).jqmShow();
}

//////////////////////////////////////////////////////////////////////////////////
//		Update								//
//////////////////////////////////////////////////////////////////////////////////


Marble.OsdLayer.prototype.scoreChange	= function(delta)
{
	this._score	+= delta;
	this._scoreDirty= true;
}

Marble.OsdLayer.prototype.livesSet	= function(newValue)
{
	if( newValue === this._lives )	return;
	this._lives	= newValue;
	this._livesDirty= true;
}

Marble.OsdLayer.prototype.timeoutSet	= function(newValue)
{
	if( newValue === this._timeout )	return;
	this._timeout		= newValue;
	this._timeoutDirty	= true;
}

Marble.OsdLayer.prototype.update	= function()
{
	if( this._scoreDirty ){
		jQuery("#osdContainer .score .value").html(this._score);
		this._scoreDirty	= false;
	}
	if( this._livesDirty ){
		jQuery("#osdContainer .lives .value").html(this._lives);
		this._livesDirty	= false;
	}
	if( this._timeoutDirty ){
		jQuery("#osdContainer .timeout .value").html(this._timeout);
		this._timeoutDirty	= false;
	}
}