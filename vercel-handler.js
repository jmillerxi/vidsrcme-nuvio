// vercel-handler.js
// Vercel uses this file to run the addon as a serverless function.
// You don't need to edit this file.

const addonInterface = require("./index.js");
const { getRouter }  = require("stremio-addon-sdk");

const router = getRouter(addonInterface);

module.exports = function (req, res) {
  router(req, res, function () {
    res.statusCode = 404;
    res.end();
  });
};
