const puppeteer = require('puppeteer')
const IP = process.argv[2]

const browserInABox = async () => {
    const browser = await puppeteer.launch({
        headless: true,
        ignoreHTTPSErrors: true,
        //dumpio: true,
        args: [
            ' --no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--incognito',
            '--disable-infobars',
            '--full-memory-crash-report',
            '--enable-precise-memory-info',
            '--unlimited-storage',
            '--max_old_space_size=32768',
            //'-shm-size=10gb',
            '--js-flags="--max-old-space-size=32768"',//32768*/
            "--enable-precise-memory-info",
            /*'--js-flags="--expose-gc"'*/
        ]
    })
    const page = await browser.newPage()
    await page.goto(`https://${IP}/`)
    page.on('console', message =>
        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`)
    )

    //let input = await page.$('#signal_server');
    let input = await page.waitForSelector('#signal_server');
    await input.click({ clickCount: 3 })
    //await input.type(`/dns4/${IP}/tcp/2002/wss/p2p-webrtc-star/`)
    await input.type(``)
    //input = await page.$('#pinner_host');
    /*await page.waitForSelector('#pinner_host');
    await input.click({ clickCount: 3 })
    await input.type(IP)*/

    //input = await page.$('#bootstrap');
    input = await page.waitForSelector('#bootstrap');
    await input.click({ clickCount: 3 })
    await page.keyboard.press('Backspace');
    await input.type(`/dns4/${IP}/tcp/4002/wss/p2p/12D3KooWDNzDLuz5NfA44CJVPggGW9LGNELK6mucnHHoW82JdNmL\n`)

    let el = await page.waitForSelector('#start_node');
    await page.click(el._remoteObject.description);

}

browserInABox()



