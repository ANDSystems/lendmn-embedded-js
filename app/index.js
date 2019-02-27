(function(window) {
  var eventListeners = {};

  lib = {
    isEmbedded: false
  };

  function bridgeFunction(action, params = null) {
    window.postMessage(JSON.stringify({action, params}));
  }

  function isEmbedded() {
    bridgeFunction("isEmbedded");
  }

  lib.button = ({
    container = "and-ds",
    invoiceNumber,
    qr_string,
    qr_link,
    amount,
    description,
    callback
  }) => {

    require("./../public/style.css");
    console.log("lib", lib);

    var element = document.createElement("div");
    var text = document.createTextNode("Төлөх");

    element.classList.add("button-and-ds");
    element.appendChild(text);

    element.addEventListener("click", function() {
      if (lib.isEmbedded) {
        lib.payInvoice({
          invoiceNumber,
          amount,
          description
        }, callback)
      } else {
        window.location = qr_link;
      }
    });

    var parent = document.getElementById(container);
    if (parent === null) document.getElementById("body").appendChild(element);
    else parent.appendChild(element);
  };

  lib.setEmbedded = () => {
    lib.isEmbedded = true;
  };

  lib.unsetEmbedded = () => {
    lib.isEmbedded = false;
  };

  lib.dispatchEvent = event => {
    let hook = event.hook;
    let data = event.data;

    if (
      eventListeners.hasOwnProperty(hook) &&
      Array.isArray(eventListeners[hook])
    ) {
      for(let i = 0; i<eventListeners[hook].length; i++) {
        eventListeners[hook][i](data);
      }
    }
  };

  lib.addEventListener = (hook, callback) => {
    if(!lib.isEmbedded) {
      return false; //embedded үйлдэл байхгүй
    }
    let eventListener = null;
    if (
      eventListeners.hasOwnProperty(hook) &&
      Array.isArray(eventListeners[hook])
    ) {
      //хэрвээ тухайн hook байгаад тэр нь array байвал
      //тус array-г eventListener хувьсагчид хийж
      eventListener = eventListeners[hook];

      //callback бүртгэлтэй байвал шууд тус callback-ыг буцаа
      if (eventListeners[hook].indexOf(callback) > -1) {
        return callback;
      }
    } else {
      //event бүртгэгдээгүй эсвэл бүртгэгдсэн event listener нь array биш бол
      eventListener = [];
      eventListeners[hook] = eventListener;
    }

    eventListener.push(callback);
    return callback;
  };

  lib.removeEventListener = (hook, callback) => {
    if(!lib.isEmbedded) {
      return false; //embedded үйлдэл байхгүй
    }
    let index = 0;
    if (
      eventListeners.hasOwnProperty(hook) &&
      Array.isArray(eventListeners[hook]) &&
      (index = eventListeners[hook].indexOf(callback)) > -1
    ) {
      eventListeners[hook].splice(index, 1);
    }
    console.log(eventListeners[hook]);
    return true;
  };

  lib.getUri = (dummy, callback) => {
    if(!lib.isEmbedded) {
      return false; //embedded үйлдэл байхгүй
    }
    let actualCallback = (data) => {
      lib.removeEventListener('ongeturi', actualCallback);
      callback(data);
    }
    let anchor = lib.addEventListener('ongeturi', actualCallback);
    bridgeFunction('getUri', dummy);
    return true;
  }

  lib.payInvoice = (params, callback) => {
    if(!lib.isEmbedded) {
      return false; //embedded үйлдэл байхгүй
    }

    let actualCallback = (data) => {
      lib.removeEventListener('payInvoiceComplete', actualCallback);
      callback(data);
    }
    lib.addEventListener('payInvoiceComplete', actualCallback);
    bridgeFunction('payInvoice', params);
    return true;
  }

  window.ANDDS = lib;
  window.ANDembedded = lib;
})(window);
