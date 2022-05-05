const puppeteer = require('puppeteer')
const IP = process.argv[2]

const browserInABox = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        //dumpio: true,
        args: [
            '--disable-dev-shm-usage',
            '--incognito',
            "--full-memory-crash-report",
            "--enable-precise-memory-info",
            "--unlimited-storage",
            "--max_old_space_size=131.072",
            '--js-flags="--max-old-space-size=131.072"'//32768
        ]
    })
    const page = await browser.newPage()
    await page.goto(`https://${IP}/`)
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )

    let input = await page.$('#signal_server');
    await input.click({ clickCount: 3 })
    await input.type(`/dns4/${IP}/tcp/2002/wss/p2p-webrtc-star/`)
    input = await page.$('#pinner_host');
    await input.click({ clickCount: 3 })
    await input.type(IP)
    input = await page.$('#bootstrap');
    await input.click({ clickCount: 3 })
    await input.type(`/ip4/${IP}/tcp/4002/wss/p2p/12D3KooWFm8MiFfXCGyj1ZiJZevYcnFUiWcQqAmYQVEeJqckwkww`)

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);

}

browserInABox()



