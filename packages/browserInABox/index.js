const puppeteer = require('puppeteer')

const browserInABox = async () => {
    const browser = await puppeteer.launch({ ignoreHTTPSErrors: true })
    const page = await browser.newPage()
    await page.goto('https://193.205.161.5')
    page.on('console', message =>
            console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);
    await page.screenshot({ path: '1-vfuse.png' });
}

browserInABox()



