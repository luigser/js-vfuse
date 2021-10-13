class ContentManager{
    constructor(networkManager){
        this.networkManager = networkManager
    }

    //MFS API
    async save(path, content, options){
        try{
            await this.networkManager.writeFile(path, content, options)
            if(options && options.pin){
                await this.networkManager.pinFileInMFS(path)
            }
        }catch(e){
            console.log('Got some error during saving : %O', e)
        }
    }

    async get(path, options){
        try{
            return await this.networkManager.readFile(path, options)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    async list(path){
        try{
            return await this.networkManager.list(path)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    async update(path, options){}

    async delete(path, options){
        try{
            return await this.networkManager.delete(path, option)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }

    async publish(path, options){

    }

    async unpublish(path, options){

    }

    //REGULAR API

    async regularGet(path, options){
        try{
            return await this.networkManager.get(path, options)
        }catch(e){
            console.log('Got some error during getting : %O', e)
        }
    }
}

module.exports = ContentManager
