const puppeteer = require('puppeteer')
const IP = process.argv[2]

const browserInABox = async () => {
    const browser = await puppeteer.launch({ ignoreHTTPSErrors: true })
    const page = await browser.newPage()
    await page.goto(`https://${IP}`)
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )
    let signal_server = await page.waitForSelector('#signal-server')
    await page.type('#signal_server', `/ip4/${IP}/tcp/2000/ws/p2p-webrtc-star`)
    let pinner_host = await page.waitForSelector('#pinner_host');
    await page.type('#pinner_host', `${IP}`)
    let bootstrap = await page.waitForSelector('#bootstrap');
    await page.type('#bootstrap', `/ip4/${IP}/tcp/4003/ws/p2p/12D3KooWRKxogWN84v2d8zWUexowJ2v6iGQjkAL9qYXHuXrf9DLY`)

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);
    //await page.screenshot({ path: '1-vfuse.png' });
}

browserInABox()



