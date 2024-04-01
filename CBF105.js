//JWT Functions
const base64url = (source) => {
  // Encodes in base64 and converts to base64url by replacing '+' with '-', '/' with '_', and removing '='
  return source.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const signJWT = (data, secretKey) => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = base64url(btoa(JSON.stringify(header)));

  const encodedPayload = base64url(btoa(JSON.stringify(data)));

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signature = CryptoJS.HmacSHA256(unsignedToken, secretKey);

  const signatureBase64 = CryptoJS.enc.Base64.stringify(signature);

  const encodedSignature = base64url(signatureBase64);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

function setValue(selector, value) {
  if (value) {
    if (selector === '.vsc-initialized') {
      console.log("In hereeeeee for .vsc selector");
      setTimeout(function() {
        checkIframeAndSetValue(value);
      }, 500);
    }
  }
}

function checkIframeAndSetValue(value) {
  const retryDelay = 1000; // 1000 milliseconds = 1 second
  const maxRetries = 10; // Maximum number of retries

  function attemptRetry(retriesLeft) {
    const iframe = document.querySelector('iframe[src="about:blank"][frameborder="0"]');

    if (iframe) {
      console.log("In hereeeeee found Iframe");
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      const elementInsideIframe = iframeDocument.querySelector('.vsc-initialized');

      if (elementInsideIframe) {
        console.log("In hereeeeee found element");
        elementInsideIframe.innerText = value;

        console.log('Text content set inside the iframe:', value);
      } else {
        console.log('Element with selector ".vsc-initialized" not found inside the iframe.');
      }
    } else {
      console.log('No iframe with src="about:blank" found on the page. Trying again.');

      if (retriesLeft > 0) {
        // Retry after a delay
        setTimeout(function() {
          attemptRetry(retriesLeft - 1);
        }, retryDelay);
      } else {
        console.log('Maximum number of retries reached. Stopping retry attempts.');
      }
    }
  }

  // Start the first retry attempt
  attemptRetry(maxRetries);
}


const encodeHeader = () => {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const jsonHeader = JSON.stringify(header);
  return base64url(jsonHeader);
};

const encodePayload = (data) => {
  console.log("Trying to encode metadata ",data)
  const jsonPayload = JSON.stringify(data);
  return base64url(jsonPayload);
};


const dispatchInputEvents = (input, value) => {
  if (input) {
    // Check if readonly attribute is present
    const isReadonly = input.hasAttribute('readonly');

    // Remove readonly attribute if present
    if (isReadonly) {
      input.removeAttribute('readonly');
    }

    console.log("Value before is ",input.value)
    input.value = value;
    console.log("Value after is ", input.value)

    // Dispatch the custom events
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Add readonly attribute back if it was initially present
    if (isReadonly) {
      input.setAttribute('readonly', 'readonly');
    }

  }
};


//Load srcipt file
function loadScript(url, callback) {
  var script = document.createElement("script");
  script.src = url;
  document.head.appendChild(script);
  script.onload = callback;
 
}  

function waitForElementToLoad(callback, selectors,operations, timeOut) {
  if (operations.hasOwnProperty("click")) {
    var operation = setInterval(checkElementAndClick, timeOut);

    function checkElementAndClick() {
      const selector = operations["click"];
      const element = document.querySelector(selector);
  
      if (element) {
          console.log("Element is loaded. Waiting for 0.5 seconds before clicking on it.");
          setTimeout(function() {
              console.log("Clicking on the element now.");
              element.click();
              clearInterval(operation);
              console.log("In wait function", selectors);
              // If click is there, do the callback after clicking on the element , else do after all elements are loaded
              callback();
          }, 200); 
        }
      }
  }
  else{
      console.log("In wait function", selectors);

      var obj = setInterval(function checkElements() {
        const allElementsLoaded = Object.keys(selectors).every((key) => {
          console.log(selectors[key])
          return document.querySelector(selectors[key]);
        });
    
        if (allElementsLoaded) {
          console.log("All elements are loaded");
          clearInterval(obj);
          callback();
        }
      }, timeOut);
  }
}


function retryFunctionForDispatchInputEvents(attempt, retryLimit,selector,value){
  if(attempt>retryLimit){
    console.log("Retry Limit Reached for Dispatch Events")
    return;
  }
  const element = document.querySelector(selector);
  if (element) {
      console.log("element identified", element);
      dispatchInputEvents(element, value);
  }
  else{
    setTimeout( function() {retryFunctionForDispatchInputEvents(attempt+1,retryLimit,selector,value)}, 500)
  }
}


function putDataInFields(fields, parsedData) {
  console.log("Fields-", fields);
  console.log("ParsedData-", parsedData);

  for (const fieldName in fields) {
    const selector = fields[fieldName];
    const value = parsedData[fieldName];
    console.log("Selector: ", selector, " Value: ", value);

    if (fieldName === 'intent') {
      // Handle the special case for the "intent" field
      const radioGroupSelector = '#enq-type';
      const radioButtons = document.querySelectorAll(`${radioGroupSelector} input`);
      
      radioButtons.forEach((radioButton) => {
        if(value ){
          if (radioButton.value.toLowerCase() === value.toLowerCase()) {
            radioButton.click(); 
          }
        }
        
      });
    }
    else {
      if (value) {
          retry = 5;
          console.log("Value identified", value);
          retryFunctionForDispatchInputEvents(0,retry,selector,value);
        }
        
      }
    }
}




class Fetcher {
  _subscriptions = []
  _baseUrl = "http://127.0.0.1:8000"
  _dataIdParam = "data_id"
  _ownerIdParam = "owner_id"
  _apiKey = ""


  initialize(config) {
    this._baseUrl = config.baseUrl;
    if (config.dataIdParam)
      this._dataIdParam = config.dataIdParam
    if (config.ownerIdParam)
      this._ownerIdParam = config.ownerIdParam
    if (config.apiKey)
      this._apiKey = config.apiKey

  }
   isNotEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return true;
      }
    }
  
    return false;
  }
  async validateApiKey(apiKey) {
    const response = await fetch(`${this._baseUrl}/authenticate`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "apiKey": apiKey })
  });

  if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  if (data.isValid === true) {
      return true;
  } else {
      return false;
  }
}
  subscribeAndListen(params) {
    if(!this.validateApiKey(this._apiKey)) {
      console.error("Wrong API key!");
      return null;
    }
    
    console.log("Nice API Key")
    const topics = params.topics;
    const callback = params.callback;
    
    const subscriptionId = crypto.randomUUID() 
    this._subscriptions.push({ id: subscriptionId, topics: topics, callback: callback });

    var subscription = { id: subscriptionId, topics: topics, callback: callback }
 
      
      const action = this.getURLParams('action');
      console.log("First if",action)
      
        
     
          if (action) {
            console.log("Inside if",action)
            this.fetchData().then(data => {
              if(this.isNotEmpty(data)){
                //Storing the parsed data in localstorage
                if(data.middleware.operations.storeDataOnClientBrowser){
                  for(var parsedDataKey in data.parsedData){
                    localStorage.setItem(`effiGPT${data.middleware.title}${parsedDataKey}`,data.parsedData[parsedDataKey]);
                  } 
                }
                waitForElementToLoad(function() {
                  console.log(data.middleware.selector)
                  console.log(data.parsedData)

                  
                  //Calling the function to replace data to fields
                  putDataInFields(data.middleware.selector,data.parsedData); 
                  if (typeof subscription.callback === "function") {
                      subscription.callback(data.parsedData);
                  }
              },data.middleware.selector,data.middleware.operations,params.timeOut);

              }
              
            
            
          }).catch(error => {
              console.error("There was an error fetching data:", error.message);
          });
      }
      
     
  
    return subscriptionId;
  }


  
  unsubscribeAll() {
    this._subscriptions = []
  }

  getURLParams(paramName) {
    return new URLSearchParams(window.location.search).get(paramName);
  }

 constructFetchUrl() {
    const data_id = this.getURLParams(this._dataIdParam);
    const owner_id = this.getURLParams(this._ownerIdParam);
    
    if (!data_id || !owner_id) {
      throw new Error("data_id or owner_id is missing in the URL.");
    }

    return `${this._baseUrl}/retrieve/${data_id}?ownerId=${owner_id}`;
  }

  async fetchData() {
    const url = this.constructFetchUrl();
    console.log("Fetch URL IS ",url)
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': this._apiKey
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.data;
  
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error.message);
      throw error;
    }
  }
  

}



class UnifiedModule {
  constructor(chatbotOptions, fetcherOptions, subscriptions) {
      this.chatbotOptions = chatbotOptions;
      this.fieldId = fetcherOptions.fieldId;
      this.timeOut = fetcherOptions.timeOut;
      this.fetcher = new Fetcher();
      this.fetcher.initialize(fetcherOptions);
      this.subscriptions = subscriptions;
  }

  createChatbotIframe() {
    let element = document.getElementById('chatbot-container');
    if (!element) {
      element = document.createElement('div');
      element.id = 'chatbot-container';

      // Create a <style> element and append it to the <head>
      const style = document.createElement('style');
      style.innerHTML = `
        #chatbot-container {
          position: fixed;
          right: -${this.chatbotOptions.defaultWidth}rem; /* Initially position the container off-screen to the right */
          bottom: 5px;
          width: ${this.chatbotOptions.defaultWidth};
          height: ${this.chatbotOptions.defaultHeight};
          border: none;
          padding: 0;
          box-sizing: border-box;
          z-index: 999;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
          transition: right 0.3s ease-in-out; /* Add a transition for the right property */
        }
  
        #chatbot-container.show {
          right: 5px; /* Position the container at its desired location when shown */
        }
      `;
      document.head.appendChild(style);
      const secretKey = "abc0372c1065e9651e4bb79511865942b6701f80509d04ce39ec28b8e4c80466"; 
      let data = {
        metaData: this.chatbotOptions.metaData,
        apiKey: this.chatbotOptions.apiKey
      }
      const jwtToken = signJWT(data, secretKey);
      let chatbotDomain = this.chatbotOptions.domain ;
      console.log(chatbotDomain);
  
      element.innerHTML = `
        <div style="position: relative; height: 100%;">
          <iframe id="${this.chatbotOptions.elementId}" src="${chatbotDomain}" frameborder="0" style="width:${this.chatbotOptions.defaultWidth}; height:${this.chatbotOptions.defaultHeight} ;"></iframe>
        </div>
      `;
      

      document.body.appendChild(element);
      const iframe = element.querySelector('iframe');
      iframe.onload = () => {
          // Ensure you're posting to the correct domain for security
          iframe.contentWindow.postMessage({ token: jwtToken }, chatbotDomain);
      };
      window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'closeChatbot') {
          const chatbotContainer = document.getElementById('chatbot-container');
          if (chatbotContainer) {
            chatbotContainer.style.display = 'none';
          }
        }
      });
    }
  }

  

  loadFontAwesome() {
      const link = document.createElement('link');
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
  }


  handleClickOutside(event) {
      const chatbotContainer = document.getElementById('chatbot-container');
      if (chatbotContainer && !chatbotContainer.contains(event.target) && !event.target.classList.contains('chatbot-toggler')) {
          chatbotContainer.style.display = 'none';
      }
  }

  openChatbotUI(event){
        if (event.target.id === 'effi_ai_chatbot_list_item' || event.target.id === 'effi_ai_chatbot_logo') {
          const chatbotContainer = document.getElementById('chatbot-container');
          if (chatbotContainer) {
            chatbotContainer.classList.toggle('show');
            const computedStyle = window.getComputedStyle(chatbotContainer);
            console.log(computedStyle.display)
            const isCurrentlyHidden = computedStyle.display === 'none';
      
            if (isCurrentlyHidden) {
              chatbotContainer.style.display = 'block';
            } else {
              chatbotContainer.style.display = 'none';
            }
          }
        }
  }

  initChatbotLoader() {
      this.createChatbotIframe();
      document.addEventListener('click', this.handleClickOutside.bind(this));
      document.addEventListener('click',this.openChatbotUI.bind(this));
  }

  handleSubscription(subscription) {
      return this.fetcher.subscribeAndListen({
          topics: subscription.topics,
          callback: subscription.callback,
          fieldId: this.fieldId,
          timeOut:this.timeOut,
          configData: subscription.configData
      });
  }

  initializeSubscriptions() {
      this.subscriptions.forEach(subscription => this.handleSubscription(subscription));
  }

  init() {
   
    loadScript("https://cdn.jsdelivr.net/npm/crypto-js@3.1.9-1/crypto-js.js", () => {
        this.initChatbotLoader();
        this.initializeSubscriptions();
  })
  }
}