const Constants = require("../components/constants");

const Miscellaneous = {
    shadeColor : (color, percent) => {//positive -> lighter | negative -> darken

        let R = parseInt(color.substring(1,3),16);
        let G = parseInt(color.substring(3,5),16);
        let B = parseInt(color.substring(5,7),16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R<255)?R:255;
        G = (G<255)?G:255;
        B = (B<255)?B:255;

        let RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
        let GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
        let BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        return "#"+RR+GG+BB;
    },
    getColor : (status) => {
        let color = '#838383'
        switch (status) {
            case Constants.JOB.STATUS.WAITING:
                color = Constants.JOB.STATUS.COLORS.WAITING
                break
            case Constants.JOB.STATUS.COMPLETED:
                color = Constants.JOB.STATUS.COLORS.COMPLETED
                break
            case Constants.JOB.STATUS.ERROR:
                color = Constants.JOB.STATUS.COLORS.ERROR
                break
            case Constants.JOB.STATUS.READY:
                color = Constants.JOB.STATUS.COLORS.READY
                break
            case Constants.JOB.STATUS.ENDLESS:
                color = Constants.JOB.STATUS.COLORS.ENDLESS
                break
        }
        return {
            background : color,
            border : Miscellaneous.shadeColor(color,-40),
            highlight : color + 'CC',
            hover : {
                background : color + 'CC'
            }
        }
    },
    splitToChunks : (array, parts) => {
        let result = [];
        for (let i = parts; i > 0; i--) {
            result.push(array.splice(0, Math.ceil(array.length / i)));
        }
        return result;
    },
    arrayChunks : (array) => {
        let encoded = JSON.stringify(array)
        let chunks = Math.ceil(encoded.length / 1000000)
        return Miscellaneous.splitToChunks(array, (array.length - Math.floor(array.length / chunks)))
    }
}

module.exports = Miscellaneous
