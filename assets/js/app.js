import * as THREE from './libs/three/three.module.js';
import { OrbitControls } from './libs/three/jsm/OrbitControls.js';
import { Stats } from './libs/stats.module.js';

//import conponents
//TODO: need to have a pin object
import { SkyTexture } from './utilits/sky.js';
import { background } from './utilits/background.js';
import { inFORM } from './shapes/inForm.js';

class App {
  constructor() {
    this.loadFont('assets/js/libs/Roboto_Regular.json')
      .then((font) => {
        this.id_font = font;
        //** Init all necessary parts of the scene
        this.initializeScene();
        this.initializeMQTT();
        //** flag for MQTT connection */
        this.isMQTTConnected = false;
        //** flag for excuting the loaded script(which is a function) */
        this.DynamicScriptLoaded = false;
        //** flag for excuting the loaded script(which is a module) */
        //this.loadedDynamicModule = null;
        //** Maintain the history */
        this.scriptHistory = [];

        //TODO: create a set of shape-displays

        this.InFORM = new inFORM(this);
        this.InFORM.createInFORM();

        this.renderer.setAnimationLoop(this.render.bind(this));
        //this.animate(); //test for math frame rate

        //this.testcode();
      })
      .catch((error) => {
        console.error('Error loading font:', error);
      });
  }
  /*-----------------------------------------------------------------------*/
  /*--------------------------test running area----------------------------*/
  loadExampleScript(src, callback) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    script.onload = callback;
    script.id = 'dynamic-script';
    document.head.appendChild(script);
  }
  testcode() {
    this.loadExampleScript(
      'assets/js/dynamicScript.js',
      () => {
        this.fetchAndCreateSliders(); // Call after dynamicScript is loaded and methods are set
      },
      (this.DynamicScriptLoaded = true)
    );
  }
  //*-----------------------------------------------------------------------*/
  //*--------------------------Initializing area----------------------------*/
  initializeMQTT() {
    const mqttConnectCheckbox = document.getElementById('mqttConnectCheckbox');
    if (mqttConnectCheckbox.checked) {
      this.mqttClient = mqtt.connect('wss://for-shape-it.cloud.shiftr.io', {
        clientId: 'SHAPEIT-web',
        username: 'for-shape-it',
        password: 'OimaSD0bYaeiadhv',
      });

      this.mqttClient.on('connect', () => {
        console.log('connected to MQTT!');
        this.isMQTTConnected = true;
      });

      this.mqttClient.on('close', () => {
        console.log('MQTT connection closed');
        this.isMQTTConnected = false;
      });
    }
  }

  initializeScene() {
    //window info
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.mouseX = 0;
    this.mouseY = 0;
    this.clock = new THREE.Clock();

    //camera setting:
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      10,
      10000
    );
    const cameraHeight = 500; // Adjust as needed
    const cameraDistance = cameraHeight * Math.tan(Math.PI / 4); // 45 degrees
    this.camera.position.set(0, cameraHeight, cameraDistance); //-cameraDistance
    this.camera.lookAt(0, 0, 0);

    //Scene sky setting
    this.scene = new THREE.Scene();
    this.skyTexture = new SkyTexture(1024, 1024);
    this.skyTexture.render();
    this.background = new background();
    this.sky = this.background.createSkySphere(this.skyTexture.ctx.canvas);
    this.scene.add(this.sky);
    this.scene.fog = new THREE.Fog(0x7df9ff, 300, 1500);
    //Only have light can see the color of objects
    //hemispherelight(Sky color, ground color, intensity)
    const environmentLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    this.scene.add(environmentLight);

    //add direct light from a position.
    const light = new THREE.DirectionalLight(0x1f51ff, 1);
    light.position.set(0, 100, 0);
    this.scene.add(light);

    //Renderer setting:
    //antialias is for vr headset, otherwise will have bad edges
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    const container = document.createElement('div');
    container.id = 'scene-container';
    document.body.appendChild(container);
    container.appendChild(this.renderer.domElement);

    //drag page control
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 300;
    this.controls.maxDistance = 900;
    this.controls.keys = false;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    this.stats = new Stats();
    container.appendChild(this.stats.dom);

    //control part
    this.raycaster = new THREE.Raycaster();
    this.raycasterHead = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    //input part
    this.inputBox = document.getElementById('dynamic-textarea');
    this.submitButton = document.getElementById('submit-button');
    this.userInput = '';

    //** raycaster array
    //TODO: this will be used for clicking
    this.isMouseDown = false;
    this.selectedButton = null;
    this.pressStartPos;

    //TODO: this will be main input
    this._addEventListeners();

    this.isResizing = false;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.stopResizing = this.stopResizing.bind(this);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    //resize function
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  //*-----------------------------------------------------------------------*/
  //*--------------------------main render loop----------------------------*/

  render() {
    this.stats.update();
    const dt = this.clock.getDelta();
    this.updateResizeHandlePosition();
    this.updateButtonPress();

    if (
      this.DynamicScriptLoaded &&
      typeof window.dynamicScript === 'function'
    ) {
      window.dynamicScript(this.InFORM, this.clock);

      if (this.isMQTTConnected) this.sendToShapeDisplay();
    }

    this.animatePins(dt);
    this.renderer.render(this.scene, this.camera);
  }

  //* lerp the pin position and monitor pin color machinism
  animatePins(deltaTime) {
    // Update each pin movement
    this.InFORM.Pins.forEach((pin) => {
      pin.updatePos(deltaTime);
      pin.updateMaterial();
    });
  }

  //*-----------------------------------------------------------------------*/
  //*-----------------------Communication & Loader--------------------------*/

  //* Main Generative part
  connectToPython(inputValue) {
    const submitButton = document.getElementById('submit-button');
    const originalIcon = submitButton.innerHTML;
    const originalColor = submitButton.style.backgroundColor;
    submitButton.innerHTML = '<i class="fas fa-spinner loading-icon"></i>';
    submitButton.style.backgroundColor = 'red';
    //http://localhost:5001/activate'
    fetch('https://shapeitweb-f8723f3919e2.herokuapp.com/generate_script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: inputValue }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data);
        // Process the data received from the server
        let scriptContent = data.content;
        console.log(scriptContent);

        if (scriptContent != '') {
          if (scriptContent.startsWith('`') && scriptContent.endsWith('`')) {
            // Remove the first and last characters (backticks) if they exist
            scriptContent = scriptContent.slice(1, -1);
          }
          //console.log(scriptContent);
          //console.log(inputValue);
          this.loadExternalScript(scriptContent, inputValue);

          submitButton.innerHTML = originalIcon;
          submitButton.style.backgroundColor = originalColor;
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred');
        submitButton.innerHTML = originalIcon;
        submitButton.style.backgroundColor = originalColor;
      });
  }

  //* To Python tune GPT part
  sendToggleStatusToBackend(isEnabled) {
    fetch('https://shapeitweb-f8723f3919e2.herokuapp.com/toggle_follow_up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ followUpEnabled: isEnabled }),
    })
      .then((response) => response.json())
      .then((data) => console.log('Toggle state updated:', data))
      .catch((error) => console.error('Error updating toggle state:', error));
  }

  //* To OF shape display send height data
  sendToShapeDisplay() {
    var msgToSend = this.intArrayToString(this.InFORM.Pins);
    this.mqttClient.publish('toShapeDisplay.data', msgToSend);
  }

  //** Main script loader
  loadExternalScript(src, input) {
    // Call cleanup before loading new script
    this.cleanupBeforeNewScript();

    // Remove the existing script if it exists
    this.DynamicScriptLoaded = false;
    const oldScript = document.getElementById('dynamic-script');
    if (oldScript) {
      document.head.removeChild(oldScript);
    }
    // Rest the button state? Maybe need to reset height????
    this.InFORM.Pins.forEach((pin) => {
      pin.resetFlags();
    });

    // Create a new script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = src; // Set the text of the script to the received content
    script.id = 'dynamic-script';

    const isDuplicate = this.scriptHistory.some(
      (entry) => entry.input === input && entry.src === src
    );
    if (!isDuplicate) {
      this.scriptHistory.push({ input, src });
      this.updateHistoryUI(this.scriptHistory[this.scriptHistory.length - 1]);
    }

    document.head.appendChild(script);
    script.onload = this.fetchAndCreateSliders();
    console.log('New Script Load Successfully!');
    this.DynamicScriptLoaded = true;
  }
  //** History loader
  revertToScript(index) {
    const selectedEntry = this.scriptHistory[index];
    if (selectedEntry) {
      this.loadExternalScript(selectedEntry.src, selectedEntry.input);
    }
  }
  //** ThreeJS font loader
  loadFont(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.FontLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  //*-----------------------------------------------------------------------*/
  //*--------------------------Event handlers-------------------------------*/

  //* Button interaction handler
  updateButtonPress() {
    if (this.selectedButton) {
      if (this.isMouseDown) {
        this.pressStartPos -= 5;
        this.selectedButton.setPos(this.pressStartPos);
        //not sure if this selected Button value will sync with the button defined in dynamicScript

        //if ... do something
      } else {
        //bouncing back the button
        console.log(this.selectedButton.getMesh().position.y);
        if (Math.abs(this.selectedButton.getMesh().position.y - 100) < 0.5) {
          this.selectedButton.getMesh().position.y = 100;
          this.selectedButton = null;
        } else {
          this.selectedButton.setPos(100);
        }
      }
    }
  }
  //** Event linsteners
  _addEventListeners() {
    //* input part
    let initialHeight = this.inputBox.clientHeight;
    // user inputbox......
    this.inputBox.addEventListener('input', (event) => {
      this.inputBox.style.height = 'auto';
      let newHeight = this.inputBox.scrollHeight;
      this.inputBox.style.height = newHeight + 'px';

      // Adjust the position to make it expand upwards
      let heightDifference = newHeight - initialHeight;
      this.inputBox.style.bottom = heightDifference + 'px';

      this.userInput = event.target.value;
    });

    // user hit "return" to submit
    this.inputBox.addEventListener('keypress', (event) => {
      if (event.keyCode === 13 || event.which === 13) {
        event.preventDefault();
        this.submitButton.click();
      }
    });

    // user submit prompts
    this.submitButton.addEventListener('click', () => {
      const inputValue = this.userInput;
      if (inputValue !== '') {
        console.log(inputValue);
        //connect to Flusk backen
        this.connectToPython(inputValue);
        // Reset form and other UI elements as needed
        this.inputBox.value = '';
        this.userInput = '';
      }
    });

    //* pin button press
    document.addEventListener(
      'mousedown',
      (event) => {
        //raycaster for hiting the pins
        this.mouse.set(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(
          this.InFORM.PinMeshes
        );

        if (intersects.length > 0) {
          const pinInstance = intersects[0].object.userData.pinInstance;

          if (pinInstance && pinInstance.isButton) {
            console.log('hit');
            this.selectedButton = pinInstance;
            this.pressStartPos = this.selectedButton.getMesh().position.y;
            this.selectedButton.isPressing = true;
            this.isMouseDown = true;
          }
        }
      },
      false
    );
    //* pin button release
    document.addEventListener(
      'mouseup',
      () => {
        if (this.selectedButton != null && this.selectedButton.isPressing) {
          this.selectedButton.isPressing = false;
          this.isMouseDown = false;
        }
      },
      false
    );

    //* Toggles
    // display Pin ID
    document
      .getElementById('idVisibility')
      .addEventListener('change', (event) => {
        const isVisible = event.target.checked;

        // Assuming you have an array of pin objects
        this.InFORM.Pins.forEach((pin) => {
          if (pin.id_text) {
            // Check if the pin has a sprite
            pin.id_text.visible = isVisible;
          }
        });
      });

    // enable follow ups
    document
      .getElementById('followupToggle')
      .addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        this.sendToggleStatusToBackend(isChecked);
      });
    // connect to MQTT
    document
      .getElementById('mqttConnectCheckbox')
      .addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        if (isChecked) {
          this.initializeMQTT();
        } else {
          if (this.mqttClient) {
            this.mqttClient.end();
          }
        }
      });
    // resize the history window
    document
      .getElementById('resizeHandle')
      .addEventListener('mousedown', (e) => {
        this.isResizing = true;
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.stopResizing);
      });
  }

  //** Resizing history window linsteners
  updateResizeHandlePosition() {
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('resizeHandle');

    // Calculate the new vertical center of the sidebar
    const sidebarRect = sidebar.getBoundingClientRect();
    const centerY = sidebarRect.top + window.scrollY + sidebarRect.height / 2;

    // Adjust the resize handle's top position
    resizeHandle.style.top = centerY + 'px';
    resizeHandle.style.transform = 'translateY(-50%)'; // Center the handle vertically
  }

  handleMouseMove(e) {
    if (!this.isResizing) return;
    let newWidth = window.innerWidth - e.clientX;
    const minWidth = 300; // minimum width in pixels
    const maxWidth = window.innerWidth - 100; // maximum width in pixels
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

    document.getElementById('sidebar').style.width = newWidth + 'px';
    document.getElementById('resizeHandle').style.right = newWidth + 'px';
  }

  stopResizing(e) {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  //*-----------------------------------------------------------------------*/
  //*---------------------------System GUI----------------------------------*/

  //** Dynamically create new UI based on new code
  fetchAndCreateSliders() {
    // Check if the slider container already exists. If sgit pull origin --rebaseo, remove its children.
    let sliderParent = document.getElementById('slider-parent');
    let sliderContainer = document.getElementById('slider-container');

    if (sliderContainer) {
      // Remove all child elements (old sliders) from the container
      while (sliderContainer.firstChild) {
        sliderContainer.removeChild(sliderContainer.firstChild);
      }
    } else {
      // If the container doesn't exist, create it.
      sliderContainer = document.createElement('div');
      sliderContainer.id = 'slider-container';
      sliderContainer.style.position = 'absolute';
      sliderContainer.style.left = '20px';
      sliderContainer.style.top = '50%';
      sliderContainer.style.transform = 'translateY(-50%)';
      sliderContainer.style.zIndex = '1000';

      sliderParent.appendChild(sliderContainer); // Append the new container to the body
    }

    // Assuming `getDynamicScriptParams` returns an object with parameter details
    const params = window.getDynamicScriptParams();

    // Dynamically create sliders based on parameters
    for (const [key, value] of Object.entries(params)) {
      const wrapper = document.createElement('div');

      const label = document.createElement('label');
      label.htmlFor = `${key}Slider`;
      label.innerText = `${key}: `;

      const output = document.createElement('span');
      output.id = `${key}Output`;

      // Ensure that the value is a number
      const numericValue = parseFloat(value);
      if (isNaN(numericValue)) {
        console.error(`The value for ${key} is not a number.`);
        continue; // Skip this iteration and don't create a slider for this parameter
      }
      output.innerText = numericValue.toFixed(2);

      const input = document.createElement('input');
      input.type = 'range';
      input.id = `${key}Slider`;
      input.min = (numericValue * 0.5).toFixed(2);
      input.max = (numericValue * 3).toFixed(2);
      input.value = (input.min + input.max) / 2; // Set the current value as half
      input.step = '0.01';

      // Event listener for slider input
      input.addEventListener('input', (e) => {
        const newValue = parseFloat(e.target.value);
        output.innerText = newValue.toFixed(2);
        // Update the dynamic script parameters
        window.setDynamicScriptParams({ [key]: newValue });
      });

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      wrapper.appendChild(output);
      sliderContainer.appendChild(wrapper);
    }

    document.body.appendChild(sliderContainer);
  }
  //** History window
  updateHistoryUI(history) {
    const sidebar = document.getElementById('sidebar');
    const historyDiv = document.createElement('div');
    historyDiv.classList.add('messageCard');

    const topDiv = document.createElement('div');
    topDiv.classList.add('messageTop');

    //add collapse/expand button
    const expandBtn = document.createElement('div');
    expandBtn.classList.add('expandButton');
    expandBtn.textContent = '▼'; // or use an icon
    topDiv.appendChild(expandBtn);

    //input as card name
    const inputDiv = document.createElement('div');
    inputDiv.textContent = 'You: ' + '"' + history.input + '"';
    inputDiv.classList.add('messageInput');
    topDiv.appendChild(inputDiv);

    // Hover events for inputDiv
    const popup = document.createElement('span');
    popup.textContent = 'Revert to this version';
    popup.classList.add('popup');
    topDiv.appendChild(popup);

    historyDiv.appendChild(topDiv);

    inputDiv.addEventListener('mouseover', () => {
      popup.style.display = 'inline';
    });

    inputDiv.addEventListener('mouseout', () => {
      popup.style.display = 'none';
    });

    // Format src as a code block
    const srcDiv = document.createElement('div');
    srcDiv.classList.add('collapseContent');
    const codeBlock = this.formatCodeBlock(history.src); // Assuming JavaScript code
    srcDiv.appendChild(codeBlock);
    historyDiv.appendChild(srcDiv);

    // Apply syntax highlighting
    hljs.highlightElement(codeBlock.firstChild);

    expandBtn.addEventListener('click', () => {
      const isCollapsed = srcDiv.style.maxHeight === '';
      srcDiv.style.maxHeight = isCollapsed ? srcDiv.scrollHeight + 'px' : '';
      expandBtn.textContent = isCollapsed ? '▲' : '▼';
    });
    historyDiv.appendChild(expandBtn);

    // Add click event listener
    const historyIndex = this.scriptHistory.length - 1;

    inputDiv.addEventListener('click', () => {
      this.revertToScript(historyIndex);
    });

    sidebar.appendChild(historyDiv);
    sidebar.style.display = sidebar.children.length > 0 ? 'block' : 'none';
    document.getElementById('resizeHandle').style.display =
      sidebar.style.display;
    sidebar.scrollTop = sidebar.scrollHeight;
  }

  //*-----------------------------------------------------------------------*/
  //*------------------------Helper functions-------------------------------*/

  //** --- Helper functions to construct transmission data  --- **/
  //convey to shape display range from 0-100(10 cm range) to 0-255? or 57-244
  mapValue(value, fromLow, fromHigh, toLow, toHigh) {
    let mappedValue =
      ((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow) + toLow;
    return Math.round(mappedValue);
  }
  intArrayToString(pinArray) {
    let strMsg = '';
    //TODO： figure out the height offset of OF side
    strMsg = pinArray
      .map((pin) => this.mapValue(pin.getPos(), 0, 100, 0, 255))
      .join(' ');

    return strMsg;
  }

  //** --- Helper functions to form code block in web  --- **/
  formatCodeBlock(codeString) {
    // Create a code element
    const codeBlock = document.createElement('code');
    codeBlock.className = 'language-javascript';
    codeBlock.textContent = this.normalizeIndentation(codeString);

    // Wrap the code element in a pre element
    const preBlock = document.createElement('pre');
    preBlock.appendChild(codeBlock);

    return preBlock;
  }

  normalizeIndentation(codeString) {
    const lines = codeString.split('\n');
    // Find the smallest indentation
    const minIndent = lines
      .filter((line) => line.trim().length > 0)
      .reduce((min, line) => Math.min(min, line.search(/\S|$/)), Infinity);
    // Normalize each line's indentation
    const normalizedLines = lines.map((line) => line.substring(minIndent));
    return normalizedLines.join('\n');
  }
  //** --- Helper functions to reset  --- **/
  cleanupBeforeNewScript() {
    // Safely remove the old params object
    if (window.dynamicScriptParams) {
      delete window.dynamicScriptParams;
    }
  }
}

export { App };
