//
//  webView.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents the Entity Identifier for the stage script
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageEntityIdentifier = (function() {

	//public functions
	var that = {
        entities : [],
        callback : {
            progress : null,
            done : null,
        }
    };

	that.process = function(callback) {
        that.callback = callback;
        that.check();
    }
    
	that.check = function()
	{
        //calc identified entities
        var identified = 0;
        for(var i in that.entities) {
            if(that.entities[i].entity.isKnownID) identified++;
        }
        
        if(identified === that.entities.length) {
            if(that.callback.done) that.callback.done.apply(that);
        } else {
            if(that.callback.progress) that.callback.progress.apply(that, [identified, that.entities.length]);
            Script.setTimeout(that.check, 1000);
        }
    }

	return that;
});