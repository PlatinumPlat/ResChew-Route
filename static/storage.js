(function () {
    if (location.protocol !== "file:") return;

    const banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.style.cssText =
        "position:sticky;top:0;z-index:9999;background:#7a1f1f;color:#fff;padding:10px 16px;font:14px/1.4 system-ui,sans-serif;text-align:center;";
    banner.textContent =
        "Open these pages through a local server (for example: python3 -m http.server from the project folder) so restaurant, food bank, and delivery share the same food posts.";

    function showBanner() {
        if (document.body && !document.getElementById("file-protocol-warning")) {
            banner.id = "file-protocol-warning";
            document.body.prepend(banner);
        }
    }

    if (document.body) showBanner();
    else document.addEventListener("DOMContentLoaded", showBanner);
})();
