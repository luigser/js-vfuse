import GStore from './libs/GStore/store';

export const StoreInstance = (function() {
    let instance = null;
    let init = function() {
        return GStore(
            {
                vFuseNode : null
            }
        )
    };
    return {
        getInstance: function() {
            if (!instance) {
                instance = init();

            }
            return instance;
        }
    };

})();

export const gStore = StoreInstance.getInstance();