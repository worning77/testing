from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import SemanticSimilarityExampleSelector
from langchain.vectorstores import Chroma
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain.prompts import PromptTemplate, ChatPromptTemplate, HumanMessagePromptTemplate
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.prompts import (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)
from flask import Flask, request, jsonify
import json
from flask_cors import CORS



follow_up_enabled = False

def parse_JSON(jsonString):
    res = {}

    # Check for empty or None input
    if not jsonString:
        return res

    # Remove '{' and '}'
    cleaned_string = jsonString[jsonString.find("{")+1:jsonString.rfind("}")].strip()

    # Extracting type
    if '"type":' in cleaned_string:
        start_type = cleaned_string.index('"type": ') + len('"type": ')
        end_type = cleaned_string.index(',', start_type)
        type_value = cleaned_string[start_type:end_type].strip('"').strip()
        res['type'] = type_value


    if '"message":' in cleaned_string:
        start_type = cleaned_string.index('"message": ') + len('"message": ')
        end_type = cleaned_string.index(',', start_type)
        messagevalue = cleaned_string[start_type:end_type].strip('"').strip()
        res['message'] = messagevalue


    # Extracting content
    if '"content":' in cleaned_string:
        start_content = cleaned_string.index('"content":') + len('"content":')
        content_value = cleaned_string[start_content:].strip().lstrip('"""').rstrip('"""')
        content_value = content_value.replace("\\" , "")
        res['content'] = content_value


    return res


examples = [
    #Generation of Static Shapes
    #1
    {
        "input":"Create a solid static cube shape",
        "output": """
        {
        "type": "script",
        "message": "Created a solid static cube shape",
        "content": \"\"\"
            // Initialize dynamicScriptParams for the solid cube with uniform height
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    cubeSize: 10, // Size of the cube
                    positionX: 7, // X position of the cube
                    positionY: 7, // Y position of the cube
                    positionZ: 25  // Uniform height of the cube
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.cubeSize = 10; // New size if necessary
                window.dynamicScriptParams.positionX = 7; // New X position
                window.dynamicScriptParams.positionY = 7; // New Y position
                window.dynamicScriptParams.positionZ = 25; // New height
            }

            // Function to update parameters for the solid 2D cube representation
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for the solid 2D cube representation
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function to generate a solid 2D representation of a cube with uniform height
            function dynamicScript(InFORM, clock) {
                const { cubeSize, positionX, positionY, positionZ } = dynamicScriptParams;

                // Ensure x and y positions are integers
                const roundedX = Math.round(positionX);
                const roundedY = Math.round(positionY);

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Create a solid 2D representation of a cube with uniform height
                for (let x = roundedX; x < roundedX + cubeSize && x < InFORM.grid_x; x++) {
                    for (let y = roundedY; y < roundedY + cubeSize && y < InFORM.grid_y; y++) {
                        let index = y * InFORM.grid_y + x;
                        if (index < InFORM.Pins.length) {
                            // Set the pin height uniformly to positionZ
                            InFORM.Pins[index].setPos(positionZ);
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
            \"\"\"
        }
        """
    },
    #2
    {
        "input":"Create a solid static circle shape",
        "output": """
        {
        "type": "script",
        "message": "Created a static circle shape",
        "content": \"\"\"
            // Initialize dynamicScriptParams for the static circle shape with adjustable height
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    radius: 5, // Radius of the circle
                    centerX: 12, // X position of the circle's center
                    centerY: 12, // Y position of the circle's center
                    height: 25  // Height of the circle
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.radius = 5; // New radius if necessary
                window.dynamicScriptParams.centerX = 12; // New X position of center
                window.dynamicScriptParams.centerY = 12; // New Y position of center
                window.dynamicScriptParams.height = 25; // New height
            }

            // Function to update parameters for the static circle shape
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for the static circle shape
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function to generate a static circle shape with adjustable height
            function dynamicScript(InFORM, clock) {
                const { radius, centerX, centerY, height } = dynamicScriptParams;

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Create a static circle shape
                for (let x = 0; x < InFORM.grid_x; x++) {
                    for (let y = 0; y < InFORM.grid_y; y++) {
                        let dx = x - centerX;
                        let dy = y - centerY;
                        let distance = Math.sqrt(dx * dx + dy * dy);
                        let index = y * InFORM.grid_y + x;

                        if (distance < radius && index < InFORM.Pins.length) {
                            // Set the pin height to 'height' for pins inside the circle
                            InFORM.Pins[index].setPos(height);
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
            \"\"\"
        }"""
    },
    #3
    {
        "input":"Create a solid static triangle shape",
        "output": """
        {
        "type": "script",
        "message": "Created a static triangle shape",
        "content": \"\"\"
            // Initialize dynamicScriptParams for the static triangle shape with adjustable height
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    baseLength: 15, // Base length of the triangle
                    positionX: 4,   // X position of the triangle's base
                    positionY: 20,  // Y position of the triangle's base
                    height: 25       // Height of the triangle
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.baseLength = 15; // New base length if necessary
                window.dynamicScriptParams.positionX = 4;   // New X position
                window.dynamicScriptParams.positionY = 20;  // New Y position
                window.dynamicScriptParams.height = 25;      // New height
            }

            // Function to update parameters for the static triangle shape
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for the static triangle shape
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function to generate a static triangle shape with adjustable height
            function dynamicScript(InFORM, clock) {
                const { baseLength, positionX, positionY, height } = dynamicScriptParams;

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Create a static triangle shape
                for (let y = positionY; y > positionY - baseLength; y--) {
                    for (let x = positionX + positionY - y; x < positionX + baseLength - (positionY - y); x++) {
                        let index = y * InFORM.grid_y + x;

                        if (index < InFORM.Pins.length) {
                            // Set the pin height to 'height' for pins inside the triangle
                            InFORM.Pins[index].setPos(height);
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
            \"\"\"
        }"""
    },
    #Creating Animated Shapes
    #1
    {
        "input":"Make the static square shape move up and down",
        "output":"""
        {
        "type": "script",
        "message": "Animated a static square shape",
        "content": \"\"\"
            // Initialize dynamicScriptParams for animating a static square shape
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    squareSize: 10,  // Size of the square
                    positionX: 7,    // X position of the square
                    positionY: 7,    // Y position of the square
                    height: 25,       // Initial height of the square
                    animationSpeed: 1 // Speed of the height change animation
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.squareSize = 10;   // New size if necessary
                window.dynamicScriptParams.positionX = 7;     // New X position
                window.dynamicScriptParams.positionY = 7;     // New Y position
                window.dynamicScriptParams.height = 25;        // New height
                window.dynamicScriptParams.animationSpeed = 1; // New animation speed
            }

            // Function to update parameters for animating the square
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for animating the square
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function to animate a static square shape
            function dynamicScript(InFORM, clock) {
                const { squareSize, positionX, positionY, height, animationSpeed } = dynamicScriptParams;

                // Ensure x and y positions are integers
                const roundedX = Math.round(positionX);
                const roundedY = Math.round(positionY);

                // Calculate the current height based on the animation
                let currentHeight = height + Math.sin(clock.getElapsedTime() * animationSpeed) * height;

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Animate the static square shape
                for (let x = roundedX; x < roundedX + squareSize && x < InFORM.grid_x; x++) {
                    for (let y = roundedY; y < roundedY + squareSize && y < InFORM.grid_y; y++) {
                        let index = y * InFORM.grid_y + x;
                        if (index < InFORM.Pins.length) {
                            // Set the pin height to the animated current height
                            InFORM.Pins[index].setPos(Math.max(0, currentHeight)); // Ensure height is non-negative
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
            \"\"\"
        }
        """
    },
    #2
    {
        "input": "animate an expanding and contracting circle",
        "output": """
            {
            "type": "script",
            "message": "Animated an expanding and contracting circle",
            "content": \"\"\"
                // Initialize dynamicScriptParams for animating an expanding and contracting circle
                if (typeof window.dynamicScriptParams === 'undefined') {
                    window.dynamicScriptParams = {
                        initialRadius: 5,    // Initial radius of the circle
                        centerX: 12,         // X position of the circle's center
                        centerY: 12,         // Y position of the circle's center
                        height: 25,           // Height of the circle
                        maxRadius: 10,       // Maximum radius in the animation
                        minRadius: 3,        // Minimum radius in the animation
                        animationSpeed: 0.5  // Speed of the radius change animation
                    };
                } else {
                    // Update values if needed
                    window.dynamicScriptParams.initialRadius = 5;   // New initial radius if necessary
                    window.dynamicScriptParams.centerX = 12;        // New X position of center
                    window.dynamicScriptParams.centerY = 12;        // New Y position of center
                    window.dynamicScriptParams.height = 25;          // New height
                    window.dynamicScriptParams.maxRadius = 10;      // New maximum radius
                    window.dynamicScriptParams.minRadius = 3;       // New minimum radius
                    window.dynamicScriptParams.animationSpeed = 0.5; // New animation speed
                }

                // Function to update parameters for animating the circle
                function setDynamicScriptParams(newParams) {
                    dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
                }

                // Function to get current parameters for animating the circle
                function getDynamicScriptParams() {
                    return dynamicScriptParams;
                }

                // The dynamic script function to animate an expanding and contracting circle
                function dynamicScript(InFORM, clock) {
                    const { initialRadius, centerX, centerY, height, maxRadius, minRadius, animationSpeed } = dynamicScriptParams;

                    // Calculate the current radius based on the animation
                    let currentRadius = initialRadius + Math.sin(clock.getElapsedTime() * animationSpeed) * (maxRadius - minRadius) / 2;

                    // Ensure centerX and centerY positions are integers
                    const roundedCenterX = Math.round(centerX);
                    const roundedCenterY = Math.round(centerY);

                    // Reset all pins to default position
                    InFORM.Pins.forEach(pin => pin.setPos(0));

                    // Animate the expanding and contracting circle
                    for (let x = 0; x < InFORM.grid_x; x++) {
                        for (let y = 0; y < InFORM.grid_y; y++) {
                            let dx = x - roundedCenterX;
                            let dy = y - roundedCenterY;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            let index = y * InFORM.grid_y + x;

                            if (distance <= currentRadius && index < InFORM.Pins.length) {
                                // Set the pin height to 'height' for pins inside the circle
                                InFORM.Pins[index].setPos(height);
                            }
                        }
                    }
                }

                // Expose the dynamic script and parameter functions globally
                window.dynamicScript = dynamicScript;
                window.setDynamicScriptParams = setDynamicScriptParams;
                window.getDynamicScriptParams = getDynamicScriptParams;
            \"\"\"
            }
        """
    },
    #3
    {
        "input":"animate a rotating triangle",
        "output":"""
        {
        "type": "script",
        "message": "Animated a rotating triangle",
        "content": \"\"\"
            // Initialize dynamicScriptParams for animating a rotating triangle
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    sideLength: 10,       // Side length of the triangle
                    centerX: 12,          // X position of the triangle's center
                    centerY: 12,          // Y position of the triangle's center
                    height: 25,            // Height of the triangle
                    rotationSpeed: 0.2    // Speed of the rotation
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.sideLength = 10;    // New side length if necessary
                window.dynamicScriptParams.centerX = 12;       // New center X position
                window.dynamicScriptParams.centerY = 12;       // New center Y position
                window.dynamicScriptParams.height = 25;         // New height
                window.dynamicScriptParams.rotationSpeed = 0.2; // New rotation speed
            }

            // Function to update parameters for animating the triangle
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for animating the triangle
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // Helper function to check if a point is inside the rotating triangle
            function isInsideRotatingTriangle(x, y, time, rotationSpeed, centerX, centerY, sideLength) {
                // Calculate the vertices of the triangle
                let angle = Math.PI / 6 + time * rotationSpeed; // Starting angle offset for upright triangle
                let vertices = [];
                for (let i = 0; i < 3; i++) {
                    vertices.push({
                        x: centerX + Math.cos(angle + 2 * Math.PI * i / 3) * sideLength / Math.sqrt(3),
                        y: centerY + Math.sin(angle + 2 * Math.PI * i / 3) * sideLength / Math.sqrt(3)
                    });
                }

                // Check if point (x, y) is inside the triangle formed by the vertices
                let b1, b2, b3;

                function sign(p1, p2, p3) {
                    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
                }

                b1 = sign({x, y}, vertices[0], vertices[1]) < 0.0;
                b2 = sign({x, y}, vertices[1], vertices[2]) < 0.0;
                b3 = sign({x, y}, vertices[2], vertices[0]) < 0.0;

                return ((b1 == b2) && (b2 == b3));
            }

            // The dynamic script function to animate a rotating triangle
            function dynamicScript(InFORM, clock) {
                const { sideLength, centerX, centerY, height, rotationSpeed } = dynamicScriptParams;

                // Ensure centerX and centerY positions are integers
                const roundedCenterX = Math.round(centerX);
                const roundedCenterY = Math.round(centerY);

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Animate the rotating triangle
                for (let x = 0; x < InFORM.grid_x; x++) {
                    for (let y = 0; y < InFORM.grid_y; y++) {
                        if (isInsideRotatingTriangle(x, y, clock.getElapsedTime(), rotationSpeed, roundedCenterX, roundedCenterY, sideLength)) {
                            let index = y * InFORM.grid_y + x;
                            if (index < InFORM.Pins.length) {
                                // Set the pin height to 'height' for pins inside the triangle
                                InFORM.Pins[index].setPos(height);
                            }
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
        \"\"\"
        }
        """
    },
    #Creating motions
    #1
    {
      "input": "Create a wave motion",
      "output": """
      {
        "type": "script",
        "message": "Created a wave motion",
        "content": \"\"\"
            // Adjust this part in your dynamically loaded scripts
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    amplitude: 20, // Default values
                    frequency: 0.5,
                    waveSpeed: 2
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.amplitude = 20; // New values if necessary
                window.dynamicScriptParams.frequency = 0.5;
                window.dynamicScriptParams.waveSpeed = 2;
            }

            // Function to update parameters
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function with animation logic
            function dynamicScript(InFORM, clock) {
                const { amplitude, frequency, waveSpeed } = dynamicScriptParams;


                const elapsedTime = clock.getElapsedTime();

                for (let i = 0; i < InFORM.Pins.length; i++) {
                    const xPosition = i % InFORM.grid_x;

                    const sineValue = Math.sin((xPosition + elapsedTime * waveSpeed) * frequency) * amplitude;
                    InFORM.Pins[i].setPos(sineValue + amplitude);
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
        \"\"\"
      }
      """
    },
    #2
    {
        "input":"create a radial wave motion",
        "output":"""
        {
        "type": "script",
        "message": "Generated a radial wave motion",
        "content": \"\"\"
            // Initialize dynamicScriptParams for generating a radial wave motion
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    waveAmplitude: 5,   // Amplitude of the wave
                    waveFrequency: 1,   // Frequency of the wave
                    centerX: 12,        // X position of the wave center
                    centerY: 12,        // Y position of the wave center
                    speed: 2            // Speed of wave propagation
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.waveAmplitude = 5; // New amplitude if necessary
                window.dynamicScriptParams.waveFrequency = 1; // New frequency
                window.dynamicScriptParams.centerX = 12;      // New X position of center
                window.dynamicScriptParams.centerY = 12;      // New Y position of center
                window.dynamicScriptParams.speed = 2;         // New speed
            }

            // Function to update parameters for the radial wave motion
            function setDynamicScriptParams(newParams) {
                dynamicScriptParams = { ...dynamicScriptParams, ...newParams };
            }

            // Function to get current parameters for the radial wave motion
            function getDynamicScriptParams() {
                return dynamicScriptParams;
            }

            // The dynamic script function to generate a radial wave motion
            function dynamicScript(InFORM, clock) {
                const { waveAmplitude, waveFrequency, centerX, centerY, speed } = dynamicScriptParams;

                // Reset all pins to default position
                InFORM.Pins.forEach(pin => pin.setPos(0));

                // Generate the radial wave motion
                for (let x = 0; x < InFORM.grid_x; x++) {
                    for (let y = 0; y < InFORM.grid_y; y++) {
                        let dx = x - centerX;
                        let dy = y - centerY;
                        let distance = Math.sqrt(dx * dx + dy * dy);
                        let index = y * InFORM.grid_y + x;

                        // Calculate wave height at this point
                        let waveHeight = waveAmplitude * Math.sin(waveFrequency * distance - speed * clock.getElapsedTime());

                        if (index < InFORM.Pins.length) {
                            InFORM.Pins[index].setPos(waveHeight);
                        }
                    }
                }
            }

            // Expose the dynamic script and parameter functions globally
            window.dynamicScript = dynamicScript;
            window.setDynamicScriptParams = setDynamicScriptParams;
            window.getDynamicScriptParams = getDynamicScriptParams;
        \"\"\"
        }
        """
    },
    #3
    {
        "input":"create a spiral motion",
        "output":"""
        {
        "type": "script",
        "message": "Generated a spiral motion with adjustable height",
        "content": \"\"\"
            // Initialize dynamicScriptParams for generating a spiral motion with adjustable height
            if (typeof window.dynamicScriptParams === 'undefined') {
                window.dynamicScriptParams = {
                    spiralFrequency: 1,  // Frequency of the spiral
                    centerX: 12,         // X position of the spiral's center
                    centerY: 12,         // Y position of the spiral's center
                    speed: 2,            // Speed of spiral expansion
                    maxRadius: 12,       // Maximum radius of the spiral
                    height: 5            // Height of the spiral
                };
            } else {
                // Update values if needed
                window.dynamicScriptParams.spiralFrequency = 1; // New frequency if necessary
                window.dynamicScriptParams.centerX = 12;        // New X position of center
                window.dynamicScriptParams.centerY = 12;        // New Y position of center
                window.dynamicScriptParams.speed = 2;           // New speed
                window.dynamicScriptParams.maxRadius = 12;      // New maximum radius
                window.dynamicScriptParams.height = 5;          // New height
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
                for (let x = 0; x < InFORM.grid_x; x++) {
                    for (let y = 0; y < InFORM.grid_y; y++) {
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
        \"\"\"
        }
        """
    },
]
#Defining output parser
response_schemas = [
    ResponseSchema(name="type", description="type of output"),
    ResponseSchema(name="message", description="message to the system"),
    ResponseSchema(name="content", description="script content"),
]
output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
format_instructions = output_parser.get_format_instructions()

#store few shot examples
to_vectorize = [" ".join(example.values()) for example in examples]
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(to_vectorize, embeddings, metadatas=examples)

example_selector = SemanticSimilarityExampleSelector(
    vectorstore=vectorstore,
    k=2,
)

# Define the few-shot prompt.
example_prompt = FewShotChatMessagePromptTemplate(
    # The input variables select the values to pass to the example_selector
    input_variables=["input"],
    example_selector=example_selector,
    # Define how each example will be formatted.
    # In this case, each example will become 2 messages:
    # 1 human, and 1 AI
    example_prompt=ChatPromptTemplate.from_messages(
        [("human", "{input}"), ("ai", "{output}")]
    ),
    partial_variables={"format_instructions": format_instructions},
)


final_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a AI software control system which highly skilled Javascript. Your primary responsibility is to generate script behaviors(including shape, motion and Interactions) on shape display hardwares used to controll individual pins."),
        example_prompt,
        ("human", "{input}"),
    ]
)

final_prompt_noRAG = ChatPromptTemplate.from_messages(
    [
        ("system", "You are a AI software control system which highly skilled Javascript. Your primary responsibility is to generate script behaviors(including shape, motion and Interactions) on shape display hardwares used to controll individual pins."),
        ("human", "{input}"),
    ]
)

chat_history = []

chain = {
    "input": lambda x: x["input"],
    "chat_history": lambda x: x["chat_history"],
} | final_prompt | ChatOpenAI(temperature=0.0)

chain_noRAG = {
    "input": lambda x: x["input"],
    "chat_history": lambda x: x["chat_history"],
} | final_prompt_noRAG | ChatOpenAI(temperature=0.0)

#OPERATION MODE

# Initialize Flask
app = Flask(__name__)
CORS(app)

OPENAI_API_KEY= None

@app.route('/activate', methods=['POST'])
def activate():
    global OPENAI_API_KEY
    data = request.json
    OPENAI_API_KEY = data.get('apiKey')

    if OPENAI_API_KEY:  # You might want to add additional validation for the API key
        return jsonify({'success': True, 'message': 'API key activated successfully'})
    else:
        return jsonify({'success': False, 'message': 'Invalid API key'}), 400



@app.route('/toggle_follow_up', methods=['POST'])
def toggle_follow_up():
    global follow_up_enabled
    data = request.json
    follow_up_enabled = data.get("followUpEnabled", False)
    return jsonify({"message": "Follow-up state updated", "state": follow_up_enabled})


# Route to handle POST requests
@app.route('/generate_script', methods=['POST'])
def generate_script():
    global follow_up_enabled
    data = request.json
    user_input = data.get("input")
    print(user_input)

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    # Invoke your existing logic
    # Check if follow-ups are enabled
    if follow_up_enabled:
        # Logic for follow-up (bypass retrieval)
        output = chain_noRAG.invoke({"input": user_input, "chat_history": chat_history})
    else:
        # Existing logic with retrieval
        output = chain.invoke({"input": user_input, "chat_history": chat_history})
    res = parse_JSON(output.content)

    # Update chat history
    chat_history.append({"input": user_input, "output": res})
    print(res)
    # Respond with the generated script
    return jsonify(res)

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)


