const { CID } = require('multiformats/cid')
const { base64 } = require("multiformats/bases/base64")

class ContentManager{
    constructor(networkManager){
        this.networkManager = networkManager
    }

    async getKey(name){
        try{
            return await this.networkManager.getKey(name)
        }catch(e){
            console.log('Error during new key generation : %O', e)
        }
    }

    //MFS API
    async save(path, content, options){
        try{
            let cid = await this.networkManager.writeFile(path, content, {...{create : true, parents: true, mode: parseInt('0775', 8), truncate: true, cidVersion: 1}, ...options})
            if(options && options.pin){
                cid = await this.networkManager.pinFileInMFS(path)
                //cid = await this.networkManager.addToCluster(content)
            }
            return cid
        }catch(e){
            console.log('Got some error during saving : %O', e)
        }
    }

    async get(path, options){
        try{
            return await this.networkManager.readFile(path, options)
        }catch(e){
            //console.log('Got some error during getting : %O', e)
        }
    }

    async getFromNetwork(cid){
        try{
            //let pcid = CID.parse(cid)
            return await this.networkManager.cat(cid)
            //return await this.networkManager.get(cid)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    async list(path){
        try{
            return await this.networkManager.list(path)
        }catch(e){
            console.log('Got some error during getting : %O', e)
            return null
        }
    }

    async stat(path) {
        try {
            return await this.networkManager.stat(path)
        } catch (e) {
            console.log('Got some error during stat : %O', e)
        }
    }

    async update(path, options){}

    async delete(path, options){
        try{
            return await this.networkManager.deleteFile(path, options)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    async publish(cid, key, options){
        try{
            let pcid = CID.parse(cid)
            return await this.networkManager.publish(pcid, options ? options : { ttl : '72h', lifetime: '72h', key: key, resolve: false})
        }catch (e) {
            console.log('Got error during publishing : %O', e)
        }
    }

    async unpublish(cid, options){
        try{
            return await this.networkManager.unpublish(cid, options)
        }catch (e) {
            console.log('Got error during unpublishing : %O', e)
        }
    }

    async makeDir(path, options){
        try{
            await this.networkManager.makeDir(path, options ? options : { parents : true, mode: parseInt('0775', 8) })
        }catch (e) {
            console.log('Error during directory creation : % O', e)
        }
    }

    async sendOnTopic(data){
        try{
            await this.networkManager.send(data)
        }catch (e) {
            console.log('Error during sending daa on topic : %O', e)
        }
    }

    //REGULAR API

    async regularGet(path, options){
        try{
            return await this.networkManager.get(path, options)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    //General porpoise utils
    async getDataFromUrl(url, start, end, type){
        try{
            return await this.networkManager.getDataFromUrl(url, start, end, type)
        }catch (e) {
            console.log('Error fetching data from url : %O', e)
        }
    }
}

module.exports = ContentManager
