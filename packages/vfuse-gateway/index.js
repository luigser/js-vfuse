const VFuseGateway = require('./src')

const main = async () => {
    let node = await VFuseGateway.create({
       // profileId : 'QmU13jxZXrTmpgodotGGNMdCre2BKfmqPyHdHWGh7vmJ5e',
        bootstrapNodes : [],
        //ipfsClusterApi : '/ip4/192.168.1.57/tcp/9096',
        ipfs: {
            Identity:{
                PeerID: "QmXsvkMinTrQuHToVVGz9YXmP5HmCnwfkjyCn7P4gJybsn"//this.profileId
            },
            identity: {
                peerId: {
                    id: "QmXsvkMinTrQuHToVVGz9YXmP5HmCnwfkjyCn7P4gJybsn",
                    privKey: "CAASqAkwggSkAgEAAoIBAQC/bjcWvf16PBPX9jnzZDRKJe1xLQGsbvng7g9iXOXPAwCdnYKJRVJ3SPAz4UikgNtN0KQppT5Ic8Wfcm/PXsVuMdEabqHzrbexpbkydZ+ZAYO4tX6Ph+2BaDG0UJOvSirv+BRa2xrrkeaVDNLsNjDLpnwgZCf/7llKbQ2dzi9A+cnpHQ7h56VtXlx7cdMyeF9IEEUTcB0QguxGKuscQ7L+HCGru9rZdCHKYkDI/nwaLrOg84O2JNs516FEMqf2yAqCnNrlXC2SQy3hcXiKEJMZm/DefkY/NR+OZM4yTnyJoqfwrPqbmPcHKSdnNB0bFKpyfnRqrGKJJxcMrUkkwE91AgMBAAECggEAXMc7Fd+hAWQqremdbpQrL6CwMsEAZaUnoFdgx2iEzM8Etl9Hi+Y4MK3+FPbj8S6um0k6tyBqTk0mA8A/5n5lK6IjWS8zeNnCBOxwFL+jSVHNmHEGVOQpPSXVqTHAUh2dL87JdrtokbGV0rlzZJ5jCeC3mi9Qn57SUdsG1Wu/xTozRDAemTiaSN0m8O0wf6SPUe+FEfZiANrF7mTxhxgcjtCiVF9PGJqszw/48NfoVFwcu9+Dk7+9x4btazn0F2djffwuGSxosntVr0m25/ZaXWbNNhfaJm6RC3crG5Hw4/L78PMIvJb8aEun+nHr3Aq0AIg6h2cCzCVRFJf15Og+QQKBgQD2t8IVuUWdWP/i5busm49vDTLd1VUj4R9n0O44cTST/7xb3BPSNGUFcdZtQwSkfN/j14gQpEkfDFOCe+h3GTzm+tegV/hHnv7YCobVPFKjZl++yySaCGC+yeehRTYu+E84cF7RnSySAZ0uCmwDIEZLO0bZH6CB9amylhnc/OV+MQKBgQDGofZXeHJKOMFJ0HtT4uVux3vM5Uad7F27dskbQB4v++wjniw7re9BaA4H0vzOi5CeSMboQWyQQBR2MlHzJkMiZBOh+r+DiMQScHmCsE9UnhXNZx9JTagswAGNIwWd7od6VX4PuL/mrwiVMA0ZGfwLvVQhHodC73Mx8h1P07HAhQKBgQC/8YjK8+BIIVS7BvZyvHfj8wXO9kkN5/hSAYdEXDaGqiC16st075RknwMu8EPtYMWi8i0GnXnR8PoLezEJb5YlMaSON8KOnhEwrUfnH84/F8eHnW31dG0oIdbWbg1Qj5i6lRn/xGNHmH/bsPoFmJd3sj9VbrimQyTqLsMiXZKCEQKBgQC3otLpSTx4bAIeqPTrt/AfO6Oz6SAhLn31qzr/y4ZdHE3THA+O2R5B3N5j02bP2W3JOEVUQfAJaITCRYFIB063w8f2z6gxBccnuP5NmYyuETzc2gKttXLOdHC6t+8gdH6h1dom1MntjlKkAnmJhGFlxRK7T8sDUfaw7UK2I2PJNQKBgEG1AwtZadrymoGzOhZJTDGCGWN6deR9Oe1QfRsOPP3W7/CdI/cSIOF+AGCeukO1dV3sXtKkWllwzr5JlGxwW6W5ntY0+pLN8oyGSZzzjDDaiE9R4++K8PK1CwAl3HT8nO/73x0+QwgD5j/NGs1Y3geNjUTlgpvjhfg9705p08pL",
                    pubKey: "CAASpgIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC/bjcWvf16PBPX9jnzZDRKJe1xLQGsbvng7g9iXOXPAwCdnYKJRVJ3SPAz4UikgNtN0KQppT5Ic8Wfcm/PXsVuMdEabqHzrbexpbkydZ+ZAYO4tX6Ph+2BaDG0UJOvSirv+BRa2xrrkeaVDNLsNjDLpnwgZCf/7llKbQ2dzi9A+cnpHQ7h56VtXlx7cdMyeF9IEEUTcB0QguxGKuscQ7L+HCGru9rZdCHKYkDI/nwaLrOg84O2JNs516FEMqf2yAqCnNrlXC2SQy3hcXiKEJMZm/DefkY/NR+OZM4yTnyJoqfwrPqbmPcHKSdnNB0bFKpyfnRqrGKJJxcMrUkkwE91AgMBAAE="
                }
            }
        }
    })
    //console.log(node.node.profile)
    //await node.createWorkflow()
    /*await node.addJob(
        0,
        `import numpy as np
a = [[22, 0], [0, 2]]
b = [[41, 1], [28, 2]]
c = np.dot(a, b)
print(c)`,
        [],
        []
    )*/
    /*let stat = await node.node.net.stat('/workflows/1/jobs')
    console.log({stat})*/
}

main()