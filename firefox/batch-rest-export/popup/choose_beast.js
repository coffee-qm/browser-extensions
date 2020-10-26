$(document).ready(function () {
  $("#query_param").change(() => {
    // do something ...
  });
});
/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    /**
     * Send message to the content script in the active tab.
     */
    function fn_execute(tabs) {
      if ($("#query_param").val() == "") {
        $('<div title="Error">请输入查询条件</div>').dialog();
        return;
      }
      browser.tabs.sendMessage(tabs[0].id, {
        command: "execute",
        params: {
          tels: $("#query_param").val(),
          export: {
            name: $("#export_name").val(),
            heads: $("#export_heads").val(),
          },
        },
      });
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not fn_execute: ${error}`);
    }

    /**
     * Get the active tab, then call "fn_execute()" as appropriate.
     */
    if (e.target.classList.contains("beast")) {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(fn_execute)
        .catch(reportError);
    }
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/beastify.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
