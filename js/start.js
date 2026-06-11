const params = new URLSearchParams(window.location.search);

if (params.get("flow") || params.get("level") || params.get("step")) {
  const redirect = new URLSearchParams(params);
  if (!redirect.get("ver")) redirect.set("ver", "3");
  window.location.replace(buildPageUrl("app.html", Object.fromEntries(redirect)));
}

document.getElementById("pickV2").href = buildAppUrl({ ver: "2", step: "flow" });
document.getElementById("pickV3").href = buildAppUrl({ ver: "3", step: "flow" });
