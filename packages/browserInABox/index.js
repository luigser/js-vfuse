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

    await page.evaluate(val =>
            document.querySelector('#signal_server').value = val,
        `/dns4/${IP}/tcp/2002/wss/p2p-webrtc-star/`
    );

    await page.evaluate(val =>
            document.querySelector('#pinner_host').value = val,
        IP
    );

    await page.evaluate(val =>
            document.querySelector('#bootstrap').value = val,
        `/ip4/${IP}/tcp/4002/wss/p2p/12D3KooWFm8MiFfXCGyj1ZiJZevYcnFUiWcQqAmYQVEeJqckwkww`
    );

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);
}

browserInABox()



