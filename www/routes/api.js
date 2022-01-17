var express = require('express');
var crypto = require('crypto');
var router = express.Router();

var enrollData = [];
var bioUser = [];


// Enroll
router.post("/enroll/request", (req, res) => {
  console.log("POST /enroll/request");
  console.log(jsonToString("REQUEST", req.body));

  const { uuid } = req.body;
  const enrollCode = randomString();
  enrollData = enrollData.concat({ uuid: uuid, enrollCode: enrollCode });

  const result = { enrollCode: enrollCode };
  res.json(result);
  console.log(jsonToString("RESPONSE", result));
});

router.post("/enroll/verify", (req, res) => {
  console.log("POST /enroll/verify");
  console.log(jsonToString("REQUEST", req.body));

  const { publicKey, enrollCode } = req.body;
  const data = enrollData.find(data => data.enrollCode == enrollCode);

  if (isEmptyOrNull(data.enrollCode)) {
    res.status(400);
    res.json({ error: "no enroll code" })
    return
  }

  bioUser = bioUser.concat({ uuid: data.uuid, publicKey: publicKey, challenge: "" });

  const result = { result: "OK" };
  res.json(result);
  console.log(jsonToString("RESPONSE", result));
});


// Challenge
router.get("/challenge/request", (req, res) => {
  const uuid = req.query.uuid;
  console.log("GET /challenge/request");
  console.log(jsonToString("REQUEST", uuid));


  var isUpdated = false;
  var challenge = randomString();
  bioUser.map(data => {
    if (data.uuid == uuid) {
      data.challenge = challenge;

      isUpdated = true;
    }
  });

  if (isUpdated) {
    const result = { challenge: challenge };
    res.json(result);
    console.log(jsonToString("RESPONSE", result));
  } else {
    res.status(400);
    res.json({ error: "no enrolled user" })
  }
});

router.post("/challenge/verify", (req, res) => {
  console.log("POST /challenge/verify");
  console.log(jsonToString("REQUEST", req.body));

  const { uuid, signedData } = req.body;
  const user = bioUser.find(data => data.uuid == uuid);

  if (isEmptyOrNull(user.publicKey)) {
    res.status(400);
    res.json({ error: "no enrolled user" })
    return
  }

  const verifier = crypto.createVerify("sha256");
  verifier.update(user.challenge);
  const isVerified = verifier.verify(user.publicKey, signedData, 'base64');
  console.log(isVerified);

  if (isVerified) {
    const result = { result: "OK" };
    res.json(result);
    console.log(jsonToString("RESPONSE", result));
  } else {
    res.status(400);
    res.json({ error: "verify fail" })
  }
});

function jsonToString(prefix, jsonStr) {
  return "=======================\n"
    + prefix + " => " + JSON.stringify(jsonStr, null, 2)
    + "\n=======================";
}

function isEmptyOrNull(str) {
  return typeof str == "undefined" || str == null || str == "";
}

function randomString() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  const stringLength = 6
  let randomstring = ''
  for (let i = 0; i < stringLength; i++) {
    const rnum = Math.floor(Math.random() * chars.length)
    randomstring += chars.substring(rnum, rnum + 1)
  }
  return randomstring
}

module.exports = router;
