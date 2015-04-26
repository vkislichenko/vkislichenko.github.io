//
//  manager.js
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


StageManager = (function() {

	//private functions
	var getEntityUserData = function(entity) {
		var result = false;
		var entityProperties = Entities.getEntityProperties(entity);
		try{
			result = JSON.parse(entityProperties.userData);
		} catch(e) {}
		return result;
	}
	var setEntityUserData = function(entity, userData) {
        Entities.editEntity(entity, {userData: JSON.stringify(userData)});
	}
	
	var entityIsStageManager = function(entity) {
		var userData = getEntityUserData(entity);
		return (userData && userData.isStageManager);
	}
	var entityIsStageBlock = function(entity) {
		var userData = getEntityUserData(entity);
		return (userData && userData.isStageBlock);
	}
	
	var findStageManager = function() {
		var arrayFound = Entities.findEntities(MyAvatar.position, MANAGER_SEARCH_DIST);
		for(var i in arrayFound){
			var foundEntity = arrayFound[i];
			if(entityIsStageManager(foundEntity)) return foundEntity;
		}
		return false;
	}
	
	var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
    
	//public functions
	var that = {
		managerEntity: null,
        getUserData : function() {
            return getEntityUserData(this.managerEntity);
        },
        setUserData : function(userData) {
            setEntityUserData(that.managerEntity, userData);
        },
	};
    
    that.webWindowCallback = {};
    that.webWindowCallback.requestDataInit = function(){
print('webWindowCallback.requestDataInit');
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
        //update settings
        var userData = getEntityUserData(that.managerEntity);
		userData.settings = data;

        //remove existing levels
        if(userData.blocks) {
            for(var i in userData.blocks) {
                var blockEntity = userData.blocks[i];
                Entities.deleteEntity(blockEntity); 
            }
            userData.blocks = [];
        }
        
        //build levels
        StageBuilder.options = userData.settings;
        userData.blocks = StageBuilder.build();
        setEntityUserData(that.managerEntity, userData);
    };
    that.webWindowCallback.clear = function(data){
        StageBuilder.clear();
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

		that.managerEntity = Entities.addEntity({
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
			
			userData : JSON.stringify({
				isStageManager: true,
                settings : StageBuilder.options,
            }),
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
		Entities.deleteEntity(that.managerEntity);
		
        
		that.managerEntity = null;
		
		//UI
        var visibleButtons = ['search'];
        if(PERM_CAN_CREATE) visibleButtons.push('create');
        StageInterface.updateVisible(visibleButtons);
	}
    
    that.deleteStageBlocks = function() {
        var arrayFound = Entities.findEntities(MyAvatar.position, MANAGER_SEARCH_DIST);
        for(var i in arrayFound){
            var foundEntity = arrayFound[i];
            if(entityIsStageBlock(foundEntity)) Entities.deleteEntity(foundEntity);
        }
    }
	
	return that;
})();