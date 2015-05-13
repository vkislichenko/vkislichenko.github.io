//
//  webView.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents Entity wrapper for the stage script
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageEntity = (function(options) {

	//public functions
	var that = {
        entity : false,
        entityProperties : [],
        options : options,
        callback : {
            add : [],
            identify : [],
            remove : [],
            load : [],
        }
    };

	that.init = function()
	{
        if(that.options == null) return;
        
        //set entity from options
        if(that.options.entity != null) that.entity = that.options.entity;
        
        //add callbacks from options
        if(that.options.callback != null) {
            for(var i in that.options.callback) {
                that.event(i, that.options.callback[i]);
            }
        }
		
        //nothing left to do
        if(that.entity) {
            that.load();
            return;
        }
        
        //create entity
		that.add(that.options.properties);
    }
    
    that.add = function(properties)
    {
        //copy
        for(var i in properties) {
           that.entityProperties[i] = properties[i];
        }
        //save
        properties.userData = (typeof(properties.userData) === 'object') ? JSON.stringify(properties.userData) : properties.userData;
        that.entity = Entities.addEntity(properties);
        
        that.eventCallback('add');
        that.identify();
    }
    
    that.identify = function() 
    {
        if(!that.entity || that.entity.isKnownID) return;
        
        var entity = Entities.identifyEntity(that.entity);
        if(entity.isKnownID) {
            that.entity = entity;
            that.eventCallback('identify');
        } else {
            //TODO: check identify time out
            Script.setTimeout(that.identify, 1000);
        }
    }
    
    that.load = function() {
        that.identify();
        that.entityProperties = Entities.getEntityProperties(that.entity);

        that.updatedEntityProperties = [];
        try{
			that.entityProperties.userData = JSON.parse(that.entityProperties.userData);
		} catch(e) {}
        that.eventCallback('load');
    }
    
    that.save = function() {
        if(!that.entityProperties || !that.updatedEntityProperties.length) return;

        var editEntityProperties = {};
        for(var i in that.updatedEntityProperties) {
            var key = that.updatedEntityProperties[i];
            switch(key) {
                case 'userData':
                    var userData = (typeof(that.entityProperties[key]) === 'object') ? JSON.stringify(that.entityProperties[key]) : that.entityProperties[key];
                    if(userData) editEntityProperties[key] = userData;
                break;
                
                default:
                    editEntityProperties[key] = that.entityProperties[key];
                break;
            }
            //delete it from update list
            delete that.updatedEntityProperties[i];
        }
        Entities.editEntity(that.entity, editEntityProperties);
    }
    
    that.edit = function(properties)
    {
        that.load();
        for(var i in properties) {
            that.entityProperties[i] = properties[i];
            that.updatedEntityProperties.push(i);
        }
        that.save();
    }
    
    that.remove = function() {
        if(!that.entity) return;
        Entities.deleteEntity(that.entity);
        that.eventCallback('remove');
    }
    
    //events
    that.event = function(event, callback) {
        that.callback[event].push(callback);
    }
    that.eventCallback = function(event) {
        for(var i in that.callback[event]) {
            var callback = that.callback[event][i];
            callback.apply(that);
        }
    }
	
    that.init();
	return that;
});