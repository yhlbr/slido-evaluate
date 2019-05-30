const url = "https://wall2.sli.do/event/kijvny1l";
const osc_ip = '172.20.105.133';
const osc_port = 9001;
const osc_endpoint = '/composition/layers/%d/clips/7/video/effects/transform/scale';

const util = require('util');
const puppeteer = require('puppeteer');
const { Client } = require('node-osc');
const osc_client = new Client(osc_ip, osc_port);
const percentagesSelector = '.poll-question-option__bar__label span';
const namesSelector = '.poll-question-option__title';

(async () => {
  const browser = await puppeteer.launch();
  const page = await init_page(browser);

  var names = [];

  while(true) {
    if(names.length <= 0) {
      names = await get_names(page);
      continue;
    }

    names = await get_names(page);


    if(!new_percentages) {
      var current_percentages = {};
      names.forEach(el => {
        current_percentages[el] = 0.5;
      });
    }

    var new_percentages = await get_percentages(page, names);
    new_percentages = sort_obj_by_keys(new_percentages);
    current_percentages = sort_obj_by_keys(current_percentages);
    var current_percentages = smooth_percentages(current_percentages, new_percentages);

    Object.keys(current_percentages).forEach((name, idx) => {
      var endpoint = util.format(osc_endpoint, idx + 4);
      osc_client.send(endpoint, current_percentages[name]);
    });
    console.log(current_percentages);
    

    await sleep(5);
  }
  

  await browser.close();
  osc_client.close();
})();


async function init_page(browser) {
  var page = await browser.newPage();
  await page.goto(url, {waitUntil: 'load'});
  return page;
}

async function get_names(page) {
  var names = await page.evaluate(namesSelector => {
    var anchors = Array.from(document.querySelectorAll(namesSelector));
    return anchors.map(anchor => {
        return anchor.textContent.trim();
    });
  }, namesSelector);

  return names;
}


async function get_percentages(page, names) {
    var result = {};

    var percentages = await page.evaluate(percentagesSelector => {
      var anchors = Array.from(document.querySelectorAll(percentagesSelector));
      return anchors.map(anchor => {
          return parseFloat(anchor.textContent.replace('%', '')) / 100;
      });
    }, percentagesSelector);

    names.forEach(function(el, idx) {
      result[el] = percentages[idx];
    });

    return result;
}

function smooth_percentages(current_percentages, new_percentages) {
  Object.keys(new_percentages).forEach(key => {
    if(current_percentages[key] < new_percentages[key]) {
      current_percentages[key] += 0.005;
    } else if(current_percentages[key] > new_percentages[key]) {
      current_percentages[key] -= 0.005;
    }
    current_percentages[key] = Math.round(current_percentages[key] * 1000) / 1000;
  });
  return current_percentages;
}


async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sort_obj_by_keys(obj) {
  var sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = obj[key];
  });

  return sorted;
}