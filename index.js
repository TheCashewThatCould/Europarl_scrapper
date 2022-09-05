const puppeteer = require('puppeteer')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const fsPromises = require('fs').promises;
const path = require('path');
async function main(){
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--window-size=1920,1080',
        ]
      });
    const page = await browser.newPage();
    const url = `https://www.europarl.europa.eu/RegistreWeb/search/simpleSearchHome.htm?languages=EN&sortAndOrder=DATE_DOCU_DESC`;
    await page.goto(url);
    await sleep(12000)
    var num = 1
    /*
    while(true){
        try{
            await page.click('#results > div.separator.separator-dotted.separator-2x.mt-5.mb-5 > div')
            console.log(num)
            num+=1
        }
        catch(err){
            break
        }
        await sleep(2000)
    }*/
    const results = await page.$$('div.erpl_search-results-item')
    var pdf_urls = []
    for(let i = 0;i < results.length; i++){
        try{
            const result = await results[i].$eval('div > div > span', x => x.textContent)
            const param = result.split(" ")[0]
            const params = {
                name: param
            }
            //console.log(param)    
           // console.log(result)
            const pdfs = await page.evaluate(async (param) => {
                return await new Promise(async (resolve, reject) => {
                  const response = await fetch(`https://www.europarl.europa.eu/RegistreWeb/services/search/reference?name=${param}`, {
                    "headers": {
                      "accept": "application/json",
                      "accept-language": "en-US,en;q=0.9",
                      "cache-control": "no-cache",
                      "pragma": "no-cache",
                      "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
                      "sec-ch-ua-mobile": "?0",
                      "sec-ch-ua-platform": "\"Windows\"",
                      "sec-fetch-dest": "empty",
                      "sec-fetch-mode": "cors",
                      "sec-fetch-site": "same-origin"
                    },
                    "referrer": "https://www.europarl.europa.eu/RegistreWeb/search/simpleSearchHome.htm?languages=EN&sortAndOrder=DATE_DOCU_DESC",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": null,
                    "method": "GET",
                    "mode": "cors",
                    "credentials": "include"
                  });
                  
                  const json = await response.json();
                  console.log(response)
                  console.log('json', json);
            
                  return resolve(json);
                });
              }, param);
              await sleep(2000)
              pdfs.documents.map(x => {
                if(x.codeLang==="EN"){
                    const temp = x.formatDocs
                    pdf_urls.push(temp)
                   // console.log(temp)
                }
              })
        }
        catch(err){
            console.log(err)
        }
    }
    await fsPromises.writeFile(
        './data.json',
        JSON.stringify(pdf_urls), err => {
            console.log(err)
        }
    );
    await browser.close()
}

main()