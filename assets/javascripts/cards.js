const querystring = require("querystring");
const url = require("url");

parsedUrl = url.parse(location.href);
params = querystring.parse(parsedUrl.query);
if (params.card_id) {
  const cardIDs = params.card_id;
  const cardIDsArr = cardIDs.split(",");

  for (const id of cardIDsArr) {
    const target = document.querySelector(`[name=${id}]`);
    target.classList.add("flashy");
  }
} else if (params.hashtags) {
  const hashTags = params.hashtags;

  const hashTagsArr = hashTags.split(",");

  for (var cl of hashTagsArr) {
    dcl = "div." + cl;
    const targets = document.querySelectorAll(dcl);
    for (target of targets) {
      target.classList.add("flashy");
      const tp = target.querySelector("." + cl);
      tp.classList.add("flatag");
    }
  }
} else {
  return;
}
