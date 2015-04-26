//
//  webView.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents the Manager for the stage.js script
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageWebView = (function(options) {

	//public functions
	var that = {
        window : false,
        options : options,
    };

	that.init = function()
	{
		if(that.window) return;
		
		that.window = new WebWindow(that.options.title, that.options.url, that.options.width, that.options.height, true);
        
        that.window.eventBridge.webEventReceived.connect(function(dataString) {
            var callback = that.options.webEventReceived || false;
            if(!callback) return;
            var data = JSON.parse(dataString);
            callback(data);
        });
    }
    
    that.emitScriptEvent = function(data) {
        if(!that.window) return;
        that.window.eventBridge.emitScriptEvent(JSON.stringify(data));
    }
    
    that.show = function(){
        if(!that.window) return;
        that.window.setVisible(true);
    }
    
    that.hide = function(){
        if(!that.window) return;
        that.window.setVisible(false);
    }
	
    that.init();
	return that;
});