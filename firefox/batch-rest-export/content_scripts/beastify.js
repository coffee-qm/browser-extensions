(function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
  /**
   * 通用的打开下载对话框方法，没有测试过具体兼容性
   * @param url 下载地址，也可以是一个blob对象，必选
   * @param saveName 保存文件名，可选
   */
  function openDownloadDialog(url, saveName) {
    if (typeof url == "object" && url instanceof Blob) {
      url = URL.createObjectURL(url); // 创建blob地址
    }
    var aLink = document.createElement("a");
    aLink.href = url;
    aLink.download = saveName || ""; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
    var event;
    if (window.MouseEvent) event = new MouseEvent("click");
    else {
      event = document.createEvent("MouseEvents");
      event.initMouseEvent(
        "click",
        true,
        false,
        window,
        0,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null
      );
    }
    aLink.dispatchEvent(event);
  }
  // 将一个sheet转成最终的excel文件的blob对象，然后利用URL.createObjectURL下载
  function sheet2blob(sheet, sheetName) {
    sheetName = sheetName || "Sheet1";
    var workbook = {
      SheetNames: [sheetName],
      Sheets: {},
    };
    workbook.Sheets[sheetName] = sheet;
    // 生成excel的配置项
    var wopts = {
      bookType: "xlsx", // 要生成的文件类型
      bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
      type: "binary",
    };
    var wbout = XLSX.write(workbook, wopts);
    var blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
    // 字符串转ArrayBuffer
    function s2ab(s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }
    return blob;
  }
  /**
   * fn_cmd_execute
   */
  function fn_cmd_execute(params) {
    console.info("Execute params:" + JSON.stringify(params));
    console.info("jQuery in use:" + $("body").size());
    var _tels = params["tels"];
    var _tels_arr = _tels.split(",");
    var _data = new Array();
    _data.push(params["export"]["heads"].split(","));
    for (var _i = 0; _i < _tels_arr.length; _i++) {
      $.ajax({
        url: "https://baike.baidu.com/",
        dataType: "text",
        type: "GET",
        async: false,
        success: function (resp) {
          var _row = new Array();
          _row.push(_i);
          _row.push(_tels_arr[_i]);
          _data.push(_row);
        },
        error: function (err) {
          console.error(err);
        }
      });
    }
    console.info("Export rows count:" + (_data.length - 1));
    // export xlsx
    var sheet = XLSX.utils.aoa_to_sheet(_data);
    openDownloadDialog(sheet2blob(sheet), params["export"]["name"] + ".xlsx");
  }

  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "execute") {
      fn_cmd_execute(message.params);
    }
  });
})();
