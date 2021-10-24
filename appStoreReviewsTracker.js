// npm install request
// npm install cron
// npm nodemailer
// node appStoreReviewsTracker.js
const request = require('request'); // Request is designed to be the simplest way possible to make http calls.
const CronJob = require('cron').CronJob;//The node-cron module is tiny task scheduler in pure JavaScript for node.js based on GNU crontab. 
//This module allows you to schedule task in node.js using full crontab syntax.
const nodemailer = require('nodemailer');//Nodemailer is a module for Node.js applications to allow easy as cake email sending.

async function fetchReviews(app, country, page) {
 
    let url = 'http://itunes.apple.com/rss/customerreviews/page=' + page + '/id=' + app + '/sortby=mostrecent/json?cc=' + country;

    return new Promise((resolve, reject) => {
        let reviews = [];
        request(url, function(err, res, body) {

            if(!err && res.statusCode == 200) {
                let jsonData = JSON.parse(body);
                let entry = jsonData['feed']['entry'];

                for (const rawReview of entry) {
                    try
                    {		
                        let comment = {};
                        comment['id'] = rawReview['id']['label'];
                        comment['author'] = rawReview['author']['name']['label'];
                        comment['version'] = rawReview['im:version']['label'];
                        comment['rate'] = rawReview['im:rating']['label'];
                        comment['title'] = rawReview['title']['label'];
                        comment['comment'] = rawReview['content']['label'];

                        reviews.push(comment);
                    }
                    catch (err) 
                    {
                        console.log(err);
                        reject(err);
                    }
                }
                resolve(reviews);
            } else {
                reject(err);
            }
        });
    });
}


const appId = '389801252'; //app id in AppStore    Linkedin : 288429040     Twitter : 333903271    Instagram : 389801252
const page = '1';
const countryCode = 'ind';

lastReviewId = '5472553317';

async function startMonitoring() {
    let newReviews = [];

    try {
        let allReviews = await fetchReviews(appId, countryCode, page);
        if (allReviews.length > 0) {
            if (lastReviewId === 0) {
                lastReviewId = allReviews[0]['id'];
            } else {
                for (const review of allReviews) {
                    if(review['id'] === lastReviewId) {
                        break;
                    } else {
                        newReviews.push(review);
                    }
                }
            }
        }
    } catch (err) {

    }

    if(newReviews.length >  0) {
        sendNotification(newReviews);
    }
    console.log("We got " + newReviews.length + " new reviews.");
}

async function sendNotification(reviews) {

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '**********@gmail.com',
        pass: '*****'
      }
    });
  
    let textToSend = 'You got ' + reviews.length + ' new reviews';
    let htmlText = ""
  
    for (const review of reviews) {
      htmlText += "<b>" + review.title + "</b>"
      htmlText += "<p>" + review.comment + "</p>"
    }
  
    let info = await transporter.sendMail({
      from: '"Reviews Notifier" <**********@gmail.com>',
      to: "*************@gmail.com",
      subject: "New Reviews!", 
      text: textToSend,
      html: htmlText
    });
  
    console.log("Message sent: %s", info.messageId);
}

let job = new CronJob('*/30 * * * * *', function() { //runs every 30 seconds in this config
    startMonitoring();
  }, null, true, null, null, true);
job.start();
