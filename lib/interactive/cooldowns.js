const dataAccess = require('../data-access.js');
const mixerInteractive = require('./mixer-interactive.js');

// This var will save the cooldown status of all buttons.
cooldownSaved = []

// Cooldown Router
function cooldownRouter(mixerControls, mixerControl, firebot, control){

    return new Promise((resolve, reject) => {
        var cooldown = control.cooldown;
        var groupName = control.cooldownGroup;

        if(groupName !== undefined && groupName !== ""){
            // This button has a cooldown group... so it's time to cool them all down.
            var groupsJson = firebot.cooldownGroups[groupName];

            try{
                // This will error out if the cooldown group this button is assigned to no longer exists.
                var buttons = groupsJson.buttons;
                var cooldown = parseInt( groupsJson['length'] ) * 1000;

                // For each button in the cooldown group...
                groupCooldown(buttons, cooldown, firebot)

                // Resolve
                resolve(true);
            }catch(err){
                // This cooldown group was deleted. Fix this control.
                var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
                var gameName = dbSettings.getData('/interactive/lastBoard');
                var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
                dbControls.delete('./firebot/controls/'+control.controlId+'/cooldownGroup');

                // Let's check to see if this one button needs to cool down then...
                if (cooldown !== undefined && cooldown > 0){
                    var cooldown = parseInt(control.cooldown) * 1000;
                    var cooldownCheck = cooldownChecker(control.controlId, cooldown);
                    if(cooldownCheck === true){
                        console.log('Cooling Down (Single): '+ control.controlId + ' for '+cooldown);
                        mixerControl.setCooldown(cooldown);
                    }
                }

                // Resolve
                resolve(true);
            }
            
        } else {
            // Button doesn't have a cooldown group, so let's just cool down this one button.

            // If cooldown is not listed or zero, then don't do anything.
            if (cooldown !== undefined && cooldown > 0){
                var cooldown = parseInt(control.cooldown) * 1000;
                var cooldownCheck = cooldownChecker(control.controlId, cooldown);
                if(cooldownCheck === true){
                    console.log('Cooling Down (Single): '+ control.controlId + ' for '+cooldown);
                    mixerControl.setCooldown(cooldown);
                }
            }

            // Resolve
            resolve(true);
        }
    });
}

// Group Cooldown
// Buttons should be an array of controlIDs that should be cooled down.
function groupCooldown(buttons, cooldown, firebot){
    
    // Loop through and find button to cool down.
    for(button of buttons){
       var cooldownCheck = cooldownChecker(button, cooldown);
       if(cooldownCheck === true){
            var buttonJson = firebot.controls[button];
            var scene = buttonJson.scene;
            mixerInteractive.returnButton(button, scene)
            .then((control) => {
                console.log('Cooling Down (Group): '+ control.controlID + ' for '+cooldown);
                control.setCooldown(cooldown);
            })
       }
    }
}

// Cooldown Checker
// This function checks to see if a button should be cooled down or not based on current cooldown count. 
// It will return true if the new cooldown is longer than what is was already.
function cooldownChecker(buttonID, cooldown){
    // Get current time in milliseconds
    var dateNow = Date.now();

    // Add cooldown amount to current time. Save to var newTime.
    var newTime = dateNow + cooldown;

    // Go look into cooldownSaved for this button. Save to var oldTime.
    var oldTime = cooldownSaved[buttonID];

    // If new time is bigger than oldTime resolve true, else false.
    if(oldTime === undefined || newTime > oldTime){
        // Push new value and resolve.
        cooldownSaved[buttonID] = newTime;
        return true;
    } else {
        // Keep old time.
        return false;
    }
}

// Exports
exports.router = cooldownRouter;
exports.group = groupCooldown;