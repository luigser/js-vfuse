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
                return this.ls_save(path, content)
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
                return this.ls_get(path)
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
                return this.ls_list(path)
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
                return this.ls_delete(path)
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

    ls_list(key){
        //get json array of keys for files
        try {
            return new Promise( (resolve, reject) => {
                ldb.get(key, function (list) {
                    resolve(!list ? [] : JSON.parse(list))
                });
            })
            /*let list = localStorage.getItem(key)
            return !list ? [] : JSON.parse(list)*/
        }catch (e) {
            console.log('Error listing data in local storage : %O', e)
            return Promise.reject([])
        }
    }

    ls_save(key, value){
        //get something like /workflows/published/my/workflow.json as key
        try {
            return new Promise( (resolve, reject) => {
                let key_parts = key.split('/')
                let file_key = key_parts[key_parts.length - 1]
                let dir_key = key.replace(`/${file_key}`, '')
                ldb.get(dir_key, function (current_dir_content) {
                    current_dir_content = !current_dir_content ? [] : JSON.parse(current_dir_content)
                    if(!current_dir_content.includes(file_key))
                        current_dir_content.push(file_key)
                    ldb.set(dir_key, JSON.stringify(current_dir_content), function(){
                        ldb.set(key, JSON.stringify(value), function(){
                            resolve(true)
                        });
                    });
                });
            })
            /*let key_parts = key.split('/')
            let file_key = key_parts[key_parts.length - 1]
            let dir_key = key.replace(`/${file_key}`, '')
            let current_dir_content = localStorage.getItem(dir_key)
            current_dir_content = !current_dir_content ? [] : JSON.parse(current_dir_content)
            if(!current_dir_content.includes(file_key))
                current_dir_content.push(file_key)
            localStorage.setItem(dir_key, JSON.stringify(current_dir_content))
            localStorage.setItem(key, JSON.stringify(value))
            return true*/
        }catch (e) {
            console.log('Error saving data in local storage : %O', e)
            return Promise.reject(false)
        }
    }

    ls_get(key){
        try {
            return new Promise( (resolve, reject) => {
                ldb.get(key, function (value) {
                    resolve(JSON.parse(value))
                });
            })
            //return JSON.parse(localStorage.getItem(key))
        }catch (e) {
            console.log('Error getting data in local storage : %O', e)
            return Promise.reject(null)
        }
    }

    ls_delete(key) {
        try {
            return new Promise( (resolve, reject) => {
                let key_parts = key.split('/')
                let file_key = key_parts[key_parts.length - 1]
                let dir_key = key.replace(`/${file_key}`, '')
                ldb.get(dir_key, function (current_dir_content) {
                    current_dir_content = !current_dir_content ? [] : JSON.parse(current_dir_content)
                    if(current_dir_content.includes(file_key))
                        current_dir_content = current_dir_content.filter( c => c !== file_key)
                    ldb.set(dir_key, JSON.stringify(current_dir_content), function(){
                        ldb.delete(key, function(){
                            resolve(true)
                        });
                    });
                });
            })
            /*let key_parts = key.split('/')
            let file_key = key_parts[key_parts.length - 1]
            let dir_key = key.replace(`/${file_key}`, '')
            let current_dir_content = localStorage.getItem(dir_key)
            current_dir_content = !current_dir_content ? [] : JSON.parse(current_dir_content)
            if(current_dir_content.includes(file_key))
                current_dir_content = current_dir_content.filter( c => c !== file_key)
            localStorage.setItem(dir_key, JSON.stringify(current_dir_content))
            localStorage.removeItem(key)
            return true*/
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
            /*localStorage.setItem(key, JSON.stringify([]))
            return true*/
        } catch (e) {
            console.log('Error getting data in local storage : %O', e)
            return Promise.reject(false)
        }

    }
}

module.exports = ContentManager
