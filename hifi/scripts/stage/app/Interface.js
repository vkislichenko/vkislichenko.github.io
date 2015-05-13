//
//  interface.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents the UI for the stage script
//
//	Icons downloaded from http://icons8.com/ 
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageInterface = (function() {

	//ui buttons
	var buttonsSpacing = 10;
	var buttonPropotions = {
		width: 25, 
		height: 25
	};

	var buttonPanelPos = {
        //right
		x : Window.innerWidth - (buttonPropotions.width+buttonsSpacing)*2,
		y : Window.innerHeight - (buttonPropotions.height+buttonsSpacing)*2,
	};
    var nextButtonPos = {x: buttonPanelPos.x - buttonPropotions.width, y: buttonPanelPos.y};
    
	var buttonsOverlays = {};
	var buttonsCallbacks = {};
    
    var webWindows = {
        manage : false,
    };
    var webWindowsOptions = {};
    webWindowsOptions.manage = {
        title: 'Manager', 
        url : BASE_URL + 'html/manager.html?rand'+Math.random(), 
        height: 200, 
        width: 280,
        webEventReceived : function(data) {
            switch(data.type) {
                case "action":
                    var callback = StageManager.webWindowCallback[data.action] || false;
                    if(callback) callback(data.data);
                    break;
                default: break;
            }
        }
    };
    
    function addButton(settings) {
        var overlay = Overlays.addOverlay("image", {
            bounds: {
                x: nextButtonPos.x,
                y: nextButtonPos.y,
                width: buttonPropotions.width, 
                height: buttonPropotions.height
            },
            imageURL: settings.imageURL,
            alpha: 1, 
            visible: settings.visible || false,
        });
        
        nextButtonPos.x = nextButtonPos.x - (buttonPropotions.width + buttonsSpacing);
        
        buttonsOverlays[settings.name] = overlay;
        buttonsCallbacks[overlay] = { 
            onClick: settings.onClick || false,
            onCtrlClick: settings.onCtrlClick || false,
        }
    }
	
    // ui search button
    addButton({
        name : 'search',
        visible: true,
        imageURL: BASE_URL + "res/overlay/search-button.png",
        onClick : function(){
            StageManager.searchForManagerEntity();
        },
    });
	
	// ui manage button
    addButton({
        name : 'options',
        imageURL: BASE_URL + "res/overlay/options-button.png",
        onClick : function(){
            //create window
            if(!webWindows.manage) webWindows.manage = new StageWebView(webWindowsOptions.manage);

            //show it
            webWindows.manage.show();
        },
    });
	
	// ui create button
    addButton({
        name : 'create',
        imageURL: BASE_URL + "res/overlay/create-button.png",
        onClick : function(){
            if(!Window.confirm("Are you sure?")) return;
            StageManager.createManagerEntity();
        },
    });
	
	// ui remove button
   addButton({
        name : 'remove',
        imageURL: BASE_URL + "res/overlay/remove-button.png",
        onClick : function(){
            if(!Window.confirm("Are you sure, stage will be deleted?")) return;
            StageManager.deleteManagerEntity();
        },
        onCtrlClick : function() {
            if(!Window.confirm("Are you sure, stage will be cleared?")) return;
            StageBuilder.clear();
            StageManager.deleteStageBlocks();
        }
    });

    // mouse event handler
    function mousePressEvent(event) {
        var clickedOverlay = Overlays.getOverlayAtPoint({x: event.x, y: event.y});
        if(!clickedOverlay) return;
        //check if we are in controll of such overlay
        if(buttonsCallbacks[clickedOverlay] == null) return;

        //get modifiers
        var modifiers = '';
        if(event.isControl) modifiers += 'Ctrl';
        if(event.isAlt) modifiers += 'Alt';
        if(event.isShifted) modifiers += 'Shift';
        var callbackName = 'on'+modifiers+'Click';
        
        //check for callback for overlay
        var callback = buttonsCallbacks[clickedOverlay][callbackName] || false;
        if(callback && typeof(callback) === 'function') callback(event);
    };
    Controller.mousePressEvent.connect(mousePressEvent);
	
	
	function updateOverlay(id, settings) {
		if(buttonsOverlays[id] == null) return;
		Overlays.editOverlay(buttonsOverlays[id], settings);
	}
	function setOverlayVisibility(id, isVisible) {
		updateOverlay(id, { visible: isVisible});
	}
	function setOverlayPos(id, pos) {
		updateOverlay(id, {
            bounds: {
                x: pos.x,
                y: pos.y,
                width: buttonPropotions.width, 
                height: buttonPropotions.height
            }}
        );
	}

    // delete overlays on script ending
    Script.scriptEnding.connect(function() {
        for (var i in buttonsOverlays) {
            Overlays.deleteOverlay(buttonsOverlays[i]);
        }
    });

    
	// public method
    return {
        webWindows : webWindows,
		hide : function(id) {
			setOverlayVisibility(id, false);
		},
		show : function(id) {
			setOverlayVisibility(id, true);
		},
        updateVisible : function(buttons) {
            for(var i in buttonsOverlays) setOverlayVisibility(i, false);

            //display 
            nextButtonPos = {x: buttonPanelPos.x, y: buttonPanelPos.y}
            for(var i in buttons) {
                setOverlayPos(buttons[i], nextButtonPos);
                setOverlayVisibility(buttons[i], true);
                nextButtonPos.x = nextButtonPos.x - (buttonPropotions.width + buttonsSpacing);
            }
            
        },
        initialise: function() {
		
        }

    };

})();