const url = "https://wall2.sli.do/event/2dwz6re4";
const osc_ip = '172.20.105.181';
const osc_port = 9000;


const puppeteer = require('puppeteer');
const { Client } = require('node-osc');
const osc_client = new Client(osc_ip, osc_port);
const percentagesSelector = '.poll-question-option__bar__label span';
const namesSelector = '.poll-question-option__title';

(async () => {
  const browser = await puppeteer.launch();
  const page = await init_page(browser);


  while(true) {
    var names = await get_names(page);

    if(!new_percentages) {
      var current_percentages = {};
      names.forEach(function(el) {
        current_percentages[el] = 0.5;
      });
    }

    var new_percentages = await get_percentages(page, names);

    console.log(current_percentages);

    
    osc_client.send('/composition/layers/1/clips/1/video/source/shapergenerator/shaper/scale', new_percentages[names[0]]);
    osc_client.send('/composition/layers/2/clips/1/video/source/shapergenerator/shaper/scale', new_percentages[names[1]]);
    osc_client.send('/composition/layers/3/clips/1/video/source/shapergenerator/shaper/scale', new_percentages[names[2]]);

    
  }
  

  
  


  await browser.close();
  osc_client.close();
})();


async function init_page(browser) {
  var page = await browser.newPage();
  await page.goto(url, {waitUntil: 'networkidle0'});
  return page;
}

async function get_names(page) {
  var names = await page.evaluate(namesSelector => {
    var anchors = Array.from(document.querySelectorAll(namesSelector));
    return anchors.map(anchor => {
        return anchor.textContent.trim();
    });
  }, namesSelector);
  names = names.sort();

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

    var sorted = {};
    Object.keys(result).sort().forEach(function(key) {
      sorted[key] = result[key];
    });

    return sorted;
}