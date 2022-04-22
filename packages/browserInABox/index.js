const puppeteer = require('puppeteer')
const IP = process.argv[2]

const browserInABox = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        args: ['--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    await page.goto(`https://${IP}/`)
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )

    /*await page.evaluate(async ip => {
        document.querySelector('#signal_server').value = `/dns4/${ip}/tcp/2002/wss/p2p-webrtc-star/`
        document.querySelector('#pinner_host').value = ip
        document.querySelector('#bootstrap').value = `/ip4/${ip}/tcp/4002/wss/p2p/12D3KooWFm8MiFfXCGyj1ZiJZevYcnFUiWcQqAmYQVEeJqckwkww`
        document.querySelector('#start_node').click()
    },IP);*/

    await page.type('#signal_server', `/dns4/${IP}/tcp/2002/wss/p2p-webrtc-star/`)
    await page.type('#pinner_host', IP)
    await page.type('#bootstrap', `/ip4/${IP}/tcp/4002/wss/p2p/12D3KooWFm8MiFfXCGyj1ZiJZevYcnFUiWcQqAmYQVEeJqckwkww`)

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);

}

browserInABox()



