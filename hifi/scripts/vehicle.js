(function () {
    var playerControledEntity = null;
    var controlKeys = {};
	var previousCameraMode;
	var cameraAtached = false;
	
    var MAX_MOTOR_TIMESCALE = 0.5;
    var PUSHING_MOTOR_TIMESCALE = 0.25;
    var BRAKING_MOTOR_TIMESCALE = 0.125;
    var VERY_LONG_TIME = 1000000.0;
    
	var MAX_ROTATION_SPEED = 4.0;
    var MAX_SPEED = 4.0;
    var MIN_BRAKING_SPEED = 0.2;
    var pressTimestamps = {};
    var MAX_AUTO_REPEAT_DELAY = 3;
    var KEY_RELEASE_EXPIRY_MSEC = 100;

    var motorAccumulator = {x:0.0, y:0.0, z:0.0};
    var rotationAccumulator = {x:0.0, y:0.0, z:0.0};
    var isBraking = false;

	function hifiKeyInfo(contribution) {
        this.rotationContribution = contribution.rotation || false; // Vec3 contribution of this key toward motorVelocity
        this.motorContribution = contribution.motor || false; // Vec3 contribution of this key toward motorVelocity
        this.releaseTime = new Date(); // time when this button was released
        this.pressTime = new Date(); // time when this button was pressed
        this.isPressed = false;
    }
	
    function initKeyboard(){
		//add keyboard mapping
        var controlActions = {
            moveForward : new hifiKeyInfo({motor:{x: 0.0, y: 0.0, z:-1.0}}),
            moveBackward : new hifiKeyInfo({motor:{x: 0.0, y: 0.0, z: 1.0}}),
            moveRight : new hifiKeyInfo({motor:{x:-1.0, y: 0.0, z: 0.0}}),
            moveLet: new hifiKeyInfo({motor:{x: 1.0, y: 0.0, z: 0.0}}),
            turnRight: new hifiKeyInfo({rotation:{x: 0.0, y: 1.0, z: 0.0}}),
            turnLeft: new hifiKeyInfo({rotation:{x: 0.0, y: -1.0, z: 0.0}}),
        };
        controlKeys = { 
            "8" : controlActions.moveForward,
            "5" : controlActions.moveBackward,
            "7" : controlActions.moveRight,
            "9" : controlActions.moveLet,
            "4" : controlActions.turnRight,
            "6" : controlActions.turnLeft,
        };
    }
	
	function atachCamera() {
		if(cameraAtached) return;
		previousCameraMode = Camera.mode;
		Camera.mode = "independent";
		cameraAtached = true;
	}
	function detachCamera() {
		if(!cameraAtached) return;
		cameraAtached = false;
		Camera.mode = previousCameraMode;
	}

    
    function terminate() {
        detachCamera();
		Entities.deleteEntity(playerControledEntity);
    }

        
    function getKeyFromEvent(event) {
        var keyName = event.text;
        if (keyName != 'SHIFT' && event.isShifted) {
            keyName = "SHIFT+" + keyName;
        }
        return keyName;
    }
    function keyPressEvent(event) {
        var keyName = getKeyFromEvent(event);

		//camera stuff
		if(keyName === '0') {
			if(cameraAtached) {
				detachCamera();
			} else {
				atachCamera();
			}
			return;
		}
		
		//motor stuff
        var key = controlKeys[keyName] || false;
        if(!key) return;
    
        key.pressTime = new Date();
        // set the last pressTimestap element to undefined (MUCH faster than removing from the list)
        pressTimestamps[keyName] = undefined;
        var msec = key.pressTime.valueOf() - key.releaseTime.valueOf();

        if (!key.isPressed) {
            // add this key's effect to the accumulators
            if(key.motorContribution) {
                motorAccumulator = Vec3.sum(motorAccumulator, key.motorContribution);
            }
            if(key.rotationContribution) {
                rotationAccumulator = Vec3.sum(rotationAccumulator, key.rotationContribution);
            }

            key.isPressed = true;
        }
	}
	
    function keyReleaseEvent(event) {
        var keyName = getKeyFromEvent(event);
        var key = controlKeys[keyName] || false;
        if(!key) return;
        
        // add key to pressTimestamps
        pressTimestamps[keyName] = new Date();
        key.releaseTime = new Date();
    }
    
    //vehicle motor update
    function updateMotor(deltaTime) {
        if(!playerControledEntity) return;
        var vehicleProperties = Entities.getEntityProperties(playerControledEntity);
       
        // remove expired pressTimestamps
        var now = new Date();
        for (var keyName in pressTimestamps) {
            var t = pressTimestamps[keyName] || false;
            if(!t) continue;
            
            var msec = now.valueOf() - t.valueOf();
            if (msec > KEY_RELEASE_EXPIRY_MSEC) {
                // the release of this key is now official, and we remove it from the motorAccumulator
                if(controlKeys[keyName].motorContribution) {
                    motorAccumulator = Vec3.subtract(motorAccumulator, controlKeys[keyName].motorContribution);
                }
                if(controlKeys[keyName].rotationContribution) {
                    rotationAccumulator = Vec3.subtract(rotationAccumulator, controlKeys[keyName].rotationContribution);
                }
                controlKeys[keyName].isPressed = false;
                // set the last pressTimestap element to undefined (MUCH faster than removing from the list)
                pressTimestamps[keyName] = undefined;
            }
        }

        var motorVelocity = {x:0.0, y:0.0, z:0.0};

        // figure out if we're pushing or braking
        var velocityAccumulatorLength = Vec3.length(motorAccumulator);
        if (velocityAccumulatorLength == 0.0) {
            if (!isBraking) {
                isBraking = true;
            }
        } else {
            motorVelocity = Vec3.multiply(MAX_SPEED / velocityAccumulatorLength, motorAccumulator);
            
            //add rotation to velocity, to make it go forward
            if(vehicleProperties.rotation.y != 0.0) {
                motorVelocity = Vec3.multiplyQbyV(vehicleProperties.rotation,motorVelocity);
            }
        }

        var motorRotation = {x: 0.0, y: 0.0, z: 0.0};
        var rotationAccumulatorLength = Vec3.length(rotationAccumulator);
        if (rotationAccumulatorLength != 0.0) {
            motorRotation = Vec3.multiply(MAX_ROTATION_SPEED / rotationAccumulatorLength, rotationAccumulator);
        }
        Entities.editEntity(playerControledEntity, { velocity: motorVelocity, angularVelocity: motorRotation,});
    }
    
    
    function updateCamera(dt) {
		if(!cameraAtached) return;
        var vehicleProperties = Entities.getEntityProperties(playerControledEntity);
        
        var position = Vec3.sum(vehicleProperties.position, {x: 0.0, y: 0.7, z: 0.0});
        Camera.setPosition(position);
        
        var orientation = vehicleProperties.rotation;
        
        Camera.setOrientation(vehicleProperties.rotation);
	}
	
	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
	
	
	//rez entity
	playerControledEntity = Entities.addEntity({
		//type: "Box",
		type: "Model",
		modelURL: 'http://vkislichenko.github.io/hifi/res/models/vehicles/hover_tank.fbx',
		position : {
			x: MyAvatar.position.x,
			y: MyAvatar.position.y,
			z: MyAvatar.position.z - 5,
		},
		rotation : {x: 0, y: 1, z: 0, w: 0},
		dimensions : { x: 2, y: 1, z: 3 },
	
		velocity: { x: 0, y: 0, z: 0 },
		gravity: { x: 0, y: 0, z: 0 },
		damping: 0,
		color: { red: getRandomInt(0,255), green: getRandomInt(0,255), blue: getRandomInt(0,255) },
	});

	//init
	initKeyboard();
	atachCamera();
	
	//events
	Controller.keyPressEvent.connect(keyPressEvent);
	Controller.keyReleaseEvent.connect(keyReleaseEvent);
	Script.scriptEnding.connect(terminate);
	//update
	Script.update.connect(updateMotor);
    Script.update.connect(updateCamera);
})();