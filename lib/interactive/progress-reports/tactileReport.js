const JsonDB = require('node-json-db');

// Tactile
function tactileProgress(tactile) {

    if(!tactile || !tactile.length) return [];

    var json = [];

    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('/interactive/activeBoard');
    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
    var controls = dbControls.getData('/');

    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;

        var button = controls.tactile[rawid];

        if(button !== undefined){
            // Get cooldown and convert from seconds to milliseconds
            var cooldown = parseInt( button['cooldown'] ) * 1000;

            // Push cooldown to json if a button is being held or pushed.
            if (isNaN(holding) === false && holding > 0 || isNaN(press) === false && press > 0) {
                json.push({
                    "id": rawid,
                    "cooldown": cooldown,
                    "fired": true
                });

                // If this button has any cooldown buddies, then also put them on cooldown.
                var cooldownBuddies = button['cooldownButtons'];
                var cooldownBuddyArray = cooldownBuddies.replace(/ /g,'').split(',');

                if (cooldownBuddyArray.length > 0){
                    cooldownBuddyArray.forEach( function(id){
                        if (id === "") return;
                        json.push({
                            "id": parseInt(id),
                            "cooldown": cooldown,
                            "fired": true
                        });
                    })
                }
            }
        }
    }
    return json;
}

// Module Exports
exports.update = tactileProgress;