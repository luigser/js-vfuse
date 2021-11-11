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
            case Constants.JOB_SATUS.WAITING:
                color = Constants.JOB_SATUS.COLORS.WAITING
                break
            case Constants.JOB_SATUS.COMPLETED:
                color = Constants.JOB_SATUS.COLORS.COMPLETED
                break
            case Constants.JOB_SATUS.ERROR:
                color = Constants.JOB_SATUS.COLORS.ERROR
                break
            case Constants.JOB_SATUS.READY:
                color = Constants.JOB_SATUS.COLORS.READY
                break
        }
        return {
            background : color,
            border : Miscellaneous.shadeColor(color,-40),
            highlight : color + 'E6',
            hover : {
                background : color + 'E6'
            }
        }
    }
}

module.exports = Miscellaneous
