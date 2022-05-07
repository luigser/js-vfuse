const {isBrowser} = require("browser-or-node");
const { CID } = require('multiformats/cid')
//const { base64 } = require("multiformats/bases/base64")
const ldb = isBrowser ? require("localdata") : null
const fflate = require('fflate')

class ContentManager{
    constructor(networkManager, eventManager, options){
        this.networkManager = networkManager
        this.eventManager = eventManager
        this.options = options
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
            if((this.options && this.options.localStorage) && (!options || (options && !options.net) )){
                return Promise.resolve(this.ls_save(path, content))
            }
            let cid = await this.networkManager.writeFile(path, JSON.stringify(content), {...{create : true, parents: true, mode: parseInt('0775', 8), truncate: true, cidVersion: 1}, ...options})
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
            if((this.options && this.options.localStorage) && (!options || (options && !options.net) )){
                return Promise.resolve(this.ls_get(path))
            }
            return JSON.parse(await this.networkManager.readFile(path, options))
        }catch(e){
            return null
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

    async list(path, options){
        try{
            if((this.options && this.options.localStorage) && (!options || (options && !options.net) )){
                return Promise.resolve(this.ls_list(path))
            }
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
            if((this.options && this.options.localStorage) && (!options || (options && !options.net) )){
                return Promise.resolve(this.ls_delete(path))
            }
            return await this.networkManager.deleteFile(path, options)
        }catch(e){
            console.log('Got some error deleting file : %O', e)
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

    async saveOnIpfs(data){
        try{
            return await this.networkManager.addAndPin(data)
        }catch (e) {
            console.log('Error fetching data from url : %O', e)
        }
    }

    //local storage

    ls_set_compressed(key, value){
        return new Promise( (resolve, reject) => {
            ldb.set(key, fflate.zlibSync((new TextEncoder().encode(JSON.stringify(value))), {level: 6}), function(){
                resolve(true)
            });
        })
    }

    ls_get_compressed(key){
        return new Promise( (resolve, reject) => {
            ldb.get(key, function(value){
                resolve(JSON.parse(Buffer.from(fflate.unzlibSync(value)).toString()))
            });
        })
    }

    async_ls_delete(key){
        return new Promise( (resolve, reject) => {
            ldb.delete(key, function () {
                resolve(true)
            });
        })
    }

    async ls_list(key){
        //get json array of keys for files
        try {
            return await this.ls_get_compressed(key)
        }catch (e) {
            console.log('Error listing data in local storage : %O', e)
            return Promise.reject([])
        }
    }

    async ls_save(key, value){
        //get something like /workflows/published/my/workflow.json as key
        try {
            let key_parts = key.split('/')
            let file_key = key_parts[key_parts.length - 1]
            let dir_key = key.replace(`/${file_key}`, '')
            let current_dir_content = await this.ls_get_compressed(dir_key)
            current_dir_content = !current_dir_content ? [] : current_dir_content
            if(!current_dir_content.includes(file_key))
                current_dir_content.push(file_key)
            await this.ls_set_compressed(dir_key, current_dir_content)
            await this.ls_set_compressed(key, value)
            return true
        }catch (e) {
            console.log('Error saving data in local storage : %O', e)
            return Promise.reject(false)
        }
    }

    async ls_get(key){
        try {
            return await this.ls_get_compressed(key)
        }catch (e) {
            console.log('Error getting data in local storage : %O', e)
            return Promise.reject(null)
        }
    }

    async ls_delete(key) {
        try {
            let key_parts = key.split('/')
            let file_key = key_parts[key_parts.length - 1]
            let dir_key = key.replace(`/${file_key}`, '')
            let current_dir_content = await this.ls_get_compressed(dir_key)
            current_dir_content = !current_dir_content ? [] : current_dir_content
            if(current_dir_content.includes(file_key))
                current_dir_content = current_dir_content.filter( c => c !== file_key)
            await this.ls_set_compressed(dir_key, current_dir_content)
            await this.async_ls_delete(key)
            return true
        } catch (e) {
            console.log('Error getting data in local storage : %O', e)
            return Promise.reject(false)
        }
    }

    ls_makeDir(key){
        try {
            return new Promise( (resolve, reject) => {
                ldb.set(key, JSON.stringify([]) ,function () {
                    resolve(true)
                });
            })
        } catch (e) {
            console.log('Error getting data in local storage : %O', e)
            return Promise.reject(false)
        }

    }
}

module.exports = ContentManager
