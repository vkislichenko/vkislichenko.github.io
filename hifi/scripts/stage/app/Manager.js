//
//  manager.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents the Manager for the stage script
//
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageManager = (function() {

	//private functions
	var getEntityUserData = function(sEntity) {
		return (typeof(sEntity.entityProperties.userData) === 'object') ? sEntity.entityProperties.userData : false;
	}
	var setEntityUserData = function(stageEntity, userData) {
        stageEntity.edit({userData:userData});
	}
	
	var entityIsStageManager = function(sEntity) {
		var userData = getEntityUserData(sEntity);
		return (userData && userData.isStageManager);
	}
	var entityIsStageBlock = function(sEntity) {
		var userData = getEntityUserData(sEntity);
		return (userData && userData.isStageBlock);
	}
	
	var findStageManager = function() {
		var arrayFound = Entities.findEntities(MyAvatar.position, MANAGER_SEARCH_DIST);
		for(var i in arrayFound){
			var foundEntity = new StageEntity({entity : arrayFound[i]});
			if(entityIsStageManager(foundEntity)) return foundEntity;
		}
		return false;
	}
	
	var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
    
	//public functions
	var that = {};
    
    that.webWindowCallback = {};
    that.webWindowCallback.requestDataInit = function(){
        var userData = StageManager.getUserData();
        StageInterface.webWindows.manage.emitScriptEvent({
            type: 'action',
            action: 'initData',
            settings: userData.settings || {},
        });
    };
    that.webWindowCallback.requestPreview = function(data){
        StageBuilder.options = data;
        var blueprint = StageBuilder.calc();
        var options = StageBuilder.options;
        StageInterface.webWindows.manage.emitScriptEvent({
            type: 'action',
            action: 'preview',
            blueprint: blueprint,
            options: options,
        });
    };
    that.webWindowCallback.apply = function(data){
        //clear
        StageBuilder.clear();
        
        //update settings
        var userData = getEntityUserData(that.managerEntity);
		userData.settings = data;
        that.setUserData(userData);
        
        //build levels
        StageBuilder.options = userData.settings;
        StageBuilder.build();
    };
    that.webWindowCallback.clear = function(data){
        StageBuilder.clear();
    }
    
    that.managerEntity = null
    that.getUserData = function() {
        return getEntityUserData(that.managerEntity);
    }
    that.setUserData = function(userData) {
        setEntityUserData(that.managerEntity, userData);
    }

	that.searchForManagerEntity = function()
	{
		if(that.managerEntity) return;
		
		var entity = findStageManager();
        var visibleButtons = [];
		if(entity) {
			that.managerEntity = entity;
			if(PERM_CAN_EDIT) visibleButtons.push('options');
			if(PERM_CAN_DELETE) visibleButtons.push('remove');
		} else {
			visibleButtons.push('search');
			if(PERM_CAN_CREATE) visibleButtons.push('create');
		}
        StageInterface.updateVisible(visibleButtons);
	}
	
	that.createManagerEntity = function()
	{
        var putAvatarOver = 0.4;
        MyAvatar.position = {
            x: MyAvatar.position.x,
            y: MyAvatar.position.y+putAvatarOver,
            z: MyAvatar.position.z,
        };

		that.managerEntity = new StageEntity({
            properties : {
                type: "Box",
                position : {
                    x: MyAvatar.position.x,
                    y: MyAvatar.position.y-putAvatarOver,
                    z: MyAvatar.position.z,
                },
                rotation : {x: 0, y: 1, z: 0, w: 0},
                dimensions : { x: 4, y: 0.1, z: 4 },
                registrationPoint: {x:0.5, y:0, z:0.5},
                velocity: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: 0, z: 0 },
                damping: 0,
                color: { red: getRandomInt(0,255), green: getRandomInt(0,255), blue: getRandomInt(0,255) },
                //texture: BASE_URL +'res/textures/wenge_20120518_1223946663.jpg',

                userData : {
                    isStageManager: true,
                    settings : StageBuilder.options,
                },
            }
        });
        
        
		//UI
		StageInterface.updateVisible(['options','remove']);
	}
	
	that.deleteManagerEntity = function()
	{
		if(!that.managerEntity) return;
		
		//delete all stuff saved in managerEntity
        StageBuilder.clear();
        that.deleteStageBlocks();

        //close web window
        if(StageInterface.webWindows.manage) StageInterface.webWindows.manage.hide();
        
		//delete managerEntity 
		that.managerEntity.remove();
		
        
		that.managerEntity = null;
		
		//UI
        var visibleButtons = ['search'];
        if(PERM_CAN_CREATE) visibleButtons.push('create');
        StageInterface.updateVisible(visibleButtons);
	}
    
    that.deleteStageBlocks = function() {
        var arrayFound = Entities.findEntities(MyAvatar.position, MANAGER_SEARCH_DIST);
        for(var i in arrayFound){
            var foundEntity = new StageEntity({entity : arrayFound[i]});
            if(entityIsStageBlock(foundEntity)) foundEntity.remove();
        }
    }
	
	return that;
})();