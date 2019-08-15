(function(window) {
  var eventListeners = {};

  lib = {
    isEmbedded: false
  };

  function bridgeFunction(action, params = null) {
    if(!!window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({action, params}));
      return;
    }
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

    var element = document.createElement("div");
    var text = document.createTextNode("Төлөх");

    element.classList.add("button-and-ds");
    element.appendChild(text);
    lib.appendPayInvoiceAction({
      element,
      invoiceNumber,
      amount,
      description,
      callback
    });

    var parent = document.getElementById(container);
    if (parent === null) document.getElementById("body").appendChild(element);
    else parent.appendChild(element);
  };

  lib.appendPayInvoiceAction = ({
    element,
    invoiceNumber,
    amount,
    description,
    callback
  }) => {
    let qr_link = `andpay://lend.mn/i/m/${invoiceNumber}`;

    element.addEventListener("click", function() {
      if (lib.isEmbedded) {
        lib.payInvoice(
          {
            invoiceNumber,
            amount,
            description
          },
          callback
        );
      } else {
        window.location = qr_link;
      }
    });
  };

  lib.setEmbedded = () => {
    lib.isEmbedded = true;
    lib.dispatchEvent({hook: 'setEmbeddedFinished', data: null});
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
      for (let i = 0; i < eventListeners[hook].length; i++) {
        eventListeners[hook][i](data);
      }
    }
  };

  lib.addEventListener = (hook, callback) => {
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
    let index = 0;
    if (
      eventListeners.hasOwnProperty(hook) &&
      Array.isArray(eventListeners[hook]) &&
      (index = eventListeners[hook].indexOf(callback)) > -1
    ) {
      eventListeners[hook].splice(index, 1);
    }
    return true;
  };

  lib.removeAllEventListeners = hook => {
    if (
      eventListeners.hasOwnProperty(hook) &&
      Array.isArray(eventListeners[hook])
    ) {
      eventListeners[hook] = [];
      return true;
    }
    return false;
  };

  lib.getUri = (dummy, callback) => {
    if (!lib.isEmbedded) {
      callback({error: 10, error_message: "Not embedded"});
      return false; //embedded үйлдэл байхгүй
    }
    let actualCallback = data => {
      lib.removeEventListener("ongeturi", actualCallback);
      callback(data);
    };
    let anchor = lib.addEventListener("ongeturi", actualCallback);
    bridgeFunction("getUri", dummy);
    return true;
  };

  lib.payInvoice = (params, callback, force = false) => {
    if (!lib.isEmbedded && !force) {
      callback({error: 10, error_message: "Not embedded"});
      return false; //embedded үйлдэл байхгүй
    }

    let actualCallback = data => {
      lib.removeEventListener("payInvoiceComplete", actualCallback);
      callback(data);
    };
    lib.addEventListener("payInvoiceComplete", actualCallback);
    bridgeFunction("payInvoice", params);
    return true;
  };

  lib.readQr = callback => {
    if (!lib.isEmbedded) {
      callback({error: 10, error_message: "Not embedded"});
      return false;
    }

    let actualCallback = data => {
      lib.removeEventListener("onQrComplete", actualCallback);
      callback(data);
    };
    lib.addEventListener("onQrComplete", actualCallback);
    bridgeFunction("qr");
    return true;
  };

  lib.closeQrReader = () => {
    if (!lib.isEmbedded) {
      return false;
    }
    bridgeFunction("closeQrReader");
    lib.removeAllEventListeners('onQrComplete');
    return true;
  };

  lib.openUri = (uri, callback) => {
    if (!lib.isEmbedded) {
      callback({error: 10, error_message: "Not embedded"});
      return false;
    }

    let actualCallback = data => {
      lib.removeEventListener("openUriComplete", actualCallback);
      callback(data);
    };
    lib.addEventListener("openUriComplete", actualCallback);
    bridgeFunction("openUri", uri);
    return true;
  };

  lib.share = (params, callback) => {
    if (!lib.isEmbedded) {
      callback({error: 10, error_message: "Not embedded"});
      return false;
    }

    let actualCallback = data => {
      lib.removeEventListener("shareComplete", actualCallback);
      callback(data);
    };
    lib.addEventListener("shareComplete", actualCallback);
    bridgeFunction("share", params);
    return true;
  };

  window.ANDDS = lib;
  window.ANDembedded = lib;
})(window);
