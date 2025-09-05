const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const serverless = require("serverless-http");
const dotenv = require("dotenv");
dotenv.config();
var cors = require("cors");
const app = express();
const router = express.Router();

const apiKey = process.env.API_KEY;
const apiKey2 = process.env.API_KEY_BACKUP;
const apiUrl = process.env.NEWS_API_URL;

router.get("/", (req, res) => {
  res.send("App is running..");
});

router.get("/translate/fetchnews", async (req, res) => {
  try {
    let url = apiUrl;
    if (req.query.q) url += "q=" + req.query.q;
    if (req.query.country) url += "&country=" + req.query.country;
    if (req.query.category) url += "&category=" + req.query.category;
    url += `&apiKey=${apiKey}&page=${req.query.page}&pageSize=${req.query.pageSize}`;

    const response = await fetch(url);
    const data = await response.json();
    const statusCode = data.code || "";
    if (data.status === "ok") {
      res.json(data);
    } else if (
      statusCode === "apiKeyExhausted" ||
      statusCode === "rateLimited"
    ) {
      url.replace(apiKey, apiKey2);
      const response2 = await fetch(url);
      const data2 = await response2.json();
      res.json({
        ...data2,
        info: {
          search: req.query.q || null,
          country: req.query.country || null,
          category: req.query.category || null,
          page: req.query.page || null,
          pageSize: req.query.pageSize || null,
        },
      });
    } else {
      res.json({
        info: {
          ...data,
          search: req.query.q || null,
          country: req.query.country || null,
          category: req.query.category || null,
          page: req.query.page || null,
          pageSize: req.query.pageSize || null,
        },
      });
    }
  } catch (error) {
    // console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

app.use(cors());
app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);
