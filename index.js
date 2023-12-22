const fs = require('fs');
const logFile = fs.createWriteStream('./puppeteer_warnings.log', { flags: 'a' });
process.stderr.write = (chunk, encoding, callback) => {
  logFile.write(chunk, encoding, callback);
};
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const secretKey = crypto.randomBytes(64).toString('hex');
const app = express();
const PORT = process.env.PORT || 8080;
require('dotenv').config();
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const path = require('path');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/assets")));
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
const user = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    history: [{ type: String }],
});
const User = mongoose.model("User", user);
let combinedData = [];
const searchQueue = [];
let userHistory = [];
let userProfile = "";
let userEmail = "";
let p = "";
app.get("/", (req, res) => {
    p = "";
    res.render("login&register.ejs", { p });
});
app.post("/signup", async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            p = "Email already exists. Please choose a different email.";
            res.render("login&register.ejs", { p });
        } else {
            const user1 = new User({
                name: req.body.username,
                email: req.body.email,
                password: req.body.password,
            });
            await user1.save();
            p = "login again!";
            res.render("login&register.ejs", { p });
        }
    } catch (err) {
        console.error(err);
        p = "retry";
        res.render("login&register.ejs", { p });
    }
});
app.post("/signin", async (req, res) => {
    try {
        const foundUser = await User.findOne({ email: req.body.email });
        if (foundUser && foundUser.password === req.body.password) {
            req.session.userProfile = foundUser.name;
            req.session.userEmail = foundUser.email;
            req.session.userHistory = foundUser.history;
            console.log(req.session.userProfile);
            combinedData = [];
            userHistory = req.session.userHistory;
            userProfile = req.session.userProfile;
            res.render("index.ejs", { combinedData, userHistory, userProfile });
        } else {
            p = "email or password is wrong";
            res.render("login&register.ejs", { p });
        }
    } catch (err) {
        console.error(err);
        p = "An error occurred";
        res.render("login&register.ejs", { p });
    }
});
app.post("/forgot", async (req, res) => {
    try {
        const userEmail = req.body.email;
        const newPassword = req.body.password;
        const updatedUser = await User.findOneAndUpdate({ email: userEmail }, { password: newPassword });
        if (updatedUser) {
            p = 're-login';
            res.render("login&register", { p });
        } else {
            p = "email is wrong";
            res.render("login&register.ejs", { p });
        }
    } catch (err) {
        console.error(err);
        p = "An error occurred";
        res.render("login&register.ejs", { p });
    }
});
app.get("/index", async (req, res) => {
    let name = req.query.search;
    if (searchQueue.length > 0) {
        searchQueue.push({ name, req, res });
    } else {
        await processSearch(name, req, res);
    }
});
async function scrapeFlipkart(searchText,req) {
    const flipkartUrl = `https://www.flipkart.com/search?q=${searchText}`;
    const browser = await puppeteer.launch({ 
        args:[
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath: process.env.NODE_ENV === "production" 
        ? process.env.PUPPETEER_EXECUTABLE_PATH 
        : puppeteer.executablePath(),
     });
    const page = await browser.newPage();
    await page.goto(flipkartUrl);
    userProfile = req.session.userProfile;
    console.log("fetching",searchText,"for",userProfile,"from flipkart");
    const flipkartData = await page.evaluate(() => {
        const data = [];
        const products = document.querySelectorAll('div._1AtVbE.col-12-12');
        products.forEach(product => {
            const nameElement = product.querySelector('div._4rR01T, div.s1Q9rs,a.s1Q9rs,div._2WkVRV');
            const priceElement = product.querySelector('div._1_WHN1, div._30jeq3');
            const descriptionElement = product.querySelector('ul._1xgFaf, ul._3Djpdu,a.IRpwTa');
            const photoElement = product.querySelector('img._396cs4,img._2r_T1I');
            const linkElement = product.querySelector('a._1fQZEK,a._2UzuFa,a._2rpwqI,a._8VNy32');
            if (!nameElement || !priceElement || !photoElement || !linkElement) {
                console.log("Skipping iteration as data not found for a product on Flipkart.");
                return;
            }
            const name = nameElement.textContent || nameElement.title;
            const pcompany = name.split(" ")[0] ? name.split(" ")[0] : "";
            const price = priceElement.textContent;
            const description = descriptionElement ? descriptionElement.textContent : "";
            const photo = photoElement.src;
            const link = linkElement.href;
            data.push({ company: 'Flipkart', pcompany, name, price, description, photo, link });
        });
        return data;
    });
    await browser.close();
    return flipkartData;
}
async function scrapeAmazon(searchText,req) {
    const amazonUrl = `https://www.amazon.in/s?k=${searchText}`;
    const browser = await puppeteer.launch({ 
        args:[
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath: process.env.NODE_ENV === "production" 
        ? process.env.PUPPETEER_EXECUTABLE_PATH 
        : puppeteer.executablePath(),
     });
    const page = await browser.newPage();
    await page.goto(amazonUrl);
    userProfile = req.session.userProfile;
    console.log("fetching",searchText,"for",userProfile,"from amazon");
    const amazonData = await page.evaluate(() => {
        const data = [];
        const products = document.querySelectorAll('div.sg-col-20-of-24.s-result-item.s-asin.sg-col-0-of-12.sg-col-16-of-20.sg-col.s-widget-spacing-small.sg-col-12-of-16,div.sg-col-4-of-24.sg-col-4-of-12.s-result-item.s-asin.sg-col-4-of-16.sg-col.s-widget-spacing-small.sg-col-4-of-20');
        products.forEach(product => {
            const nameElement = product.querySelector('span.a-size-medium.a-color-base.a-text-normal,span.a-size-base-plus.a-color-base.a-text-normal');
            const pcompanyElement = product.querySelector(".a-size-mini.s-line-clamp-1,span.a-size-base-plus.a-color-base");
            const priceElement = product.querySelector('span.a-offscreen');
            const photoElement = product.querySelector('img.s-image');
            const linkElement = product.querySelector('a.a-link-normal.s-no-outline');
            if (!nameElement || !priceElement || !photoElement || !linkElement) {
                console.log("Skipping iteration as data not found for a product on Amazon.");
                return;
            }
            const name = nameElement.textContent;
            const pcompany = pcompanyElement ? pcompanyElement.textContent : "";
            const price = priceElement.textContent;
            const photo = photoElement.src;
            const link = linkElement.href;
            data.push({ company: 'Amazon', pcompany, name, price, photo, link });
        });
        return data;
    });
    await browser.close();
    return amazonData;
}
async function processSearch(searchText, req, res) {
    searchQueue.push({ searchText, req, res });
    const search = searchQueue.shift();
    const searchName = search ? search.searchText : undefined;
    let localCombinedData = [];
    if (searchName === undefined || searchName === '') {
        userHistory = req.session.userHistory;
        userProfile = req.session.userProfile;
        res.render("index.ejs", { combinedData: localCombinedData, userHistory, userProfile });
    } else if (localCombinedData.length !== 0 && searchName === req.session.userHistory[0]) {
        userHistory = req.session.userHistory;
        userProfile = req.session.userProfile;

        res.render("index.ejs", { combinedData: localCombinedData, userHistory, userProfile });
    } else {
        localCombinedData = [];
        const puppeteer = require('puppeteer');
        await scrapeFlipkartAndAmazon(searchName, req, res, localCombinedData);
    }
}
async function scrapeFlipkartAndAmazon(searchText, req, res, localCombinedData) {
    const flipkartData = await scrapeFlipkart(searchText,req);
    const amazonData = await scrapeAmazon(searchText,req);
    for (let i = 0; i < flipkartData.length || i < amazonData.length; i++) {
        if (flipkartData[i]) localCombinedData.push(flipkartData[i]);
        if (amazonData[i]) localCombinedData.push(amazonData[i]);
    }
    req.session.userHistory.unshift(searchText);
    try {
        const foundUser = await User.findOneAndUpdate(
            { email: req.session.userEmail },
            { $set: { history: req.session.userHistory } },
            { new: true }
        );
    } catch (err) {
        console.log(err);
    }
    userHistory = req.session.userHistory;
    userProfile = req.session.userProfile;
    res.render("index.ejs", { combinedData: localCombinedData, userHistory, userProfile });
    if (searchQueue.length > 0) {
        const { searchText, req, res } = searchQueue.shift();
        processSearch(searchText, req, res);
    }
}
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening", PORT);
    })
})