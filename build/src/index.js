// node_modules/base-class-ts/BaseClass.js
class BaseClass {
  showClass = "display";
  hideClass = "noDisplay";
  requestsInProgress = 0;
  controllers = new Map;
  requestIcon = document.getElementById("requestIcon");
  dialog = document.getElementById("dialog");
  dialogTitle = document.getElementById("dialogTitle");
  dialogMessage = document.getElementById("dialogMessage");
  versionLabel = document.getElementById("versionLabel");
  dialogCallback;
  static PAGE_LOADED = "DOMContentLoaded";
  constructor() {
  }
  static startWhenReady(ClassReference, startWith) {
    window.addEventListener(BaseClass.PAGE_LOADED, (event) => {
      try {
        var instance = new ClassReference;
        if (startWith) {
          instance[startWith]();
        }
      } catch (error) {
        console.error(error);
      }
    });
  }
  async contentLoaded() {
    this.bindProperties(BaseClass);
  }
  checkQuery() {
    var url = new URL(window.location.href);
    var parameters = url.searchParams;
  }
  async getURL(url, options = null, json = true) {
    if (options == null) {
      options = {};
    }
    options.method = "get";
    return await this.requestURL(url, options, json);
  }
  async postURL(url, form, options = null, json = true) {
    if (options == null) {
      options = {};
    }
    if (form && options.body == null) {
      options.body = form;
    }
    options.method = "post";
    return await this.requestURL(url, options, json);
  }
  async requestURL(url, options = null, json = true) {
    var response = null;
    try {
      this.showRequestIcon();
      await this.sleep(10);
      const controller = new AbortController;
      const signal = controller.signal;
      if (options == null) {
        options = {};
      }
      if (options.signal == null) {
        options.signal = signal;
      }
      var requestId = this.requestsInProgress++;
      this.controllers.set(requestId, controller);
      response = await fetch(url, options);
      var text = await response.text();
      this.controllers.delete(requestId);
      this.requestsInProgress--;
      if (this.controllers.size == 0) {
        this.showRequestIcon(false);
      }
      if (json) {
        try {
          var data = JSON.parse(text);
        } catch (error) {
          this.log(error);
          return text;
        }
        return data;
      }
      return response;
    } catch (error) {
      this.requestsInProgress--;
      if (response && this.controllers && this.controllers.has(this.requestsInProgress + 1)) {
        this.controllers.delete(this.requestsInProgress + 1);
      }
      return error;
    }
  }
  setupEventListeners() {
  }
  postMessageHandler(event) {
    if (event.origin !== "https://")
      return;
    var data = event.data;
    if (data == "postMessage") {
      console.log("postMessage");
    }
  }
  cancelRequests() {
    if (this.controllers) {
      this.controllers.forEach((value, key, map) => {
        value.abort();
      });
    }
  }
  sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
  showDialog(title, value, callback = null) {
    if (this.dialog) {
      this.setContent(this.dialogTitle, title);
      this.setContent(this.dialogMessage, value);
      this.addClass(this.dialog, "display");
      this.addClass(this.dialog, "center");
      this.dialog.showModal();
      this.dialogCallback = callback;
    }
  }
  closeDialogClickHandler() {
    this.closeDialog();
  }
  closeDialog() {
    if (this.dialog) {
      this.removeClass(this.dialog, "display");
      this.dialog.close();
    }
    if (this.dialogCallback) {
      this.dialogCallback();
    }
  }
  addClass(element, name) {
    if (element instanceof HTMLElement) {
      element = [element];
    }
    if (element instanceof Array) {
      for (let i = 0;i < element.length; i++) {
        const el = element[i];
        el.classList.add(name);
      }
    }
  }
  removeClass(element, name) {
    if (element instanceof HTMLElement) {
      element = [element];
    }
    for (let i = 0;i < element.length; i++) {
      const el = element[i];
      el.classList.remove(name);
    }
  }
  showRequestIcon(display = true) {
    if (this.requestIcon) {
      if (display) {
        this.revealElement(this.requestIcon, true);
      } else {
        this.revealElement(this.requestIcon, false);
      }
    }
  }
  revealElement(element, display = true) {
    if (element && "classList" in element) {
      if (display) {
        this.removeClass(element, this.hideClass);
      } else {
        this.addClass(element, this.hideClass);
      }
    }
  }
  hideElement(element) {
    if (element && "classList" in element) {
      this.addClass(element, this.hideClass);
    }
  }
  async getVersion(text = "Version ") {
    try {
      var data = await this.requestURL("version");
      var version = data.version;
      var label = this.versionLabel;
      if (label) {
        this.setContent(label, version);
      }
    } catch (error) {
      console.log(error);
    }
  }
  cancelRequest() {
    try {
      this.cancelRequests();
    } catch (error) {
      this.log(error);
    }
  }
  setStyle(element, property, value, priority, resetValue = null, resetTimeout = 5000) {
    element.style.setProperty(property, value, priority);
    if (resetValue !== null) {
      setTimeout(this.setStyle, resetTimeout, element, resetValue);
    }
  }
  setParent(element, parent) {
    parent.appendChild(element);
  }
  setContent(element, value, tooltip = null, resetValue = null, resetTimeout = 5000) {
    element.textContent = value;
    if (typeof tooltip == "string") {
      element.title = tooltip;
    } else if (tooltip) {
      element.title = value;
    }
    if (resetValue !== null) {
      setTimeout(this.setContent, resetTimeout, element, resetValue);
    }
  }
  addElement(container, element, properties = null, ...children) {
    try {
      if (typeof element == "string") {
        element = this.createElement(element, properties, ...children);
      }
      if (typeof element === "object") {
        container.appendChild(element);
      }
    } catch (error) {
      this.log(error);
    }
  }
  createElement(tagName, properties = null, ...children) {
    try {
      var element = document.createElement(tagName);
      if (properties) {
        if (properties.nodeType || typeof properties !== "object") {
          children.unshift(properties);
        } else {
          for (var property in properties) {
            var value = properties[property];
            if (property == "style") {
              Object.assign(element.style, value);
            } else {
              element.setAttribute(property, value);
              if (property in element) {
                element[property] = value;
              }
            }
          }
        }
      }
      for (var child of children) {
        element.appendChild(typeof child === "object" ? child : document.createTextNode(child));
      }
      return element;
    } catch (error) {
      this.log(error);
    }
    return;
  }
  updateQuery(parameter, value) {
    var url = new URL(window.location.href);
    var searchParameters = url.searchParams;
    searchParameters.set(parameter, value);
    var pathQuery = window.location.pathname + "?" + searchParameters.toString();
    history.pushState(null, "", pathQuery);
  }
  bindProperties(mainClass) {
    var properties = Object.getOwnPropertyNames(mainClass.prototype);
    var that = this;
    for (var key in properties) {
      var property = properties[key];
      if (property !== "constructor") {
        that[property] = that[property].bind(this);
      }
    }
  }
  scrollElementIntoView(element, behavior = "smooth", block = "start", inline = "nearest") {
    element.scrollIntoView({ behavior, block, inline });
  }
  scrollToBottom(element) {
    if (element instanceof HTMLTextAreaElement) {
      element.scrollTop = element.scrollHeight;
    } else {
      element.scrollTop = element.scrollHeight;
    }
  }
  async getDownloadData(url) {
    var binary = await this.getFileBinaryAtURL(url);
    var binaryBuffer = new Blob([binary.buffer]);
    return binaryBuffer;
  }
  getFileBinaryAtURL(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest;
      request.onload = () => {
        if (request.status === 200) {
          try {
            const array = new Uint8Array(request.response);
            resolve(array);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(request.status);
        }
      };
      request.onerror = reject;
      request.onabort = reject;
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.send();
    });
  }
  async upload(url, file, formData) {
    try {
      if (formData == null) {
        formData = new FormData;
      }
      if (file instanceof Blob || file instanceof File) {
        formData.append("file", file);
      } else {
        var files = file;
        for (const file2 of files) {
          formData.append("files", file2);
        }
      }
      try {
        var results = await this.postURL(url, formData);
        return results;
      } catch (error) {
        this.log(error);
        return error;
      }
    } catch (error) {
      this.log(error);
      return error;
    }
  }
  copyToClipboard(value) {
    navigator.clipboard.writeText(value);
  }
  openInWindow(url, target) {
    window.open(url, target);
  }
  async checkFragment() {
    var hash = window.location.hash.replace("#", "").toLowerCase();
    switch (hash) {
      case "case1":
        break;
      case "case2":
        break;
      case "":
        break;
      default:
    }
  }
  createOption(label, value, useListItem = false, icon = null, classes = [], callback) {
    var optionName = useListItem ? "li" : "option";
    var option = document.createElement(optionName);
    option.innerText = label;
    if (icon) {
      var iconElement = document.createElement("img");
      iconElement.src = icon;
      option.innerHTML = iconElement.outerHTML + label;
      for (var className in classes) {
        option.classList.add(classes[className]);
      }
    } else {
      option.innerHTML = label;
    }
    option.label = label;
    option.value = value;
    if (callback) {
      callback(option, label, value);
    }
    return option;
  }
  log(...values) {
    console.log(...values);
  }
}

// src/index.js
class MyClass extends BaseClass {
  constructor() {
    super();
    console.log("Hello world");
  }
}
BaseClass.startWhenReady(MyClass);
export {
  MyClass
};

//# debugId=0E52A6A9B47B679B64756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi5cXG5vZGVfbW9kdWxlc1xcYmFzZS1jbGFzcy10c1xcQmFzZUNsYXNzLmpzIiwgIi4uXFxzcmNcXGluZGV4LmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgImV4cG9ydCBjbGFzcyBCYXNlQ2xhc3Mge1xuICAgIHNob3dDbGFzcyA9IFwiZGlzcGxheVwiO1xuICAgIGhpZGVDbGFzcyA9IFwibm9EaXNwbGF5XCI7XG4gICAgcmVxdWVzdHNJblByb2dyZXNzID0gMDtcbiAgICBjb250cm9sbGVycyA9IG5ldyBNYXAoKTtcbiAgICByZXF1ZXN0SWNvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVxdWVzdEljb25cIik7XG4gICAgZGlhbG9nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaWFsb2dcIik7XG4gICAgZGlhbG9nVGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpYWxvZ1RpdGxlXCIpO1xuICAgIGRpYWxvZ01lc3NhZ2UgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRpYWxvZ01lc3NhZ2VcIik7XG4gICAgdmVyc2lvbkxhYmVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJzaW9uTGFiZWxcIik7XG4gICAgZGlhbG9nQ2FsbGJhY2s7XG4gICAgc3RhdGljIFBBR0VfTE9BREVEID0gXCJET01Db250ZW50TG9hZGVkXCI7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgfVxuICAgIHN0YXRpYyBzdGFydFdoZW5SZWFkeShDbGFzc1JlZmVyZW5jZSwgc3RhcnRXaXRoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKEJhc2VDbGFzcy5QQUdFX0xPQURFRCwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBDbGFzc1JlZmVyZW5jZSgpO1xuICAgICAgICAgICAgICAgIGlmIChzdGFydFdpdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2Vbc3RhcnRXaXRoXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgYW5kIGNhbGwgdGhpcyBtZXRob2QgZm9yIGFzeW5jXG4gICAgICovXG4gICAgYXN5bmMgY29udGVudExvYWRlZCgpIHtcbiAgICAgICAgdGhpcy5iaW5kUHJvcGVydGllcyhCYXNlQ2xhc3MpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGUgcXVlcnlcbiAgICAgKi9cbiAgICBjaGVja1F1ZXJ5KCkge1xuICAgICAgICB2YXIgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gdXJsLnNlYXJjaFBhcmFtcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGVyZm9ybXMgYW4gYXN5bmNocm9ub3VzIGdldCBjYWxsLlxuICAgICAqIFJldHVybnMgdGhlIHVybCBhcyB0ZXh0IG9yIGpzb24uXG4gICAgICogRGVmYXVsdCBpcyBKU09OLlxuICAgICAqIENhbGwgdXNpbmcgYXdhaXQuIENhbmNlbCB1c2luZyBjYW5jZWxSZXF1ZXN0cygpXG4gICAgICpcbiAgICAgKiBJZiBhZGRpbmcgYSBxdWVyeSBzdHJpbmcgYWRkIGl0IHRvIHRoZSB1cmwgbGlrZSBzb1xuICAgICAqIGBgYFxuICAgICAqIHZhciBwYXJhbWV0ZXJzID0gbmV3IFVSTFNlYXJjaFBhcmFtcygpO1xuICAgICAqIHZhciB1cmwgPSBcInVybFwiO1xuICAgICAqIHBhcmFtZXRlcnMuc2V0KFwiaWRcIiwgaWQpO1xuICAgICAqIHZhciByZXN1bHRzID0gYXdhaXQgdGhpcy5yZXF1ZXN0VVJMKHVybCArIFwiP1wiICsgcGFyYW1ldGVycy50b1N0cmluZygpICk7XG4gICAgICogYGBgXG4gICAgICogQHBhcmFtIHVybCB1cmxcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBvcHRpb25zIGZldGNoIG9wdGlvbnMgb2JqZWN0LiBleGFtcGxlLCB7bWV0aG9kOiBcInBvc3RcIiwgYm9keTogZm9ybURhdGEgfVxuICAgICAqIEBwYXJhbSBqc29uIHJldHVybnMgdGhlIHJlc3VsdHMgYXMganNvbi4gZGVmYXVsdCBpcyB0cnVlXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBhc3luYyBnZXRVUkwodXJsLCBvcHRpb25zID0gbnVsbCwganNvbiA9IHRydWUpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIDtcbiAgICAgICAgb3B0aW9ucy5tZXRob2QgPSBcImdldFwiO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXF1ZXN0VVJMKHVybCwgb3B0aW9ucywganNvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIGFuIGFzeW5jaHJvbm91cyBwb3N0IGNhbGwuXG4gICAgICogUmV0dXJucyB0aGUgdXJsIGFzIHRleHQgb3IganNvbi4gRGVmYXVsdCBpcyBKU09OLlxuICAgICAqIENhbGwgdXNpbmcgYGF3YWl0YC5cbiAgICAgKiBQYXNzIHRoZSBmb3JtIGRhdGEgYXMgYSBmb3JtIGRhdGEgb2JqZWN0OlxuICAgICAqIGBgYFxuICAgICAqIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAqIGZvcm1EYXRhLnNldChcImlkXCIsIGlkKTtcbiAgICAgKiB2YXIgcmVzdWx0cyA9IGF3YWl0IHRoaXMucG9zdFVSTChcInVybFwiLCBmb3JtRGF0YSk7XG4gICAgICogYGBgXG4gICAgICogQ2FuY2VsIHVzaW5nIGNhbmNlbFJlcXVlc3RzKClcbiAgICAgKiBAcGFyYW0gdXJsIHVybFxuICAgICAqIEBwYXJhbSBvcHRpb25zIG9wdGlvbnMgZmV0Y2ggb3B0aW9ucyBvYmplY3QuIGV4YW1wbGUsIHttZXRob2Q6IFwicG9zdFwiLCBib2R5OiBmb3JtRGF0YSB9XG4gICAgICogQHBhcmFtIGpzb24gcmV0dXJucyB0aGUgcmVzdWx0cyBhcyBwYXJzZWQgb2JqZWN0IGZyb20ganNvbiBzdHJpbmdcbiAgICAgKiBAcmV0dXJucyB0ZXh0LCBwYXJzZWQganNvbiBvYmplY3Qgb3IgYSBUeXBlRXJyb3IgaWYgbmV0d29yayBpcyB1bmF2YWlsYWJsZS5cbiAgICAgKi9cbiAgICBhc3luYyBwb3N0VVJMKHVybCwgZm9ybSwgb3B0aW9ucyA9IG51bGwsIGpzb24gPSB0cnVlKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZm9ybSAmJiBvcHRpb25zLmJvZHkgPT0gbnVsbCkge1xuICAgICAgICAgICAgb3B0aW9ucy5ib2R5ID0gZm9ybTtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb25zLm1ldGhvZCA9IFwicG9zdFwiO1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5yZXF1ZXN0VVJMKHVybCwgb3B0aW9ucywganNvbik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2VzIGEgcmVxdWVzdCB0byBhIHVybC5cbiAgICAgKiBSZXR1cm5zIHRoZSB1cmwgYXMgdGV4dCBvciBqc29uLlxuICAgICAqIERlZmF1bHQgaXMgSlNPTi5cbiAgICAgKiBDYWxsIHVzaW5nIGF3YWl0LiBDYW5jZWwgdXNpbmcgY2FuY2VsUmVxdWVzdHMoKVxuICAgICAqXG4gICAgICogSWYgY3JlYXRpbmcgYSBwb3N0IHBhc3MgdGhlIGZvcm0gZGF0YSBhcyB0aGUgYm9keSBvZiB0aGUgb3B0aW9uc1xuICAgICAqIGBgYFxuICAgICAqIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAqIGZvcm1EYXRhLnNldChcImlkXCIsIGlkKTtcbiAgICAgKiB2YXIgZGF0YSA9IGF3YWl0IHRoaXMucmVxdWVzdFVSTChcInVybFwiLCB7bWV0aG9kOiBcInBvc3RcIiwgYm9keTogZm9ybURhdGF9KTtcbiAgICAgKiBgYGBcbiAgICAgKiBJZiBjcmVhdGluZyBhIGdldCBwYXNzIHRoZSBmb3JtIGRhdGEgYXMgdGhlIGJvZHkgb2YgdGhlIG9wdGlvbnNcbiAgICAgKiBgYGBcbiAgICAgKiB2YXIgcGFyYW1ldGVycyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoKTtcbiAgICAgKiBwYXJhbWV0ZXJzLnNldChcImlkXCIsIGlkKTtcbiAgICAgKiB2YXIgcmVzdWx0cyA9IGF3YWl0IHRoaXMucmVxdWVzdFVSTChcInVybD9cIiArIHBhcmFtZXRlcnMudG9TdHJpbmcoKSApO1xuICAgICAqIGBgYFxuICAgICAqIEBwYXJhbSB1cmwgdXJsXG4gICAgICogQHBhcmFtIG9wdGlvbnMgb3B0aW9ucyBmZXRjaCBvcHRpb25zIG9iamVjdC4gZXhhbXBsZSwge21ldGhvZDogXCJwb3N0XCIsIGJvZHk6IGZvcm1EYXRhIH1cbiAgICAgKiBAcGFyYW0ganNvbiByZXR1cm5zIHRoZSByZXN1bHRzIGFzIGpzb24uIGRlZmF1bHQgaXMgdHJ1ZVxuICAgICAqIEByZXR1cm5zIHRleHQsIHBhcnNlZCBqc29uIG9iamVjdCBvciBhIFR5cGVFcnJvciBpZiBuZXR3b3JrIGlzIHVuYXZhaWxhYmxlLlxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVlc3RVUkwodXJsLCBvcHRpb25zID0gbnVsbCwganNvbiA9IHRydWUpIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuc2hvd1JlcXVlc3RJY29uKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnNsZWVwKDEwKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgICAgICAgICBjb25zdCBzaWduYWwgPSBjb250cm9sbGVyLnNpZ25hbDtcbiAgICAgICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zaWduYWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuc2lnbmFsID0gc2lnbmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgdmFyIHJlcXVlc3RJZCA9IHRoaXMucmVxdWVzdHNJblByb2dyZXNzKys7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXJzLnNldChyZXF1ZXN0SWQsIGNvbnRyb2xsZXIpO1xuICAgICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xsZXJzLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0c0luUHJvZ3Jlc3MtLTtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRyb2xsZXJzLnNpemUgPT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1JlcXVlc3RJY29uKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqc29uKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKHRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2coZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RzSW5Qcm9ncmVzcy0tO1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlICYmIHRoaXMuY29udHJvbGxlcnMgJiYgdGhpcy5jb250cm9sbGVycy5oYXModGhpcy5yZXF1ZXN0c0luUHJvZ3Jlc3MgKyAxKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udHJvbGxlcnMuZGVsZXRlKHRoaXMucmVxdWVzdHNJblByb2dyZXNzICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQXR0YWNoIGV2ZW50IGxpc3RlbmVycyBoZXJlXG4gICAgICogT3ZlcnJpZGUgaW4gc3ViIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzZXR1cEV2ZW50TGlzdGVuZXJzKCkge1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBIYW5kbGVyIGZvciByZWNlaXZpbmcgYSBtZXNzYWdlIGZyb20gYW4gZW1iZWRkZWQgaWZyYW1lXG4gICAgICogT3ZlcnJpZGUgaW4geW91ciBzdWIgY2xhc3NcbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcmV0dXJuc1xuICAgICAqL1xuICAgIHBvc3RNZXNzYWdlSGFuZGxlcihldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQub3JpZ2luICE9PSBcImh0dHBzOi8vXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgPT0gXCJwb3N0TWVzc2FnZVwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBvc3RNZXNzYWdlXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbmNlbCBhbnkgcmVxdWVzdHNcbiAgICAgKi9cbiAgICBjYW5jZWxSZXF1ZXN0cygpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udHJvbGxlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuY29udHJvbGxlcnMuZm9yRWFjaCgodmFsdWUsIGtleSwgbWFwKSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuYWJvcnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdhaXQgYSBzcGVjaWZpYyBhbW91bnQgb2YgdGltZSBpbiBtaWxsaXNlY29uZHMgYmVmb3JlIHByb2NlZWRpbmcgdG8gdGhlIG5leHQgbGluZSBvZiBjb2RlXG4gICAgICogTXVzdCB1c2UgYXdhaXQgaW4gZnJvbnQgb2YgdGhpcyBjYWxsXG4gICAgICogQHBhcmFtIG1zXG4gICAgICogQHJldHVybnNcbiAgICAgKi9cbiAgICBzbGVlcChtaWxsaXNlY29uZHMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtaWxsaXNlY29uZHMpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2hvdyBhIGRpYWxvZy5cbiAgICAgKiBEaWFsb2cgbXVzdCBiZSBhbiBlbGVtZW50IGRlZmluZWQgdG8gdGhlIGRpYWxvZyBwcm9wZXJ0eVxuICAgICAqIEJ5IGRlZmF1bHQgdGhlIGRpYWxvZyBoYXMgYW4gaWQgb2YgZGlhbG9nIGFuZCBpcyBhbiBIVE1MRGlhbG9nRWxlbWVudCBvbiB0aGUgcGFnZVxuICAgICAqIEBwYXJhbSB0aXRsZSBUaXRsZSBpbiBkaWFsb2dcbiAgICAgKiBAcGFyYW0gdmFsdWUgdGV4dCB0byBzaG93IGluIGRpYWxvZ1xuICAgICAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayBhZnRlciB1c2VyIGNsaWNrcyBvayBvciBleGl0cyBmcm9tIGRpYWxvZ1xuICAgICAqL1xuICAgIHNob3dEaWFsb2codGl0bGUsIHZhbHVlLCBjYWxsYmFjayA9IG51bGwpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlhbG9nKSB7XG4gICAgICAgICAgICB0aGlzLnNldENvbnRlbnQodGhpcy5kaWFsb2dUaXRsZSwgdGl0bGUpO1xuICAgICAgICAgICAgdGhpcy5zZXRDb250ZW50KHRoaXMuZGlhbG9nTWVzc2FnZSwgdmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmRpYWxvZywgXCJkaXNwbGF5XCIpO1xuICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyh0aGlzLmRpYWxvZywgXCJjZW50ZXJcIik7XG4gICAgICAgICAgICB0aGlzLmRpYWxvZy5zaG93TW9kYWwoKTtcbiAgICAgICAgICAgIHRoaXMuZGlhbG9nQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZSBkaWFsb2cgZXZlbnQgaGFuZGxlclxuICAgICAqL1xuICAgIGNsb3NlRGlhbG9nQ2xpY2tIYW5kbGVyKCkge1xuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NzIGRpYWxvZyBpZiBkaWFsb2cgaXMgb3Blbi4gQ2FsbHMgZGlhbG9nIGNhbGxiYWNrIGlmIGRlZmluZWRcbiAgICAgKi9cbiAgICBjbG9zZURpYWxvZygpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlhbG9nKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUNsYXNzKHRoaXMuZGlhbG9nLCBcImRpc3BsYXlcIik7XG4gICAgICAgICAgICB0aGlzLmRpYWxvZy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmRpYWxvZ0NhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmRpYWxvZ0NhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkIGEgY2xhc3MgdG8gYW4gZWxlbWVudCBvciBhbiBhcnJheSBvZiBlbGVtZW50c1xuICAgICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgb3IgZWxlbWVudHMgdG8gYWRkIGEgY2xhc3MgdG9cbiAgICAgKiBAcGFyYW0gbmFtZSBuYW1lIG9mIGNsYXNzXG4gICAgICovXG4gICAgYWRkQ2xhc3MoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gW2VsZW1lbnRdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFtpXTtcbiAgICAgICAgICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGNsYXNzIGZyb20gYW4gZWxlbWVudCBvciBhbiBhcnJheSBvZiBlbGVtZW50c1xuICAgICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnQgb3IgYXJyYXkgb2YgZWxlbWVudHMgdG8gcmVtb3ZlIGEgY2xhc3MgZnJvbVxuICAgICAqIEBwYXJhbSBuYW1lIG5hbWUgb2YgY2xhc3MgdG8gcmVtb3ZlXG4gICAgICovXG4gICAgcmVtb3ZlQ2xhc3MoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gW2VsZW1lbnRdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWxlbWVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50W2ldO1xuICAgICAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTaG93cyBvciBoaWRlcyBhbiBpY29uIGFzc2lnbmVkIHRvIHRoZSBuZXR3b3JrSWNvbiBwcm9wZXJ0eVxuICAgICAqIEBwYXJhbSBkaXNwbGF5IGlmIHRydWUgdGhlIGljb24gaXMgZGlzcGxheWVkXG4gICAgICovXG4gICAgc2hvd1JlcXVlc3RJY29uKGRpc3BsYXkgPSB0cnVlKSB7XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3RJY29uKSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmV2ZWFsRWxlbWVudCh0aGlzLnJlcXVlc3RJY29uLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucmV2ZWFsRWxlbWVudCh0aGlzLnJlcXVlc3RJY29uLCBmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV2ZWFscyBhbiBlbGVtZW50IHRoYXQgaXMgaGlkZGVuIGF0IHN0YXJ0dXBcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRvIHJldmVhbFxuICAgICAqIEBwYXJhbSBkaXNwbGF5IGlmIHRydWUgZGlzcGxheXMgdGhlIGVsZW1lbnQgb3IgaGlkZXMgaWYgZmFsc2UuIGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIHJldmVhbEVsZW1lbnQoZWxlbWVudCwgZGlzcGxheSA9IHRydWUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnQgJiYgXCJjbGFzc0xpc3RcIiBpbiBlbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoZGlzcGxheSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2xhc3MoZWxlbWVudCwgdGhpcy5oaWRlQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhlbGVtZW50LCB0aGlzLmhpZGVDbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogSGlkZXMgYW4gZWxlbWVudCB0aGF0IGlzIGRpc3BsYXllZCBhdCBzdGFydHVwXG4gICAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBoaWRlXG4gICAgICovXG4gICAgaGlkZUVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBpZiAoZWxlbWVudCAmJiBcImNsYXNzTGlzdFwiIGluIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2xhc3MoZWxlbWVudCwgdGhpcy5oaWRlQ2xhc3MpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIHZlcnNpb24gZGVmaW5lZCBhdCBhIHZlcnNpb24gZW5kcG9pbnRcbiAgICAgKiBAcGFyYW0gdGV4dCBQcmV0ZXh0IGZvciB2ZXJzaW9uIGluZm9cbiAgICAgKi9cbiAgICBhc3luYyBnZXRWZXJzaW9uKHRleHQgPSBcIlZlcnNpb24gXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgdGhpcy5yZXF1ZXN0VVJMKFwidmVyc2lvblwiKTtcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uID0gZGF0YS52ZXJzaW9uO1xuICAgICAgICAgICAgdmFyIGxhYmVsID0gdGhpcy52ZXJzaW9uTGFiZWw7XG4gICAgICAgICAgICBpZiAobGFiZWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldENvbnRlbnQobGFiZWwsIHZlcnNpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbmNlbHMgYSByZXF1ZXN0XG4gICAgICovXG4gICAgY2FuY2VsUmVxdWVzdCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsUmVxdWVzdHMoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHN0eWxlIG9mIGFuIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRoYXQgaGFzIHN0eWxlXG4gICAgICogQHBhcmFtIHByb3BlcnR5IG5hbWUgb2Ygc3R5bGUgb3Igc3R5bGUgcHJvcGVydHlcbiAgICAgKiBAcGFyYW0gdmFsdWUgdmFsdWUgb2Ygc3R5bGVcbiAgICAgKiBAcGFyYW0gcHJpb3JpdHkgcHJpb3JpdHkgb2Ygc3R5bGVcbiAgICAgKiBAcGFyYW0gcmVzZXRWYWx1ZSB2YWx1ZSBvZiBzdHlsZSB0byBzZXQgYWZ0ZXIgYSByZXNldCB0aW1lb3V0IChvcHRpb25hbClcbiAgICAgKiBAcGFyYW0gcmVzZXRUaW1lb3V0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIHRvIHJlc2V0IHN0eWxlIHRvIChvcHRpb25hbClcbiAgICAgKi9cbiAgICBzZXRTdHlsZShlbGVtZW50LCBwcm9wZXJ0eSwgdmFsdWUsIHByaW9yaXR5LCByZXNldFZhbHVlID0gbnVsbCwgcmVzZXRUaW1lb3V0ID0gNTAwMCkge1xuICAgICAgICBlbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KHByb3BlcnR5LCB2YWx1ZSwgcHJpb3JpdHkpO1xuICAgICAgICBpZiAocmVzZXRWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0VGltZW91dCh0aGlzLnNldFN0eWxlLCByZXNldFRpbWVvdXQsIGVsZW1lbnQsIHJlc2V0VmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgcGFyZW50IG9mIGFuIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRoYXQgd2lsbCBiZSBwYXJlbnRlZFxuICAgICAqIEBwYXJhbSBwYXJlbnQgcGFyZW50IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzZXRQYXJlbnQoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB0ZXh0IGNvbnRlbnQgb2YgYSBzcGFuIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0gZWxlbWVudCBlbGVtZW50IHRoYXQgd2lsbCBiZSBzZXRcbiAgICAgKiBAcGFyYW0gdmFsdWUgdmFsdWUgdG8gc2V0IHNwYW5cbiAgICAgKiBAcGFyYW0gdG9vbHRpcCB2YWx1ZSB0byBzZXQgdG9vbCB0aXAgb2Ygc3BhbiAob3B0aW9uYWwpXG4gICAgICogQHBhcmFtIHJlc2V0VmFsdWUgdmFsdWUgdG8gYmUgc2V0IGFmdGVyIGEgcmVzZXQgdGltZW91dCAob3B0aW9uYWwpXG4gICAgICogQHBhcmFtIHJlc2V0VGltZW91dCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyB0byByZXNldCBzdHlsZSB0byAob3B0aW9uYWwpXG4gICAgICovXG4gICAgc2V0Q29udGVudChlbGVtZW50LCB2YWx1ZSwgdG9vbHRpcCA9IG51bGwsIHJlc2V0VmFsdWUgPSBudWxsLCByZXNldFRpbWVvdXQgPSA1MDAwKSB7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgaWYgKHR5cGVvZiB0b29sdGlwID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGVsZW1lbnQudGl0bGUgPSB0b29sdGlwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRvb2x0aXApIHtcbiAgICAgICAgICAgIGVsZW1lbnQudGl0bGUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzZXRWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc2V0VGltZW91dCh0aGlzLnNldENvbnRlbnQsIHJlc2V0VGltZW91dCwgZWxlbWVudCwgcmVzZXRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkIGVsZW1lbnQgdG8gdGhlIGNvbnRhaW5lci5cbiAgICAgKiBFbGVtZW50IGNhbiBiZSBzdHJpbmcgb3IgZWxlbWVudC4gSWYgc3RyaW5nIHRoZW4gdGhlIGVsZW1lbnQgaXMgY3JlYXRlZFxuICAgICAqIFByb3BlcnRpZXMgYW5kIHN0eWxlcyBjYW4gYmUgc2V0IG9uIHRoZSBlbGVtZW50IGFuZCBjaGlsZCBlbGVtZW50cyBjYW4gYmUgYWRkZWRcbiAgICAgKiBAcGFyYW0gY29udGFpbmVyIGNvbnRhaW5lciBmb3IgZWxlbWVudFxuICAgICAqIEBwYXJhbSBlbGVtZW50IGVsZW1lbnRcbiAgICAgKiBAcGFyYW0gcHJvcGVydGllcyBwcm9wZXJ0aWVzIG9yIHN0eWxlcyB0byBzZXQgb24gZWxlbWVudFxuICAgICAqIEBwYXJhbSBjaGlsZHJlbiBhZGRpdGlvbmFsIGNoaWxkIGVsZW1lbnRzXG4gICAgICovXG4gICAgYWRkRWxlbWVudChjb250YWluZXIsIGVsZW1lbnQsIHByb3BlcnRpZXMgPSBudWxsLCAuLi5jaGlsZHJlbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBlbGVtZW50ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gdGhpcy5jcmVhdGVFbGVtZW50KGVsZW1lbnQsIHByb3BlcnRpZXMsIC4uLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIGVsZW1lbnQgYW5kIG9wdGlvbmFsbHkgY2hpbGQgZWxlbWVudHNcbiAgICAgKiBAcGFyYW0gdGFnTmFtZSBuYW1lIG9mIGVsZW1lbnQgdG8gY3JlYXRlXG4gICAgICogQHBhcmFtIHByb3BlcnRpZXMgcHJvcGVydGllcyB0byBhcHBseSB0byBlbGVtZW50XG4gICAgICogQHBhcmFtIGNoaWxkcmVuIGNoaWxkIGVsZW1lbnRzIHRvIGNyZWF0ZVxuICAgICAqIEByZXR1cm5zIGVsZW1lbnRcbiAgICAgKi9cbiAgICBjcmVhdGVFbGVtZW50KHRhZ05hbWUsIHByb3BlcnRpZXMgPSBudWxsLCAuLi5jaGlsZHJlbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgICAgICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllcy5ub2RlVHlwZSB8fCB0eXBlb2YgcHJvcGVydGllcyAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbi51bnNoaWZ0KHByb3BlcnRpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT0gXCJzdHlsZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihlbGVtZW50LnN0eWxlLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShwcm9wZXJ0eSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSBpbiBlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICh2YXIgY2hpbGQgb2YgY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKHR5cGVvZiBjaGlsZCA9PT0gXCJvYmplY3RcIiA/IGNoaWxkIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2hpbGQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5sb2coZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB1cmwgcXVlcnkgb2YgdGhlIGN1cnJlbnQgcGFnZVxuICAgICAqIEBwYXJhbSBwYXJhbWV0ZXIgbmFtZSBvZiBwYXJhbWV0ZXJcbiAgICAgKiBAcGFyYW0gdmFsdWUgdmFsdWUgdG8gc2V0IHBhcmFtZXRlciB0b1xuICAgICAqL1xuICAgIHVwZGF0ZVF1ZXJ5KHBhcmFtZXRlciwgdmFsdWUpIHtcbiAgICAgICAgdmFyIHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgICB2YXIgc2VhcmNoUGFyYW1ldGVycyA9IHVybC5zZWFyY2hQYXJhbXM7XG4gICAgICAgIHNlYXJjaFBhcmFtZXRlcnMuc2V0KHBhcmFtZXRlciwgdmFsdWUpO1xuICAgICAgICB2YXIgcGF0aFF1ZXJ5ID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgXCI/XCIgKyBzZWFyY2hQYXJhbWV0ZXJzLnRvU3RyaW5nKCk7XG4gICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIFwiXCIsIHBhdGhRdWVyeSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEJpbmQgdGhlIG1lbWJlcnMgb24gdGhpcyBjbGFzcyB0byByZWZlciB0byB0aGlzIGNsYXNzXG4gICAgICogQHBhcmFtIG1haW5DbGFzcyBDbGFzcyB0byBhZGQgYmluZGluZ3MgdG9cbiAgICAgKi9cbiAgICBiaW5kUHJvcGVydGllcyhtYWluQ2xhc3MpIHtcbiAgICAgICAgdmFyIHByb3BlcnRpZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtYWluQ2xhc3MucHJvdG90eXBlKTtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gcHJvcGVydGllcykge1xuICAgICAgICAgICAgdmFyIHByb3BlcnR5ID0gcHJvcGVydGllc1trZXldO1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5ICE9PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgICB0aGF0W3Byb3BlcnR5XSA9IHRoYXRbcHJvcGVydHldLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2Nyb2xsIGVsZW1lbnQgaW50byB2aWV3XG4gICAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBzY3JvbGwgaW50byB2aWV3XG4gICAgICogQHBhcmFtIGJlaGF2aW9yIHNjcm9sbCBiZWhhdmlvci4gZGVmYXVsdCBpcyBzbW9vdGhcbiAgICAgKiBAcGFyYW0gYmxvY2sgcG9zaXRpb24gdG8gc2Nyb2xsIHRvLiBkZWZhdWx0IGlzIHN0YXJ0XG4gICAgICogQHBhcmFtIGlubGluZVxuICAgICAqL1xuICAgIHNjcm9sbEVsZW1lbnRJbnRvVmlldyhlbGVtZW50LCBiZWhhdmlvciA9IFwic21vb3RoXCIsIGJsb2NrID0gXCJzdGFydFwiLCBpbmxpbmUgPSBcIm5lYXJlc3RcIikge1xuICAgICAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KCh7IGJlaGF2aW9yLCBibG9jaywgaW5saW5lIH0pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2Nyb2xsIHRvIGJvdHRvbSBvZiBlbGVtZW50XG4gICAgICogQHBhcmFtIGVsZW1lbnQgZWxlbWVudCB0byBzY3JvbGwgdG8gYm90dG9tXG4gICAgICovXG4gICAgc2Nyb2xsVG9Cb3R0b20oZWxlbWVudCkge1xuICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIGdldERvd25sb2FkRGF0YSh1cmwpIHtcbiAgICAgICAgdmFyIGJpbmFyeSA9IGF3YWl0IHRoaXMuZ2V0RmlsZUJpbmFyeUF0VVJMKHVybCk7XG4gICAgICAgIHZhciBiaW5hcnlCdWZmZXIgPSBuZXcgQmxvYihbYmluYXJ5LmJ1ZmZlcl0pO1xuICAgICAgICByZXR1cm4gYmluYXJ5QnVmZmVyO1xuICAgIH1cbiAgICBnZXRGaWxlQmluYXJ5QXRVUkwodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJyYXkgPSBuZXcgVWludDhBcnJheShyZXF1ZXN0LnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYXJyYXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlcXVlc3Quc3RhdHVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gcmVqZWN0O1xuICAgICAgICAgICAgcmVxdWVzdC5vbmFib3J0ID0gcmVqZWN0O1xuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgICAgICAgICAgcmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFzeW5jIHVwbG9hZCh1cmwsIGZpbGUsIGZvcm1EYXRhKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZm9ybURhdGEgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIEJsb2IgfHwgZmlsZSBpbnN0YW5jZW9mIEZpbGUpIHtcbiAgICAgICAgICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlcyA9IGZpbGU7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZXMnLCBmaWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHRzID0gYXdhaXQgdGhpcy5wb3N0VVJMKHVybCwgZm9ybURhdGEpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2coZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMubG9nKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9DbGlwYm9hcmQodmFsdWUpIHtcbiAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodmFsdWUpO1xuICAgIH1cbiAgICBvcGVuSW5XaW5kb3codXJsLCB0YXJnZXQpIHtcbiAgICAgICAgd2luZG93Lm9wZW4odXJsLCB0YXJnZXQpO1xuICAgIH1cbiAgICBhc3luYyBjaGVja0ZyYWdtZW50KCkge1xuICAgICAgICB2YXIgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoXCIjXCIsIFwiXCIpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHN3aXRjaCAoaGFzaCkge1xuICAgICAgICAgICAgY2FzZSBcImNhc2UxXCI6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY2FzZTJcIjpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJcIjpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICB9XG4gICAgY3JlYXRlT3B0aW9uKGxhYmVsLCB2YWx1ZSwgdXNlTGlzdEl0ZW0gPSBmYWxzZSwgaWNvbiA9IG51bGwsIGNsYXNzZXMgPSBbXSwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIG9wdGlvbk5hbWUgPSB1c2VMaXN0SXRlbSA/IFwibGlcIiA6IFwib3B0aW9uXCI7XG4gICAgICAgIHZhciBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG9wdGlvbk5hbWUpO1xuICAgICAgICBvcHRpb24uaW5uZXJUZXh0ID0gbGFiZWw7XG4gICAgICAgIGlmIChpY29uKSB7XG4gICAgICAgICAgICB2YXIgaWNvbkVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICAgICAgaWNvbkVsZW1lbnQuc3JjID0gaWNvbjtcbiAgICAgICAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBpY29uRWxlbWVudC5vdXRlckhUTUwgKyBsYWJlbDtcbiAgICAgICAgICAgIGZvciAodmFyIGNsYXNzTmFtZSBpbiBjbGFzc2VzKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uLmNsYXNzTGlzdC5hZGQoY2xhc3Nlc1tjbGFzc05hbWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbi5pbm5lckhUTUwgPSBsYWJlbDtcbiAgICAgICAgfVxuICAgICAgICBvcHRpb24ubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2sob3B0aW9uLCBsYWJlbCwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcHRpb247XG4gICAgfVxuICAgIC8qKlxuICAgICogTG9nIHZhbHVlcyB0byB0aGUgY29uc29sZVxuICAgICogQHBhcmFtIHZhbHVlcyB2YWx1ZXMgdG8gbG9nXG4gICAgKi9cbiAgICBsb2coLi4udmFsdWVzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKC4uLnZhbHVlcyk7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pUW1GelpVTnNZWE56TG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lRbUZ6WlVOc1lYTnpMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUpCUVVGQkxFMUJRVTBzVDBGQlR5eFRRVUZUTzBsQlEyNUNMRk5CUVZNc1IwRkJWeXhUUVVGVExFTkJRVU03U1VGRE9VSXNVMEZCVXl4SFFVRlhMRmRCUVZjc1EwRkJRenRKUVVOb1F5eHJRa0ZCYTBJc1IwRkJWeXhEUVVGRExFTkJRVU03U1VGREwwSXNWMEZCVnl4SFFVRnBReXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEzUkVMRmRCUVZjc1IwRkJaMElzVVVGQlVTeERRVUZETEdOQlFXTXNRMEZCUXl4aFFVRmhMRU5CUVdkQ0xFTkJRVU03U1VGRGFrWXNUVUZCVFN4SFFVRnpRaXhSUVVGUkxFTkJRVU1zWTBGQll5eERRVUZETEZGQlFWRXNRMEZCYzBJc1EwRkJRenRKUVVOdVJpeFhRVUZYTEVkQlFXZENMRkZCUVZFc1EwRkJReXhqUVVGakxFTkJRVU1zWVVGQllTeERRVUZuUWl4RFFVRkRPMGxCUTJwR0xHRkJRV0VzUjBGQlowSXNVVUZCVVN4RFFVRkRMR05CUVdNc1EwRkJReXhsUVVGbExFTkJRV2RDTEVOQlFVTTdTVUZEY2tZc1dVRkJXU3hIUVVGblFpeFJRVUZSTEVOQlFVTXNZMEZCWXl4RFFVRkRMR05CUVdNc1EwRkJaMElzUTBGQlF6dEpRVU51Uml4alFVRmpMRU5CUVZrN1NVRkRNVUlzVFVGQlRTeERRVUZETEZkQlFWY3NSMEZCVnl4clFrRkJhMElzUTBGQlF6dEpRVVZvUkR0SlFVVkJMRU5CUVVNN1NVRkZSQ3hOUVVGTkxFTkJRVU1zWTBGQll5eERRVUZETEdOQlFXMUNMRVZCUVVVc1UwRkJhMEk3VVVGRE1VUXNUVUZCVFN4RFFVRkRMR2RDUVVGblFpeERRVUZETEZOQlFWTXNRMEZCUXl4WFFVRlhMRVZCUVVVc1EwRkJReXhMUVVGTExFVkJRVVVzUlVGQlJUdFpRVU4wUkN4SlFVRkpMRU5CUVVNN1owSkJRMFlzU1VGQlNTeFJRVUZSTEVkQlFVY3NTVUZCU1N4alFVRmpMRVZCUVVVc1EwRkJRenRuUWtGRGNFTXNTVUZCU1N4VFFVRlRMRVZCUVVVc1EwRkJRenR2UWtGRFlpeFJRVUZSTEVOQlFVTXNVMEZCVXl4RFFVRkRMRVZCUVVVc1EwRkJRenRuUWtGRGVrSXNRMEZCUXp0WlFVTktMRU5CUVVNN1dVRkRSQ3hQUVVGUExFdEJRVXNzUlVGQlJTeERRVUZETzJkQ1FVTmFMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdXVUZEZUVJc1EwRkJRenRSUVVOS0xFTkJRVU1zUTBGQlF5eERRVUZCTzBsQlEwd3NRMEZCUXp0SlFVVkVPenRQUVVWSE8wbEJRMGdzUzBGQlN5eERRVUZETEdGQlFXRTdVVUZEYUVJc1NVRkJTU3hEUVVGRExHTkJRV01zUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0SlFVTnNReXhEUVVGRE8wbEJSVVE3TzA5QlJVYzdTVUZEU0N4VlFVRlZPMUZCUTFBc1NVRkJTU3hIUVVGSExFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNUVUZCVFN4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFJRVU40UXl4SlFVRkpMRlZCUVZVc1IwRkJSeXhIUVVGSExFTkJRVU1zV1VGQldTeERRVUZETzBsQlEzSkRMRU5CUVVNN1NVRkZSRHM3T3pzN096czdPenM3T3pzN096czdUMEZwUWtjN1NVRkRTQ3hMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFWY3NSVUZCUlN4VlFVRmxMRWxCUVVrc1JVRkJSU3hQUVVGblFpeEpRVUZKTzFGQlEyaEZMRWxCUVVrc1QwRkJUeXhKUVVGSkxFbEJRVWtzUlVGQlJTeERRVUZETzFsQlFVTXNUMEZCVHl4SFFVRkhMRVZCUVVVc1EwRkJRVHRSUVVGRExFTkJRVU03VVVGQlFTeERRVUZETzFGQlEzUkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEzWkNMRTlCUVU4c1RVRkJUU3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVkQlFVY3NSVUZCUlN4UFFVRlBMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRGNFUXNRMEZCUXp0SlFVVkVPenM3T3pzN096czdPenM3T3pzN1QwRmxSenRKUVVOSUxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCVnl4RlFVRkZMRWxCUVZNc1JVRkJSU3hWUVVGbExFbEJRVWtzUlVGQlJTeFBRVUZuUWl4SlFVRkpPMUZCUXpWRkxFbEJRVWtzVDBGQlR5eEpRVUZKTEVsQlFVa3NSVUZCUlN4RFFVRkRPMWxCUVVNc1QwRkJUeXhIUVVGSExFVkJRVVVzUTBGQlFUdFJRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hKUVVGSkxFbEJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NTVUZCU1N4SlFVRkpMRVZCUVVVc1EwRkJRenRaUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkJPMUZCUVVNc1EwRkJRenRSUVVONlJDeFBRVUZQTEVOQlFVTXNUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRSUVVONFFpeFBRVUZQTEUxQlFVMHNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhIUVVGSExFVkJRVVVzVDBGQlR5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMGxCUTNCRUxFTkJRVU03U1VGRlJEczdPenM3T3pzN096czdPenM3T3pzN096czdPenRQUVhOQ1J6dEpRVU5JTEV0QlFVc3NRMEZCUXl4VlFVRlZMRU5CUVVNc1IwRkJWeXhGUVVGRkxGVkJRV1VzU1VGQlNTeEZRVUZGTEU5QlFXZENMRWxCUVVrN1VVRkRjRVVzU1VGQlNTeFJRVUZSTEVkQlFWRXNTVUZCU1N4RFFVRkRPMUZCUlhwQ0xFbEJRVWtzUTBGQlF6dFpRVU5HTEVsQlFVa3NRMEZCUXl4bFFVRmxMRVZCUVVVc1EwRkJRenRaUVVOMlFpeE5RVUZOTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRmNrSXNUVUZCVFN4VlFVRlZMRWRCUVVjc1NVRkJTU3hsUVVGbExFVkJRVVVzUTBGQlF6dFpRVU42UXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEycERMRWxCUVVrc1QwRkJUeXhKUVVGSkxFbEJRVWtzUlVGQlJTeERRVUZETzJkQ1FVRkRMRTlCUVU4c1IwRkJSeXhGUVVGRkxFTkJRVUU3V1VGQlF5eERRVUZETzFsQlEzSkRMRWxCUVVrc1QwRkJUeXhEUVVGRExFMUJRVTBzU1VGQlNTeEpRVUZKTEVWQlFVVXNRMEZCUXp0blFrRkJReXhQUVVGUExFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUVR0WlFVRkRMRU5CUVVNN1dVRkJRU3hEUVVGRE8xbEJSWGhFTEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhyUWtGQmEwSXNSVUZCUlN4RFFVRkRPMWxCUXpGRExFbEJRVWtzUTBGQlF5eFhRVUZYTEVOQlFVTXNSMEZCUnl4RFFVRkRMRk5CUVZNc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlF6dFpRVVUxUXl4UlFVRlJMRWRCUVVjc1RVRkJUU3hMUVVGTExFTkJRVU1zUjBGQlJ5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMWxCUTNKRExFbEJRVWtzU1VGQlNTeEhRVUZITEUxQlFVMHNVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8xbEJSV3BETEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1RVRkJUU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEyNURMRWxCUVVrc1EwRkJReXhyUWtGQmEwSXNSVUZCUlN4RFFVRkRPMWxCUlRGQ0xFbEJRVWtzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlF6bENMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETDBJc1EwRkJRenRaUVVWRUxFbEJRVWtzU1VGQlNTeEZRVUZGTEVOQlFVTTdaMEpCUTFJc1NVRkJTU3hEUVVGRE8yOUNRVU5HTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUXk5Q0xFTkJRVU03WjBKQlEwUXNUMEZCVHl4TFFVRkxMRVZCUVVVc1EwRkJRenR2UWtGRFdpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8yOUNRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJRenRuUWtGRFppeERRVUZETzJkQ1FVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8xbEJRMllzUTBGQlF6dFpRVVZFTEU5QlFVOHNVVUZCVVN4RFFVRkRPMUZCUTI1Q0xFTkJRVU03VVVGRFJDeFBRVUZQTEV0QlFVc3NSVUZCUlN4RFFVRkRPMWxCUTFvc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RlFVRkZMRU5CUVVNN1dVRkRNVUlzU1VGQlNTeFJRVUZSTEVsQlFVa3NTVUZCU1N4RFFVRkRMRmRCUVZjc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc2EwSkJRV3RDTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRuUWtGRGNrWXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzaEVMRU5CUVVNN1dVRkRSQ3hQUVVGUExFdEJRVXNzUTBGQlF6dFJRVU5vUWl4RFFVRkRPMGxCUTBvc1EwRkJRenRKUVVWRU96czdUMEZIUnp0SlFVTklMRzFDUVVGdFFqdEpRVVZ1UWl4RFFVRkRPMGxCUlVRN096czdPMDlCUzBjN1NVRkRTQ3hyUWtGQmEwSXNRMEZCUXl4TFFVRlZPMUZCUXpGQ0xFbEJRVWtzUzBGQlN5eERRVUZETEUxQlFVMHNTMEZCU3l4VlFVRlZPMWxCUVVVc1QwRkJUenRSUVVONFF5eEpRVUZKTEVsQlFVa3NSMEZCUnl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRE8xRkJRM1JDTEVsQlFVa3NTVUZCU1N4SlFVRkpMR0ZCUVdFc1JVRkJSU3hEUVVGRE8xbEJRM3BDTEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU03VVVGRE9VSXNRMEZCUXp0SlFVTktMRU5CUVVNN1NVRkZSRHM3VDBGRlJ6dEpRVU5JTEdOQlFXTTdVVUZEV0N4SlFVRkpMRWxCUVVrc1EwRkJReXhYUVVGWExFVkJRVVVzUTBGQlF6dFpRVU53UWl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEV0QlFYTkNMRVZCUVVVc1IwRkJWeXhGUVVGRkxFZEJRV2xETEVWQlFVVXNSVUZCUlR0blFrRkRha2NzUzBGQlN5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMWxCUTJwQ0xFTkJRVU1zUTBGQlF5eERRVUZCTzFGQlEwd3NRMEZCUXp0SlFVTktMRU5CUVVNN1NVRkZSRHM3T3pzN1QwRkxSenRKUVVOSUxFdEJRVXNzUTBGQlF5eFpRVUZ2UWp0UlFVTjJRaXhQUVVGUExFbEJRVWtzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUlVGQlJTeFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkJPMGxCUTI1RkxFTkJRVU03U1VGRlJEczdPenM3T3p0UFFVOUhPMGxCUTBnc1ZVRkJWU3hEUVVGRExFdEJRV0VzUlVGQlJTeExRVUZoTEVWQlFVVXNWMEZCWjBJc1NVRkJTVHRSUVVVeFJDeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRaUVVObUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU42UXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1dVRkRNME1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFsQlEzUkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRaUVVOeVF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4alFVRmpMRWRCUVVjc1VVRkJVU3hEUVVGRE8xRkJRMnhETEVOQlFVTTdTVUZEU2l4RFFVRkRPMGxCUlVRN08wOUJSVWM3U1VGRFNDeDFRa0ZCZFVJN1VVRkRjRUlzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlN4RFFVRkRPMGxCUTNSQ0xFTkJRVU03U1VGRlJEczdUMEZGUnp0SlFVTklMRmRCUVZjN1VVRkRVaXhKUVVGSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0WlFVTm1MRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4VFFVRlRMRU5CUVVNc1EwRkJRenRaUVVONlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8xRkJRM1pDTEVOQlFVTTdVVUZEUkN4SlFVRkpMRWxCUVVrc1EwRkJReXhqUVVGakxFVkJRVVVzUTBGQlF6dFpRVU4yUWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhGUVVGRkxFTkJRVU03VVVGRGVrSXNRMEZCUXp0SlFVTktMRU5CUVVNN1NVRkZSRHM3T3p0UFFVbEhPMGxCUTBnc1VVRkJVU3hEUVVGRExFOUJRV2xETEVWQlFVVXNTVUZCV1R0UlFVTnlSQ3hKUVVGSkxFOUJRVThzV1VGQldTeFhRVUZYTEVWQlFVVXNRMEZCUXp0WlFVTnNReXhQUVVGUExFZEJRVWNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhEUVVGRE8xRkJSVVFzU1VGQlNTeFBRVUZQTEZsQlFWa3NTMEZCU3l4RlFVRkZMRU5CUVVNN1dVRkROVUlzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRuUWtGRGRrTXNUVUZCVFN4RlFVRkZMRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTjBRaXhGUVVGRkxFTkJRVU1zVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVNeFFpeERRVUZETzFGQlEwb3NRMEZCUXp0SlFVTktMRU5CUVVNN1NVRkZSRHM3T3p0UFFVbEhPMGxCUTBnc1YwRkJWeXhEUVVGRExFOUJRWGxETEVWQlFVVXNTVUZCV1R0UlFVTm9SU3hKUVVGSkxFOUJRVThzV1VGQldTeFhRVUZYTEVWQlFVVXNRMEZCUXp0WlFVTnNReXhQUVVGUExFZEJRVWNzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhEUVVGRE8xRkJSVVFzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRaUVVOMlF5eE5RVUZOTEVWQlFVVXNSMEZCUnl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGRFSXNSVUZCUlN4RFFVRkRMRk5CUVZNc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZETjBJc1EwRkJRenRKUVVOS0xFTkJRVU03U1VGRlJEczdPMDlCUjBjN1NVRkRTQ3hsUVVGbExFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVazdVVUZETTBJc1NVRkJTU3hKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTTdXVUZEY0VJc1NVRkJTU3hQUVVGUExFVkJRVVVzUTBGQlF6dG5Ra0ZEV0N4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkRPVU1zUTBGQlF6dHBRa0ZEU1N4RFFVRkRPMmRDUVVOSUxFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1JVRkJSU3hMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU12UXl4RFFVRkRPMUZCUTBvc1EwRkJRenRKUVVOS0xFTkJRVU03U1VGRlJEczdPenRQUVVsSE8wbEJRMGdzWVVGQllTeERRVUZETEU5QlFXOUNMRVZCUVVVc1QwRkJUeXhIUVVGSExFbEJRVWs3VVVGRkwwTXNTVUZCU1N4UFFVRlBMRWxCUVVrc1YwRkJWeXhKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzFsQlEzSkRMRWxCUVVrc1QwRkJUeXhGUVVGRkxFTkJRVU03WjBKQlExZ3NTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMWxCUXpkRExFTkJRVU03YVVKQlEwa3NRMEZCUXp0blFrRkRTQ3hKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEU5QlFVOHNSVUZCUlN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03V1VGRE1VTXNRMEZCUXp0UlFVTktMRU5CUVVNN1NVRkRTaXhEUVVGRE8wbEJSVVE3T3p0UFFVZEhPMGxCUTBnc1YwRkJWeXhEUVVGRExFOUJRV2RDTzFGQlEzcENMRWxCUVVrc1QwRkJUeXhKUVVGSkxGZEJRVmNzU1VGQlNTeFBRVUZQTEVWQlFVVXNRMEZCUXp0WlFVTnlReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEU5QlFVOHNSVUZCUlN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03VVVGRE1VTXNRMEZCUXp0SlFVTktMRU5CUVVNN1NVRkZSRHM3TzA5QlIwYzdTVUZEU0N4TFFVRkxMRU5CUVVNc1ZVRkJWU3hEUVVGRExFbEJRVWtzUjBGQlJ5eFZRVUZWTzFGQlF5OUNMRWxCUVVrc1EwRkJRenRaUVVOR0xFbEJRVWtzU1VGQlNTeEhRVUZSTEUxQlFVMHNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU5xUkN4SlFVRkpMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETzFsQlF6TkNMRWxCUVVrc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTTdXVUZGT1VJc1NVRkJTU3hMUVVGTExFVkJRVVVzUTBGQlF6dG5Ra0ZEVkN4SlFVRkpMRU5CUVVNc1ZVRkJWU3hEUVVGRExFdEJRVXNzUlVGQlJTeFBRVUZQTEVOQlFVTXNRMEZCUXp0WlFVTnVReXhEUVVGRE8xRkJRMG9zUTBGQlF6dFJRVU5FTEU5QlFVOHNTMEZCU3l4RlFVRkZMRU5CUVVNN1dVRkRXaXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFTkJRVU03U1VGRFNpeERRVUZETzBsQlJVUTdPMDlCUlVjN1NVRkRTQ3hoUVVGaE8xRkJRMVlzU1VGQlNTeERRVUZETzFsQlEwWXNTVUZCU1N4RFFVRkRMR05CUVdNc1JVRkJSU3hEUVVGRE8xRkJRM3BDTEVOQlFVTTdVVUZEUkN4UFFVRlBMRXRCUVVzc1JVRkJSU3hEUVVGRE8xbEJRMW9zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRSUVVOdVFpeERRVUZETzBsQlEwb3NRMEZCUXp0SlFVVkVPenM3T3pzN096dFBRVkZITzBsQlEwZ3NVVUZCVVN4RFFVRkRMRTlCUVc5Q0xFVkJRVVVzVVVGQlowSXNSVUZCUlN4TFFVRnZRaXhGUVVGRkxGRkJRV2xDTEVWQlFVVXNZVUZCYTBJc1NVRkJTU3hGUVVGRkxHVkJRWFZDTEVsQlFVazdVVUZETVVrc1QwRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eFhRVUZYTEVOQlFVTXNVVUZCVVN4RlFVRkZMRXRCUVVzc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVVZ5UkN4SlFVRkpMRlZCUVZVc1MwRkJTeXhKUVVGSkxFVkJRVVVzUTBGQlF6dFpRVU4yUWl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExGRkJRVkVzUlVGQlJTeFpRVUZaTEVWQlFVVXNUMEZCVHl4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRMmhGTEVOQlFVTTdTVUZEU2l4RFFVRkRPMGxCUlVRN096czdUMEZKUnp0SlFVTklMRk5CUVZNc1EwRkJReXhQUVVGWkxFVkJRVVVzVFVGQldUdFJRVU5xUXl4TlFVRk5MRU5CUVVNc1YwRkJWeXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzBsQlF5OUNMRU5CUVVNN1NVRkZSRHM3T3pzN096dFBRVTlITzBsQlEwZ3NWVUZCVlN4RFFVRkRMRTlCUVc5Q0xFVkJRVVVzUzBGQllTeEZRVUZGTEZWQlFXVXNTVUZCU1N4RlFVRkZMR0ZCUVd0Q0xFbEJRVWtzUlVGQlJTeGxRVUYxUWl4SlFVRkpPMUZCUTNKSUxFOUJRVThzUTBGQlF5eFhRVUZYTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUlRWQ0xFbEJRVWtzVDBGQlR5eFBRVUZQTEVsQlFVa3NVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRPVUlzVDBGQlR5eERRVUZETEV0QlFVc3NSMEZCUnl4UFFVRlBMRU5CUVVNN1VVRkRNMElzUTBGQlF6dGhRVU5KTEVsQlFVa3NUMEZCVHl4RlFVRkZMRU5CUVVNN1dVRkRhRUlzVDBGQlR5eERRVUZETEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1VVRkRla0lzUTBGQlF6dFJRVU5FTEVsQlFVa3NWVUZCVlN4TFFVRkxMRWxCUVVrc1JVRkJSU3hEUVVGRE8xbEJRM1pDTEZWQlFWVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hGUVVGRkxGbEJRVmtzUlVGQlJTeFBRVUZQTEVWQlFVVXNWVUZCVlN4RFFVRkRMRU5CUVVFN1VVRkRha1VzUTBGQlF6dEpRVU5LTEVOQlFVTTdTVUZGUkRzN096czdPenM3VDBGUlJ6dEpRVU5JTEZWQlFWVXNRMEZCUXl4VFFVRmxMRVZCUVVVc1QwRkJjMElzUlVGQlJTeFZRVUZWTEVkQlFVY3NTVUZCU1N4RlFVRkZMRWRCUVVjc1VVRkJaVHRSUVVOMFJpeEpRVUZKTEVOQlFVTTdXVUZEUml4SlFVRkpMRTlCUVU4c1QwRkJUeXhKUVVGSkxGRkJRVkVzUlVGQlJTeERRVUZETzJkQ1FVTTVRaXhQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4UFFVRlBMRVZCUVVVc1ZVRkJWU3hGUVVGRkxFZEJRVWNzVVVGQlVTeERRVUZETEVOQlFVTTdXVUZEYkVVc1EwRkJRenRaUVVWRUxFbEJRVWtzVDBGQlR5eFBRVUZQTEV0QlFVc3NVVUZCVVN4RlFVRkZMRU5CUVVNN1owSkJReTlDTEZOQlFWTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03V1VGRGJFTXNRMEZCUXp0UlFVTktMRU5CUVVNN1VVRkRSQ3hQUVVGUExFdEJRVXNzUlVGQlJTeERRVUZETzFsQlExb3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFJRVU51UWl4RFFVRkRPMGxCUTBvc1EwRkJRenRKUVVWRU96czdPenM3VDBGTlJ6dEpRVU5JTEdGQlFXRXNRMEZCUXl4UFFVRmxMRVZCUVVVc1lVRkJhMElzU1VGQlNTeEZRVUZGTEVkQlFVY3NVVUZCWlR0UlFVTjBSU3hKUVVGSkxFTkJRVU03V1VGRFJpeEpRVUZKTEU5QlFVOHNSMEZCVVN4UlFVRlJMRU5CUVVNc1lVRkJZU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETzFsQlJXNUVMRWxCUVVrc1ZVRkJWU3hGUVVGRkxFTkJRVU03WjBKQlJXUXNTVUZCU1N4VlFVRlZMRU5CUVVNc1VVRkJVU3hKUVVGSkxFOUJRVThzVlVGQlZTeExRVUZMTEZGQlFWRXNSVUZCUlN4RFFVRkRPMjlDUVVONlJDeFJRVUZSTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8yZENRVU5vUXl4RFFVRkRPM0ZDUVVOSkxFTkJRVU03YjBKQlEwZ3NTMEZCU3l4SlFVRkpMRkZCUVZFc1NVRkJTU3hWUVVGVkxFVkJRVVVzUTBGQlF6dDNRa0ZETDBJc1NVRkJTU3hMUVVGTExFZEJRVWNzVlVGQlZTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPM2RDUVVWcVF5eEpRVUZKTEZGQlFWRXNTVUZCU1N4UFFVRlBMRVZCUVVVc1EwRkJRenMwUWtGRGRrSXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPM2RDUVVOMlF5eERRVUZET3paQ1FVTkpMRU5CUVVNN05FSkJRMGdzVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4UlFVRlJMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03TkVKQlEzUkRMRWxCUVVrc1VVRkJVU3hKUVVGSkxFOUJRVThzUlVGQlJTeERRVUZETzJkRFFVTjJRaXhQUVVGUExFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRPelJDUVVNM1FpeERRVUZETzNkQ1FVTktMRU5CUVVNN2IwSkJRMG9zUTBGQlF6dG5Ra0ZEU2l4RFFVRkRPMWxCUTBvc1EwRkJRenRaUVVWRUxFdEJRVXNzU1VGQlNTeExRVUZMTEVsQlFVa3NVVUZCVVN4RlFVRkZMRU5CUVVNN1owSkJRekZDTEU5QlFVOHNRMEZCUXl4WFFVRlhMRU5CUVVNc1QwRkJUeXhMUVVGTExFdEJRVXNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eGpRVUZqTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNelJpeERRVUZETzFsQlJVUXNUMEZCVHl4UFFVRlBMRU5CUVVNN1VVRkRiRUlzUTBGQlF6dFJRVU5FTEU5QlFVOHNTMEZCU3l4RlFVRkZMRU5CUVVNN1dVRkRXaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTI1Q0xFTkJRVU03VVVGRlJDeFBRVUZQTzBsQlExWXNRMEZCUXp0SlFVVkVPenM3TzA5QlNVYzdTVUZEU0N4WFFVRlhMRU5CUVVNc1UwRkJhVUlzUlVGQlJTeExRVUZoTzFGQlEzcERMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGVFTXNTVUZCU1N4blFrRkJaMElzUjBGQlJ5eEhRVUZITEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUTNoRExHZENRVUZuUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhUUVVGVExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdVVUZEZGtNc1NVRkJTU3hUUVVGVExFZEJRVWNzVFVGQlRTeERRVUZETEZGQlFWRXNRMEZCUXl4UlFVRlJMRWRCUVVjc1IwRkJSeXhIUVVGSExHZENRVUZuUWl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRemRGTEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXp0SlFVTXhReXhEUVVGRE8wbEJSVVE3T3p0UFFVZEhPMGxCUTBnc1kwRkJZeXhEUVVGRExGTkJRV003VVVGRE1VSXNTVUZCU1N4VlFVRlZMRWRCUVZFc1RVRkJUU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRk5CUVZNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFJRVU4wUlN4SlFVRkpMRWxCUVVrc1IwRkJVU3hKUVVGSkxFTkJRVU03VVVGRGNrSXNTMEZCU3l4SlFVRkpMRWRCUVVjc1NVRkJTU3hWUVVGVkxFVkJRVVVzUTBGQlF6dFpRVU14UWl4SlFVRkpMRkZCUVZFc1IwRkJWeXhWUVVGVkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEZGtNc1NVRkJTU3hSUVVGUkxFdEJRVXNzWVVGQllTeEZRVUZGTEVOQlFVTTdaMEpCUXpsQ0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUXpsRExFTkJRVU03VVVGRFNpeERRVUZETzBsQlEwb3NRMEZCUXp0SlFVVkVPenM3T3pzN1QwRk5SenRKUVVOSUxIRkNRVUZ4UWl4RFFVRkRMRTlCUVdkQ0xFVkJRVVVzVVVGQlVTeEhRVUZITEZGQlFWRXNSVUZCUlN4TFFVRkxMRWRCUVVjc1QwRkJUeXhGUVVGRkxFMUJRVTBzUjBGQlJ5eFRRVUZUTzFGQlF6ZEdMRTlCUVU4c1EwRkJReXhqUVVGakxFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNSVUZCUlN4TFFVRkxMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVEJDTEVOQlFVTXNRMEZCUXp0SlFVTnNSaXhEUVVGRE8wbEJSVVE3T3p0UFFVZEhPMGxCUTBnc1kwRkJZeXhEUVVGRExFOUJRV2RDTzFGQlF6VkNMRWxCUVVrc1QwRkJUeXhaUVVGWkxHMUNRVUZ0UWl4RlFVRkZMRU5CUVVNN1dVRkRNVU1zVDBGQlR5eERRVUZETEZOQlFWTXNSMEZCUnl4UFFVRlBMRU5CUVVNc1dVRkJXU3hEUVVGRE8xRkJRelZETEVOQlFVTTdZVUZEU1N4RFFVRkRPMWxCUTBnc1QwRkJUeXhEUVVGRExGTkJRVk1zUjBGQlJ5eFBRVUZQTEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUXpWRExFTkJRVU03U1VGRFNpeERRVUZETzBsQlJVUXNTMEZCU3l4RFFVRkRMR1ZCUVdVc1EwRkJReXhIUVVGWE8xRkJRemxDTEVsQlFVa3NUVUZCVFN4SFFVRkhMRTFCUVUwc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMmhFTEVsQlFVa3NXVUZCV1N4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROME1zVDBGQlR5eFpRVUZaTEVOQlFVTTdTVUZEZGtJc1EwRkJRenRKUVVWRUxHdENRVUZyUWl4RFFVRkRMRWRCUVZVN1VVRkRNVUlzVDBGQlR5eEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hOUVVGTkxFVkJRVVVzUlVGQlJUdFpRVU53UXl4TlFVRk5MRTlCUVU4c1IwRkJSeXhKUVVGSkxHTkJRV01zUlVGQlJTeERRVUZETzFsQlJYSkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFZEJRVWNzUjBGQlJ5eEZRVUZGTzJkQ1FVTnVRaXhKUVVGSkxFOUJRVThzUTBGQlF5eE5RVUZOTEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN2IwSkJRekZDTEVsQlFVa3NRMEZCUXp0M1FrRkRSaXhOUVVGTkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEZWQlFWVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03ZDBKQlF5OURMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dHZRa0ZEYkVJc1EwRkJRenR2UWtGRFJDeFBRVUZQTEV0QlFVc3NSVUZCUlN4RFFVRkRPM2RDUVVOYUxFMUJRVTBzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0dlFrRkRha0lzUTBGQlF6dG5Ra0ZEU2l4RFFVRkRPM0ZDUVVOSkxFTkJRVU03YjBKQlEwZ3NUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dG5Ra0ZETVVJc1EwRkJRenRaUVVOS0xFTkJRVU1zUTBGQlFUdFpRVVZFTEU5QlFVOHNRMEZCUXl4UFFVRlBMRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRM3BDTEU5QlFVOHNRMEZCUXl4UFFVRlBMRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRM3BDTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0WlFVTXZRaXhQUVVGUExFTkJRVU1zV1VGQldTeEhRVUZITEdGQlFXRXNRMEZCUXp0WlFVTnlReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVVUZEYkVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFRpeERRVUZETzBsQlJVUXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGWExFVkJRVVVzU1VGQmMwTXNSVUZCUlN4UlFVRnRRanRSUVVWc1JpeEpRVUZKTEVOQlFVTTdXVUZGUml4SlFVRkpMRkZCUVZFc1NVRkJTU3hKUVVGSkxFVkJRVVVzUTBGQlF6dG5Ra0ZEY0VJc1VVRkJVU3hIUVVGSExFbEJRVWtzVVVGQlVTeEZRVUZGTEVOQlFVRTdXVUZETlVJc1EwRkJRenRaUVVWRUxFbEJRVWtzU1VGQlNTeFpRVUZaTEVsQlFVa3NTVUZCU1N4SlFVRkpMRmxCUVZrc1NVRkJTU3hGUVVGRkxFTkJRVU03WjBKQlEyaEVMRkZCUVZFc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMWxCUTJwRExFTkJRVU03YVVKQlEwa3NRMEZCUXp0blFrRkRTQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUV3UWl4RFFVRkRPMmRDUVVOMlF5eExRVUZMTEUxQlFVMHNTVUZCU1N4SlFVRkpMRXRCUVVzc1JVRkJSU3hEUVVGRE8yOUNRVU40UWl4UlFVRlJMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0blFrRkRiRU1zUTBGQlF6dFpRVU5LTEVOQlFVTTdXVUZGUkN4SlFVRkpMRU5CUVVNN1owSkJRMFlzU1VGQlNTeFBRVUZQTEVkQlFVY3NUVUZCVFN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0blFrRkRhRVFzVDBGQlR5eFBRVUZQTEVOQlFVTTdXVUZEYkVJc1EwRkJRenRaUVVORUxFOUJRVThzUzBGQlN5eEZRVUZGTEVOQlFVTTdaMEpCUTFvc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0blFrRkRhRUlzVDBGQlR5eExRVUZMTEVOQlFVTTdXVUZEYUVJc1EwRkJRenRSUVVOS0xFTkJRVU03VVVGRFJDeFBRVUZQTEV0QlFVc3NSVUZCUlN4RFFVRkRPMWxCUTFvc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTm9RaXhQUVVGUExFdEJRVXNzUTBGQlF6dFJRVU5vUWl4RFFVRkRPMGxCUTBvc1EwRkJRenRKUVVWRUxHVkJRV1VzUTBGQlF5eExRVUZoTzFGQlF6RkNMRk5CUVZNc1EwRkJReXhUUVVGVExFTkJRVU1zVTBGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGRlJDeFpRVUZaTEVOQlFVTXNSMEZCVnl4RlFVRkZMRTFCUVdNN1VVRkRja01zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRVZCUVVVc1RVRkJUU3hEUVVGRExFTkJRVU03U1VGRE5VSXNRMEZCUXp0SlFVVkVMRXRCUVVzc1EwRkJReXhoUVVGaE8xRkJRMmhDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTTdVVUZGTDBRc1VVRkJVU3hKUVVGSkxFVkJRVVVzUTBGQlF6dFpRVU5hTEV0QlFVc3NUMEZCVHp0blFrRkRWQ3hOUVVGTk8xbEJRMVFzUzBGQlN5eFBRVUZQTzJkQ1FVTlVMRTFCUVUwN1dVRkRWQ3hMUVVGTExFVkJRVVU3WjBKQlEwb3NUVUZCVFR0WlFVTlVMRkZCUVZFN1VVRkRXQ3hEUVVGRE8wbEJRMG9zUTBGQlF6dEpRVVZFTEZsQlFWa3NRMEZCUXl4TFFVRmhMRVZCUVVVc1MwRkJZU3hGUVVGRkxGZEJRVmNzUjBGQlJ5eExRVUZMTEVWQlFVVXNTVUZCU1N4SFFVRkhMRWxCUVVrc1JVRkJSU3hQUVVGUExFZEJRVWNzUlVGQlJTeEZRVUZGTEZGQlFXTTdVVUZEZEVjc1NVRkJTU3hWUVVGVkxFZEJRVWNzVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF6dFJRVU12UXl4SlFVRkpMRTFCUVUwc1IwRkJSeXhSUVVGUkxFTkJRVU1zWVVGQllTeERRVUZETEZWQlFWVXNRMEZCYzBJc1EwRkJRenRSUVVOeVJTeE5RVUZOTEVOQlFVTXNVMEZCVXl4SFFVRkhMRXRCUVVzc1EwRkJRenRSUVVWNlFpeEpRVUZKTEVsQlFVa3NSVUZCUlN4RFFVRkRPMWxCUTFJc1NVRkJTU3hYUVVGWExFZEJRVWNzVVVGQlVTeERRVUZETEdGQlFXRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRaUVVOb1JDeFhRVUZYTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenRaUVVOMlFpeE5RVUZOTEVOQlFVTXNVMEZCVXl4SFFVRkhMRmRCUVZjc1EwRkJReXhUUVVGVExFZEJRVWNzUzBGQlN5eERRVUZETzFsQlJXcEVMRXRCUVVzc1NVRkJTU3hUUVVGVExFbEJRVWtzVDBGQlR5eEZRVUZGTEVOQlFVTTdaMEpCUXpkQ0xFMUJRVTBzUTBGQlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlF6VkRMRU5CUVVNN1VVRkRTaXhEUVVGRE8yRkJRMGtzUTBGQlF6dFpRVU5JTEUxQlFVMHNRMEZCUXl4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRelZDTEVOQlFVTTdVVUZGUkN4TlFVRk5MRU5CUVVNc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVU55UWl4TlFVRk5MRU5CUVVNc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVVZ5UWl4SlFVRkpMRkZCUVZFc1JVRkJSU3hEUVVGRE8xbEJRMW9zVVVGQlVTeERRVUZETEUxQlFVMHNSVUZCUlN4TFFVRkxMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGRGJFTXNRMEZCUXp0UlFVVkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnBDTEVOQlFVTTdTVUZGUkRzN08wMUJSMFU3U1VGRFJpeEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRlpPMUZCUTJoQ0xFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVNeFFpeERRVUZESW4wPSIsCiAgICAiaW1wb3J0IHsgQmFzZUNsYXNzIH0gZnJvbSBcImJhc2UtY2xhc3MtdHMvQmFzZUNsYXNzXCI7XG5leHBvcnQgY2xhc3MgTXlDbGFzcyBleHRlbmRzIEJhc2VDbGFzcyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiSGVsbG8gd29ybGRcIik7XG4gICAgfVxufVxuQmFzZUNsYXNzLnN0YXJ0V2hlblJlYWR5KE15Q2xhc3MpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lKcGJtUmxlQzUwY3lKZExDSnVZVzFsY3lJNlcxMHNJbTFoY0hCcGJtZHpJam9pUVVGQlFTeFBRVUZQTEVWQlFVTXNVMEZCVXl4RlFVRkRMRTFCUVUwc2VVSkJRWGxDTEVOQlFVRTdRVUZIYWtRc1RVRkJUU3hQUVVGUExFOUJRVkVzVTBGQlVTeFRRVUZUTzBsQlJXeERPMUZCUTBrc1MwRkJTeXhGUVVGRkxFTkJRVU03VVVGRFVpeFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMR0ZCUVdFc1EwRkJReXhEUVVGQk8wbEJRemxDTEVOQlFVTTdRMEZEU2p0QlFVVkVMRk5CUVZNc1EwRkJReXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTWlmUT09IgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUFPLE1BQU0sVUFBVTtBQUFBLEVBQ25CLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLHFCQUFxQjtBQUFBLEVBQ3JCLGNBQWMsSUFBSTtBQUFBLEVBQ2xCLGNBQWMsU0FBUyxlQUFlLGFBQWE7QUFBQSxFQUNuRCxTQUFTLFNBQVMsZUFBZSxRQUFRO0FBQUEsRUFDekMsY0FBYyxTQUFTLGVBQWUsYUFBYTtBQUFBLEVBQ25ELGdCQUFnQixTQUFTLGVBQWUsZUFBZTtBQUFBLEVBQ3ZELGVBQWUsU0FBUyxlQUFlLGNBQWM7QUFBQSxFQUNyRDtBQUFBLFNBQ08sY0FBYztBQUFBLEVBQ3JCLFdBQVcsR0FBRztBQUFBO0FBQUEsU0FFUCxjQUFjLENBQUMsZ0JBQWdCLFdBQVc7QUFDN0MsV0FBTyxpQkFBaUIsVUFBVSxhQUFhLENBQUMsVUFBVTtBQUN0RCxVQUFJO0FBQ0EsWUFBSSxXQUFXLElBQUk7QUFDbkIsWUFBSSxXQUFXO0FBQ1gsbUJBQVMsV0FBVztBQUFBLFFBQ3hCO0FBQUEsZUFFRyxPQUFQO0FBQ0ksZ0JBQVEsTUFBTSxLQUFLO0FBQUE7QUFBQSxLQUUxQjtBQUFBO0FBQUEsT0FLQyxjQUFhLEdBQUc7QUFDbEIsU0FBSyxlQUFlLFNBQVM7QUFBQTtBQUFBLEVBS2pDLFVBQVUsR0FBRztBQUNULFFBQUksTUFBTSxJQUFJLElBQUksT0FBTyxTQUFTLElBQUk7QUFDdEMsUUFBSSxhQUFhLElBQUk7QUFBQTtBQUFBLE9Bb0JuQixPQUFNLENBQUMsS0FBSyxVQUFVLE1BQU0sT0FBTyxNQUFNO0FBQzNDLFFBQUksV0FB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QUFPLFlBQVksWUFBWSxZQUFZO0FBQzNDLGVBQVMsYUFBYSxTQUFTO0FBQzNCLGVBQU8sVUFBVSxJQUFJLFFBQVEsVUFBVTtBQUFBLE1BQzNDO0FBQUEsSUFDSixPQUNLO0FBQ0QsYUFBTyxZQUFZO0FBQUE7QUFFdkIsV0FBTyxRQUFRO0FBQ2YsV0FBTyxRQUFRO0FBQ2YsUUFBSSxVQUFVO0FBQ1YsZUFBUyxRQUFRLE9BQU8sS0FBSztBQUFBLElBQ2pDO0FBQ0EsV0FBTztBQUFBO0FBQUEsRUFNWCxHQUFHLElBQUksUUFBUTtBQUNYLFlBQVEsSUFBSSxHQUFHLE1BQU07QUFBQTtBQUU3Qjs7O0FDeGtCTyxNQUFNLGdCQUFnQixVQUFVO0FBQUEsRUFDbkMsV0FBVyxHQUFHO0FBQ1YsVUFBTTtBQUNOLFlBQVEsSUFBSSxhQUFhO0FBQUE7QUFFakM7QUFDQSxVQUFVLGVBQWUsT0FBTzsiLAogICJkZWJ1Z0lkIjogIjBFNTJBNkE5QjQ3QjY3OUI2NDc1NkUyMTY0NzU2RTIxIiwKICAibmFtZXMiOiBbXQp9
