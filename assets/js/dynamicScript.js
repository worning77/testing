    // Initialize dynamicScriptParams for generating a spiral motion with adjustable height
    if (typeof window.dynamicScriptParams === 'undefined') {
        window.dynamicScriptParams = {
            spiralFrequency: 1,  // Frequency of the spiral
            centerX: 12,         // X position of the spiral's center
            centerY: 12,         // Y position of the spiral's center
            speed: 2,            // Speed of spiral expansion
            maxRadius: 12,       // Maximum radius of the spiral
            height: 25            // Height of the spiral
        };
    } else {
        // Update values if needed
        window.dynamicScriptParams.spiralFrequency = 1; // New frequency if necessary
        window.dynamicScriptParams.centerX = 12;        // New X position of center
        window.dynamicScriptParams.centerY = 12;        // New Y position of center
        window.dynamicScriptParams.speed = 2;           // New speed
        window.dynamicScriptParams.maxRadius = 12;      // New maximum radius
        window.dynamicScriptParams.height = 25;          // New height
    }

    // Function to update parameters for the spiral motion
    function setDynamicScriptParams(newParams) {
        dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
    }

    // Function to get current parameters for the spiral motion
    function getDynamicScriptParams() {
        return dynamicScriptParams;
    }

    // The dynamic script function to generate a spiral motion with adjustable height
    function dynamicScript(InFORM, clock) {
        const { spiralFrequency, centerX, centerY, speed, maxRadius, height } = dynamicScriptParams;

        // Reset all pins to default position
        InFORM.Pins.forEach(pin => pin.setPos(0));

        // Generate the spiral motion
        for (let y = 0; y < InFORM.grid_y; y++) {
            for (let x = 0; x < InFORM.grid_x; x++) {
                let dx = x - centerX;
                let dy = y - centerY;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let angle = Math.atan2(dy, dx);

                let spiralArmDistance = Math.abs(distance - speed * clock.getElapsedTime() % maxRadius);
                let wave = Math.sin(spiralFrequency * (angle + spiralArmDistance)) * height;

                let index = y * InFORM.grid_y + x;

                if (index < InFORM.Pins.length) {
                    InFORM.Pins[index].setPos(wave);
                }
            }
        }
    }

    // Expose the dynamic script and parameter functions globally
    window.dynamicScript = dynamicScript;
    window.setDynamicScriptParams = setDynamicScriptParams;
    window.getDynamicScriptParams = getDynamicScriptParams;
