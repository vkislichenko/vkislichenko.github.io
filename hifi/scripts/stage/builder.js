//
//  interface.js
//
//  version 0.1
//
//  Created by Victor Kislichenko, April 2015
//
//  Presents the UI for the stage.js script
//
//	Icons downloaded from http://icons8.com/ 
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//


StageBuilder = (function() {
    
    //private: Calculators
    var getCirclePoints = function(data)
    {
        if(data.limit <= 0 || data.limit > 360) data.limit = 360;

        var result = [];
        var rotateRad = data.rotate * (Math.PI/180);
        var circleLimitRad = data.limit * (Math.PI/180);


        for(var i = 0; i < data.pointsAmount+1; i++) {
            var angleRad = circleLimitRad * i / data.pointsAmount;
            //var angleDeg = angleRad * (180/Math.PI);
            result.push({
                x : data.center.x + data.radius * Math.cos(angleRad + rotateRad),
                y : data.center.x + data.radius * Math.sin(angleRad + rotateRad),   
            });
        }
        return result;
    }

    var lineDistance = function(pointA, pointB)
    {
        var dist = {
            x : Math.abs(pointA.x - pointB.x),
            y : Math.abs(pointA.y - pointB.y),
        }
        return Math.sqrt(dist.x * dist.x + dist.y * dist.y);
    }

    var getBlocsFromPoints = function(points, options)
    {
        var result = [];
        var gapFix = options.block_gapfix;
        for(var i = 0; i < points.length-1; i++) {
            var block = {
                pointA : points[i],
                pointB : points[i+1],
            };
            block.proportions = {
                length : lineDistance(block.pointA, block.pointB) + gapFix,
            };
            block.pointCenter = {
                x : (block.pointA.x + block.pointB.x) / 2,
                y : (block.pointA.y + block.pointB.y) / 2,
            }
            block.rotation = Math.atan2(block.pointB.y - block.pointA.y,block.pointB.x - block.pointA.x);
            block.rotationDeg = block.rotation * (180/Math.PI);
            result.push(block);
        }
        return result;
    }

    function colorLuminance(hex, lum) {
        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#", c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i*2,2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00"+c).substr(c.length);
        }

        return rgb;
    }
    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
    
    function normalizeDegrees(degrees) {
        while (degrees > 180) degrees -= 360;
        while (degrees < -180) degrees += 360;
        return degrees;
    }
    
    //public
    var that = {
		options: {
            levels : 5,
            blocks : 20,
            circle_radius: 5,
            circle_limit: 180,
            circle_rotate: 0,
            block_height: 0.5,
            block_depth: 2,
            block_gapfix: 0.1,
            block_script: '',
            block_color_random: false,
            block_color_base: "#E6E6E6",
        },
	};
    
    that.calc = function() {
        var result = [];
        
        //get points
        var circleConfig = {
            pointsAmount : that.options.blocks,
            radius : that.options.circle_radius,
            limit: that.options.circle_limit,
            rotate : that.options.circle_rotate,
            center : {
                x : 0,
                y : 0,
            },
        };
        //build all levels
        for(var i = 0; i < that.options.levels; i++) {
            var levelResult = {
                level : i,
            };
            //get points
            levelResult.points = getCirclePoints(circleConfig);
            //get blocks
            levelResult.blocs = getBlocsFromPoints(levelResult.points, that.options);

            result.push(levelResult);

            circleConfig.radius += that.options.block_depth-that.options.block_gapfix;
        }
        
        return result;
    }
    
    
    
    that.build = function()
    {
        if(!StageManager.managerEntity) return;

        //delete existing blocks
        that.clear();
        
        //second: resize stage floor
        var managerEntityProperties = Entities.getEntityProperties(StageManager.managerEntity);
        var managerEntityDimensions = managerEntityProperties.dimensions;
        managerEntityDimensions.x = that.options.circle_radius * 2;
        managerEntityDimensions.z = that.options.circle_radius * 2;
        Entities.editEntity(StageManager.managerEntity, {dimensions: managerEntityDimensions});

        
        //create blocks
        var result = [];
        var blueprint = that.calc();
        
        //center
        var stageEntityProperties = Entities.getEntityProperties(StageManager.managerEntity);
        var center = {
            x : stageEntityProperties.position.x,
            y : stageEntityProperties.position.y,
            z : stageEntityProperties.position.z,
        };

        var blockColor = that.options.block_color_base;
        var blockColorLum = -0.05 / that.options.levels;
        for(var i in blueprint)
        {
            var level = blueprint[i];
            var blockColorRGB = hexToRgb(blockColor);
            if(that.options.block_color_random) {
                var blockColorRGB = { r: getRandomInt(0,255), g: getRandomInt(0,255), b: getRandomInt(0,255) };
            }

            //draw blocks
            for(var j in level.blocs)
            {
                var block = level.blocs[j];
                var blockEntityProperties = {
                    type: "Box",
                    position : {
                        x: block.pointCenter.x + center.x,
                        z: block.pointCenter.y + center.z,
                        y: center.y + that.options.block_height * level.level,
                    },
                    registrationPoint: {x:0.5, y:0, z:0.5},
                    rotation : Quat.fromPitchYawRollRadians(0, -1*block.rotation, 0),

                    dimensions : { 
                        x: block.proportions.length+that.options.block_gapfix,
                        y: that.options.block_height, 
                        z: that.options.block_depth, 
                    },

                    velocity: { x: 0, y: 0, z: 0 },
                    gravity: { x: 0, y: 0, z: 0 },
                    damping: 0,
                    color: { red: blockColorRGB.r, green: blockColorRGB.g, blue: blockColorRGB.b },

                    script : that.options.block_script,

                    userData : JSON.stringify({
                        isStageBlock: true,
                        stageEntity : StageManager.managerEntity.id,
                    }),
                };
                var blockEntityCreated = Entities.addEntity(blockEntityProperties);
                var blockEntity = Entities.identifyEntity(blockEntityCreated);
                result.push(blockEntity);
            }
            if(blockColorLum !== 0) blockColor = colorLuminance(blockColor, blockColorLum);
        }

    
        return result;
    }
    
    that.clear = function() {
        if(!StageManager.managerEntity) return;
        //delete from hf
        var userData = StageManager.getUserData();
        if(userData.blocks) {
            for(var i in userData.blocks) {
                var blockEntity = userData.blocks[i];
                if (!blockEntity.isKnownID) {
                    blockEntity = Entities.identifyEntity(blockEntity);
                }
                Entities.deleteEntity(blockEntity); 
            }
        }
        
        //delete from userData
        userData.blocks = [];
        StageManager.setUserData(userData);
    }
    
    return that;
})()